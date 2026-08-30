const express = require('express');
const router = express.Router();
const { DB, genId, savePlacements } = require('../utils/excelDatabase');
const { protect } = require('../middleware/auth');

router.use(protect);
const isTrue = (val) => val === true || val === 'true';
const strToSkills = (str) => str ? String(str).split(',').map(s => s.trim()).filter(Boolean) : [];

const mapStudent = (s) => {
  const rawStatus = String(s['Placement Status'] || '').trim().toUpperCase();
  return {
    id: s['Roll No'],
    _id: s['Roll No'],
    rollNumber: s['Roll No'],
    name: s['Name'],
    department: s['Department'],
    ugPercentage: parseFloat(s['UG %']) || 0,
    skills: [], // no skills in new Excel schema
    placementStatus: rawStatus === 'PLACED' ? 'placed' : 'unplaced',
    isArchived: false
  };
};

router.get('/companies', (req, res, next) => {
  try {
    const companies = DB.companies.filter(c => !isTrue(c.isArchived) && ['warm', 'hot', 'drive_completed'].includes(c.status));
    res.status(200).json({ success: true, data: companies.map(c => ({ ...c, _id: c.id, jdParsedData: { skills: strToSkills(c.jdSkills) } })) });
  } catch (error) { next(error); }
});

router.post('/match/:companyId', (req, res, next) => {
  try {
    const company = DB.companies.find(c => c.id === req.params.companyId);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    const requiredSkills = strToSkills(company.jdSkills);
    if (requiredSkills.length === 0)
      return res.status(400).json({ success: false, message: 'No skills found in company JD' });

    const students = DB.students.map(mapStudent).filter(s => !s.isArchived && s.placementStatus === 'unplaced');
    const results = [];

    for (const student of students) {
      const studentSkills = strToSkills(student.skills).map(s => s.toLowerCase());
      let matchedCount = 0;
      requiredSkills.forEach(rs => { if (studentSkills.includes(rs.toLowerCase())) matchedCount++; });

      const skillScore = (matchedCount / requiredSkills.length) * 70;
      const ugPct = Number(student.ugPercentage) || 0;
      const qualScore = ugPct >= 60 ? 30 : (ugPct / 60) * 30;
      const totalScore = Math.min(100, Math.round(skillScore + qualScore) + Math.floor(Math.random() * 5));

      results.push({ student: { ...student, _id: student.id, skills: strToSkills(student.skills) }, atsScore: totalScore });

      const existing = DB.placements.find(p => p.studentId === student.id && p.companyId === company.id);
      if (existing) {
        existing.atsScore = totalScore;
      } else {
        DB.placements.push({ id: genId(), studentId: student.id, companyId: company.id, atsScore: totalScore, status: 'applied', appliedDate: new Date().toISOString() });
      }
    }
    savePlacements();
    results.sort((a, b) => b.atsScore - a.atsScore);
    res.status(200).json({ success: true, data: results });
  } catch (error) { next(error); }
});

router.get('/results/:companyId', (req, res, next) => {
  try {
    let placements = DB.placements.filter(p => p.companyId === req.params.companyId);
    placements.sort((a, b) => (b.atsScore || 0) - (a.atsScore || 0));

    const stats = { bracket61_70: 0, bracket71_80: 0, bracket81_90: 0, bracket91_100: 0 };
    placements.forEach(p => {
      const score = p.atsScore || 0;
      if (score >= 91) stats.bracket91_100++;
      else if (score >= 81) stats.bracket81_90++;
      else if (score >= 71) stats.bracket71_80++;
      else if (score >= 61) stats.bracket61_70++;
    });

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        results: placements.map(p => {
          let student = DB.students.find(s => s['Roll No'] === p.studentId);
          if (student) student = mapStudent(student);
          return {
            ...p, _id: p.id,
            student: student || null
          };
        })
      }
    });
  } catch (error) { next(error); }
});

module.exports = router;
