const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Company = require('../models/Company');
const PlacementTeam = require('../models/PlacementTeam');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', async (req, res, next) => {
  try {
    const students = await Student.find({ isArchived: false });
    const companies = await Company.find({ isArchived: false });
    const team = await PlacementTeam.find().populate('user', 'name');

    const totalStudents = students.length;
    const placedStudents = students.filter(s => s.placementStatus === 'placed').length;
    const placementPercentage = totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(2) : 0;
    
    const departmentStrength = {};
    const genderDist = {};
    const academicBrackets = { 'below60': 0, '60-70': 0, '70-80': 0, '80-90': 0, 'above90': 0 };

    students.forEach(s => {
      departmentStrength[s.department] = (departmentStrength[s.department] || 0) + 1;
      if (s.gender) genderDist[s.gender] = (genderDist[s.gender] || 0) + 1;
      
      const ug = s.ugPercentage || 0;
      if (ug < 60) academicBrackets['below60']++;
      else if (ug < 70) academicBrackets['60-70']++;
      else if (ug < 80) academicBrackets['70-80']++;
      else if (ug < 90) academicBrackets['80-90']++;
      else academicBrackets['above90']++;
    });

    const companyPipeline = { cold: 0, warm: 0, hot: 0, drive_completed: 0 };
    let totalOffers = 0;
    companies.forEach(c => {
      companyPipeline[c.status] = (companyPipeline[c.status] || 0) + 1;
      totalOffers += c.offersCount || 0;
    });

    const topDrives = companies
      .filter(c => c.status === 'drive_completed')
      .sort((a, b) => b.studentsPlaced - a.studentsPlaced)
      .slice(0, 5)
      .map(c => ({ company: c.name, studentsAppeared: c.studentsAppeared, studentsPlaced: c.studentsPlaced, ctc: c.ctc }));

    const teamWithCompanies = await PlacementTeam.find().populate({
      path: 'assignedCompanies',
      populate: [
        { path: 'createdBy', select: 'name' },
        { path: 'statusHistory.changedBy', select: 'name' }
      ]
    });
    const teamStats = teamWithCompanies.map(t => {
      const stats = { cold: 0, warm: 0, hot: 0, drive_completed: 0, totalOffers: 0, totalCompanies: 0 };
      (t.assignedCompanies || []).forEach(c => {
        if (c.status) stats[c.status] = (stats[c.status] || 0) + 1;
        stats.totalOffers += c.offersCount || 0;
        stats.totalCompanies += 1;
      });
      return { 
        name: t.name, 
        ...stats,
        companies: t.assignedCompanies || []
      };
    });

    const deptArray = Object.entries(departmentStrength).map(([key, val]) => ({ _id: key, count: val }));
    const genderArray = Object.entries(genderDist).map(([key, val]) => ({ _id: key, count: val }));

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        placedStudents,
        totalPlaced: placedStudents,
        placementPercentage,
        departmentStrength: deptArray,
        genderDistribution: genderArray,
        academicBrackets,
        totalCompanies: companies.length,
        companyPipeline,
        totalOffers,
        topDrives,
        teamStats
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
