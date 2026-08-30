const express = require('express');
const router = express.Router();
const { DB } = require('../utils/excelDatabase');
const { protect } = require('../middleware/auth');

router.use(protect);
const isTrue = (val) => val === true || val === 'true';

const mapStudent = (s) => {
  const rawStatus = String(s['Placement Status'] || '').trim().toUpperCase();
  return {
    department: s['Department'] || 'Unknown',
    gender: s['Gender'] || 'Unknown',
    ugPercentage: parseFloat(s['UG %']) || 0,
    placementStatus: rawStatus === 'PLACED' ? 'placed' : 'unplaced',
    isArchived: false // no archived column in their Excel
  };
};

router.get('/stats', (req, res, next) => {
  try {
    const rawStudents = DB.students || [];
    const students = rawStudents.map(mapStudent);
    const companies = DB.companies.filter(c => !isTrue(c.isArchived));

    const totalStudents = students.length;
    const placedStudents = students.filter(s => s.placementStatus === 'placed').length;
    const placementPercentage = totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(2) : 0;

    const departmentStrength = {}, genderDist = {};
    const academicBrackets = { 'below60': 0, '60-70': 0, '70-80': 0, '80-90': 0, 'above90': 0 };

    students.forEach(s => {
      departmentStrength[s.department] = (departmentStrength[s.department] || 0) + 1;
      if (s.gender) genderDist[s.gender] = (genderDist[s.gender] || 0) + 1;
      const ug = Number(s.ugPercentage) || 0;
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
      totalOffers += Number(c.offersCount) || 0;
    });

    const topDrives = companies
      .filter(c => c.status === 'drive_completed')
      .sort((a, b) => (Number(b.studentsPlaced) || 0) - (Number(a.studentsPlaced) || 0))
      .slice(0, 5)
      .map(c => ({ company: c.name, studentsAppeared: c.studentsAppeared, studentsPlaced: c.studentsPlaced, ctc: c.ctc }));

    const teamStats = DB.teams.map(t => {
      const stats = { cold: 0, warm: 0, hot: 0, drive_completed: 0, totalOffers: 0, totalCompanies: 0 };
      const assignedIds = t.assignedCompanies ? t.assignedCompanies.split(',') : [];
      const comps = companies.filter(c => assignedIds.includes(c.id));
      comps.forEach(c => {
        if (c.status) stats[c.status] = (stats[c.status] || 0) + 1;
        stats.totalOffers += Number(c.offersCount) || 0;
        stats.totalCompanies += 1;
      });
      return { name: t.name, ...stats, companies: comps.map(c => ({ ...c, _id: c.id })) };
    });

    res.status(200).json({
      success: true,
      data: {
        totalStudents, placedStudents, totalPlaced: placedStudents, placementPercentage,
        departmentStrength: Object.entries(departmentStrength).map(([k, v]) => ({ _id: k, count: v })),
        genderDistribution: Object.entries(genderDist).map(([k, v]) => ({ _id: k, count: v })),
        academicBrackets, totalCompanies: companies.length, companyPipeline, totalOffers, topDrives, teamStats
      }
    });
  } catch (error) { next(error); }
});

module.exports = router;
