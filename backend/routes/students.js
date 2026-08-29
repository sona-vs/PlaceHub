const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const upload = require('../middleware/upload');
const xlsx = require('xlsx');

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const { search, department, gender, hostelStatus, graduationYear, minPercentage, maxPercentage, page = 1, limit = 10, sort, order, showArchived } = req.query;
    
    let query = {};
    if (!showArchived || showArchived !== 'true') {
      query.isArchived = false;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }
    if (department) query.department = department;
    if (gender) query.gender = gender;
    if (hostelStatus) query.hostelStatus = hostelStatus;
    if (graduationYear) query.graduationYear = graduationYear;
    
    if (minPercentage || maxPercentage) {
      query.ugPercentage = {};
      if (minPercentage) query.ugPercentage.$gte = Number(minPercentage);
      if (maxPercentage) query.ugPercentage.$lte = Number(maxPercentage);
    }

    const sortOptions = {};
    if (sort) {
      sortOptions[sort] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1;
    }

    const students = await Student.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Student.countDocuments(query);

    res.status(200).json({
      success: true,
      data: students,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const students = await Student.find({ isArchived: false });
    
    const stats = {
      total: students.length,
      department: {},
      gender: {},
      academicBrackets: { below60: 0, '60-70': 0, '70-75': 0, '75-80': 0, '80-90': 0, above90: 0 },
      placementStatus: { unplaced: 0, placed: 0, opted_out: 0 }
    };

    students.forEach(s => {
      // Dept
      stats.department[s.department] = (stats.department[s.department] || 0) + 1;
      // Gender
      if (s.gender) stats.gender[s.gender] = (stats.gender[s.gender] || 0) + 1;
      // Placement
      if (s.placementStatus) stats.placementStatus[s.placementStatus] = (stats.placementStatus[s.placementStatus] || 0) + 1;
      // Academics
      if (s.ugPercentage < 60) stats.academicBrackets.below60++;
      else if (s.ugPercentage < 70) stats.academicBrackets['60-70']++;
      else if (s.ugPercentage < 75) stats.academicBrackets['70-75']++;
      else if (s.ugPercentage < 80) stats.academicBrackets['75-80']++;
      else if (s.ugPercentage < 90) stats.academicBrackets['80-90']++;
      else stats.academicBrackets.above90++;
    });

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

router.get('/template', async (req, res, next) => {
  try {
    const ws_name = "Students";
    const wb = xlsx.utils.book_new();
    const ws_data = [
      ["Roll Number", "Student Name", "Department", "Gender", "Hostel Status", "SSLC %", "HSC %", "UG %", "PG %", "Graduation Year", "Email", "Mobile", "GitHub", "LinkedIn", "Resume URL", "Portfolio URL", "Photo URL", "Skills"]
    ];
    const ws = xlsx.utils.aoa_to_sheet(ws_data);
    xlsx.utils.book_append_sheet(wb, ws, ws_name);
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename="student_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
});

router.post('/', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { rollNumber } = req.body;
    const exists = await Student.findOne({ rollNumber });
    if (exists) return res.status(400).json({ success: false, message: 'Roll number already exists' });
    
    const student = await Student.create(req.body);
    
    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'Create',
      entity: 'Student',
      entityId: student._id,
      details: `Created student ${student.name} (${student.rollNumber})`
    });

    res.status(201).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'Update',
      entity: 'Student',
      entityId: student._id,
      details: `Updated student ${student.name} (${student.rollNumber})`
    });

    res.status(200).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, { isArchived: true });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'Archive',
      entity: 'Student',
      entityId: student._id,
      details: `Archived student ${student.name} (${student.rollNumber})`
    });

    res.status(200).json({ success: true, message: 'Student archived' });
  } catch (error) {
    next(error);
  }
});

router.post('/import', authorize('admin', 'manager'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload an Excel file' });
    
    const workbook = xlsx.readFile(req.file.path);
    const sheet_name = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name]);
    
    let imported = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const mappedRow = {
          rollNumber: row['Roll Number'],
          name: row['Student Name'],
          department: row['Department'],
          gender: row['Gender'],
          hostelStatus: row['Hostel Status'],
          sslcPercentage: row['SSLC %'],
          hscPercentage: row['HSC %'],
          ugPercentage: row['UG %'],
          pgPercentage: row['PG %'],
          graduationYear: row['Graduation Year'],
          email: row['Email'],
          mobile: row['Mobile'],
          github: row['GitHub'],
          linkedin: row['LinkedIn'],
          resumeUrl: row['Resume URL'],
          portfolioUrl: row['Portfolio URL'],
          photoUrl: row['Photo URL'],
          skills: row['Skills'] ? row['Skills'].split(',').map(s => s.trim()) : []
        };

        if (!mappedRow.rollNumber || !mappedRow.name || !mappedRow.department) {
          failed++;
          errors.push({ row: i+2, reason: 'Missing required fields (Roll Number, Name, or Department)' });
          continue;
        }
        
        const exists = await Student.findOne({ rollNumber: mappedRow.rollNumber });
        if (exists) {
          failed++;
          errors.push({ row: i+2, reason: `Roll number ${mappedRow.rollNumber} already exists` });
          continue;
        }

        await Student.create(mappedRow);
        imported++;
      } catch (err) {
        failed++;
        errors.push({ row: i+2, reason: err.message });
      }
    }

    res.status(200).json({ success: true, imported, failed, errors });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
