const express = require('express');
const router = express.Router();
const { DB } = require('../utils/excelDatabase');
const { protect } = require('../middleware/auth');
router.use(protect);

const isTrue = (val) => val === true || val === 'true';
const strToSkills = (str) => str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];

router.get('/companies', (req, res, next) => {
  try {
    const companies = DB.companies.filter(c => !isTrue(c.isArchived) && ['warm', 'hot', 'drive_completed'].includes(c.status));
    res.status(200).json({ success: true, data: companies.map(c => ({ ...c, _id: c.id, jdParsedData: { skills: strToSkills(c.jdSkills) } })) });
  } catch (error) { next(error); }
});

router.post('/match/:companyId', (req, res, next) => {
  // Already in ATS, just copying basic functionality over if they hit reports endpoint.
  res.status(200).json({ success: true, data: [] });
});

router.get('/results/:companyId', (req, res, next) => {
  res.status(200).json({ success: true, data: { bracket61_70: 0, bracket71_80: 0, bracket81_90: 0, bracket91_100: 0, results: [] } });
});

router.get('/company-registrations', (req, res, next) => {
  try {
    const companies = DB.companies.filter(c => !isTrue(c.isArchived));
    res.status(200).json({ success: true, data: companies.map(c => ({ ...c, _id: c.id })) });
  } catch (error) { next(error); }
});

router.get('/drive-selections', (req, res, next) => {
  try {
    const drives = DB.companies.filter(c => c.status === 'drive_completed').map(c => c.id);
    const placements = DB.placements.filter(p => (p.status === 'selected' || p.status === 'joined' || p.status === 'offer_letter') && drives.includes(p.companyId));
    
    const data = placements.map(p => {
      const student = DB.students.find(s => s['Roll No'] === p.studentId);
      const company = DB.companies.find(c => c.id === p.companyId);
      return {
        rollNumber: student ? student['Roll No'] : '-',
        studentName: student ? student['Name'] : '-',
        department: student ? student['Department'] : '-',
        companyName: company?.name,
        ctc: p.ctc || company?.ctc
      };
    });
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/placement-master', (req, res, next) => {
  try {
    const students = DB.students.filter(s => !isTrue(s.isArchived));
    const data = students.map(s => {
      const rawStatus = String(s['Placement Status'] || '').trim().toUpperCase();
      let placedCompany = null;
      let ctc = null;
      if (rawStatus === 'PLACED') {
        const placement = DB.placements.find(p => p.studentId === s['Roll No'] && (p.status === 'selected' || p.status === 'joined' || p.status === 'offer_letter'));
        if (placement) {
          const company = DB.companies.find(c => c.id === placement.companyId);
          placedCompany = company?.name;
          ctc = placement.ctc || company?.ctc;
        }
      }
      return {
        rollNumber: s['Roll No'],
        studentName: s['Name'],
        department: s['Department'],
        status: rawStatus === 'PLACED' ? 'Placed' : 'YTBP',
        companyName: placedCompany || '-',
        ctc: ctc || '-'
      };
    });
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/company-master', (req, res, next) => {
  try {
    const companies = DB.companies.filter(c => !isTrue(c.isArchived)).map(c => {
      const user = DB.users.find(u => u.id === c.assignedMemberId);
      return {
        ...c, _id: c.id,
        assignedMemberName: user ? user.name : '-'
      };
    });
    res.status(200).json({ success: true, data: companies });
  } catch (error) { next(error); }
});

module.exports = router;
