const express = require('express');
const router = express.Router();
const multer = require('multer');
const { DB, genId, saveStudents, saveAuditLogs } = require('../utils/excelDatabase');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const upload = multer({ dest: 'uploads/' });
router.use(protect);

// Map the exact Excel keys to what the frontend expects
const mapStudent = (s) => {
  const rawStatus = String(s['Placement Status'] || '').trim().toUpperCase();
  const rollNo = s['Roll No'];
  
  // Find placement details if placed
  let placedCompany = null;
  let ctc = null;
  
  if (rawStatus === 'PLACED') {
    const placement = DB.placements.find(p => p.studentId === rollNo && (p.status === 'selected' || p.status === 'joined' || p.status === 'offer_letter'));
    if (placement) {
      const company = DB.companies.find(c => c.id === placement.companyId);
      if (company) {
        placedCompany = company.name;
        ctc = placement.ctc || company.ctc;
      }
    }
  }

  return {
    id: rollNo,
    _id: rollNo, // Frontend expects _id
    rollNumber: rollNo,
    name: s['Name'],
    department: s['Department'],
    gender: s['Gender'],
    hostelStatus: s['Student Type'],
    sslcPercentage: parseFloat(s['SSLC %']) || null,
    hscPercentage: parseFloat(s['HSC %']) || null,
    ugPercentage: parseFloat(s['UG %']) || null,
    pgPercentage: parseFloat(s['PG %']) || null,
    github: s['GitHub ID'],
    linkedin: s['LinkedIn ID'],
    resumeUrl: s['Resume Link'],
    portfolioUrl: s['Portfolio'],
    email: s['College Email ID'] || s['Personal Email ID'],
    mobile: s['Mobile No'],
    photoUrl: s['Student Photo'],
    graduationYear: s['Graduation Date'] ? parseInt(String(s['Graduation Date']).substring(0,4)) : null,
    skills: [], // No skills in excel
    isArchived: false,
    placementStatus: rawStatus === 'PLACED' ? 'placed' : 'unplaced',
    placedCompany,
    ctc
  };
};

const isFalse = (val) => val === false || val === 'false';
const isTrue = (val) => val === true || val === 'true';

router.get('/', (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, department, gender, hostelStatus, placementStatus, graduationYear,
      minPercentage, maxPercentage, sort, order, showArchived } = req.query;

    let results = [...DB.students];
    
    // Convert all students to frontend model first
    results = results.map(mapStudent);

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(s => String(s.name || '').toLowerCase().includes(q) || String(s.rollNumber || '').toLowerCase().includes(q));
    }
    if (department) results = results.filter(s => s.department === department);
    if (gender) results = results.filter(s => s.gender === gender);
    if (hostelStatus) results = results.filter(s => s.hostelStatus === hostelStatus);
    if (placementStatus) results = results.filter(s => s.placementStatus === placementStatus);
    if (graduationYear) results = results.filter(s => Number(s.graduationYear) === parseInt(graduationYear));
    if (minPercentage) results = results.filter(s => Number(s.ugPercentage) >= Number(minPercentage));
    if (maxPercentage) results = results.filter(s => Number(s.ugPercentage) <= Number(maxPercentage));

    // Sort
    const sortField = sort || 'rollNumber';
    const isDesc = order === 'desc';
    results.sort((a, b) => {
      let valA = a[sortField]; let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return isDesc ? 1 : -1;
      if (valA > valB) return isDesc ? -1 : 1;
      return 0;
    });

    const total = results.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginated = results.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      data: paginated,
      total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) { next(error); }
});

router.get('/stats', (req, res, next) => {
  try {
    const results = DB.students.map(mapStudent);
    const stats = {
      total: results.length,
      department: {}, gender: {},
      academicBrackets: { below60: 0, '60-70': 0, '70-75': 0, '75-80': 0, '80-90': 0, above90: 0 },
      placementStatus: { unplaced: 0, placed: 0, opted_out: 0 }
    };
    results.forEach(s => {
      if (s.department) stats.department[s.department] = (stats.department[s.department] || 0) + 1;
      if (s.gender) stats.gender[s.gender] = (stats.gender[s.gender] || 0) + 1;
      const status = s.placementStatus || 'unplaced';
      stats.placementStatus[status] = (stats.placementStatus[status] || 0) + 1;
      
      const ug = Number(s.ugPercentage) || 0;
      if (ug < 60) stats.academicBrackets.below60++;
      else if (ug < 70) stats.academicBrackets['60-70']++;
      else if (ug < 75) stats.academicBrackets['70-75']++;
      else if (ug < 80) stats.academicBrackets['75-80']++;
      else if (ug < 90) stats.academicBrackets['80-90']++;
      else stats.academicBrackets.above90++;
    });
    res.status(200).json({ success: true, data: stats });
  } catch (error) { next(error); }
});

router.get('/:id', (req, res, next) => {
  try {
    const student = DB.students.find(s => s['Roll No'] === req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.status(200).json({ success: true, data: mapStudent(student) });
  } catch (error) { next(error); }
});

router.post('/', authorize('admin', 'manager'), (req, res, next) => {
  try {
    const { rollNumber, name, department, gender, hostelStatus, sslcPercentage, hscPercentage, ugPercentage, placementStatus } = req.body;
    if (DB.students.find(s => s['Roll No'] === rollNumber)) 
      return res.status(400).json({ success: false, message: 'Roll number already exists' });

    const newStudent = {
      'Roll No': rollNumber,
      'Name': name,
      'Department': department,
      'Gender': gender,
      'Student Type': hostelStatus,
      'SSLC %': sslcPercentage,
      'HSC %': hscPercentage,
      'UG %': ugPercentage,
      'PG %': '',
      'GitHub ID': req.body.github || '',
      'Resume Link': req.body.resumeUrl || '',
      'LinkedIn ID': req.body.linkedin || '',
      'Graduation Date': req.body.graduationYear ? `${req.body.graduationYear}-05-31` : '',
      'Portfolio': req.body.portfolioUrl || '',
      'Personal Email ID': req.body.email || '',
      'College Email ID': '',
      'Mobile No': req.body.mobile || '',
      'Student Photo': req.body.photoUrl || '',
      'Placement Status': placementStatus === 'placed' ? 'PLACED' : 'UNPLACED'
    };
    
    DB.students.push(newStudent);
    saveStudents();

    res.status(201).json({ success: true, data: mapStudent(newStudent) });
  } catch (error) { next(error); }
});

router.put('/:id', authorize('admin', 'manager'), (req, res, next) => {
  try {
    const idx = DB.students.findIndex(s => s['Roll No'] === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Student not found' });

    const { name, department, gender, hostelStatus, sslcPercentage, hscPercentage, ugPercentage, placementStatus } = req.body;
    
    DB.students[idx] = {
      ...DB.students[idx],
      'Name': name || DB.students[idx]['Name'],
      'Department': department || DB.students[idx]['Department'],
      'Gender': gender || DB.students[idx]['Gender'],
      'Student Type': hostelStatus || DB.students[idx]['Student Type'],
      'SSLC %': sslcPercentage || DB.students[idx]['SSLC %'],
      'HSC %': hscPercentage || DB.students[idx]['HSC %'],
      'UG %': ugPercentage || DB.students[idx]['UG %'],
      'Placement Status': placementStatus === 'placed' ? 'PLACED' : 'UNPLACED'
    };
    saveStudents();

    res.status(200).json({ success: true, data: mapStudent(DB.students[idx]) });
  } catch (error) { next(error); }
});

router.delete('/:id', authorize('admin', 'manager'), (req, res, next) => {
  try {
    const idx = DB.students.findIndex(s => s['Roll No'] === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Student not found' });
    
    // Hard delete since we don't have isArchived column
    DB.students.splice(idx, 1);
    saveStudents();

    res.status(200).json({ success: true, message: 'Student removed' });
  } catch (error) { next(error); }
});

module.exports = router;
