const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const Placement = require('../models/Placement');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/company-registrations', async (req, res, next) => {
  try {
    const companies = await Company.find({ status: { $in: ['warm', 'hot'] }, isArchived: false });
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    next(error);
  }
});

router.get('/drive-selections', async (req, res, next) => {
  try {
    const companies = await Company.find({ status: 'drive_completed', isArchived: false });
    const companyIds = companies.map(c => c._id);
    
    const selections = await Placement.find({ 
      company: { $in: companyIds },
      status: 'selected' 
    }).populate('student').populate('company');
    
    const data = selections.map(s => ({
      rollNumber: s.student?.rollNumber,
      studentName: s.student?.name,
      department: s.student?.department,
      companyName: s.company?.name,
      ctc: s.packageOffered || s.company?.ctc
    }));
    
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/placement-master', async (req, res, next) => {
  try {
    const students = await Student.find({ isArchived: false });
    
    const data = students.map(student => ({
      rollNumber: student.rollNumber,
      studentName: student.name,
      department: student.department,
      status: student.placementStatus === 'placed' ? 'Placed' : 'YTBP',
      company: student.placedCompany || '-',
      ctc: student.ctc || '-'
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/company-master', async (req, res, next) => {
  try {
    const companies = await Company.find({ isArchived: false }).populate('assignedMember', 'name email');
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
