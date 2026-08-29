const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const Student = require('../models/Student');
const Placement = require('../models/Placement');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/companies', async (req, res, next) => {
  try {
    const companies = await Company.find({ status: { $in: ['warm', 'hot', 'drive_completed'] }, isArchived: false });
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    next(error);
  }
});

router.post('/match/:companyId', async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.companyId);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    const requiredSkills = company.jdParsedData?.skills || [];
    if (requiredSkills.length === 0) return res.status(400).json({ success: false, message: 'No skills found in company JD' });

    const students = await Student.find({ isArchived: false, placementStatus: 'unplaced' });
    const results = [];

    for (const student of students) {
      const studentSkills = student.skills.map(s => s.toLowerCase());
      let matchedCount = 0;
      
      requiredSkills.forEach(rs => {
        if (studentSkills.includes(rs.toLowerCase())) matchedCount++;
      });

      let skillScore = (matchedCount / requiredSkills.length) * 70;
      let qualScore = student.ugPercentage >= 60 ? 30 : (student.ugPercentage / 60) * 30;
      
      // Add small variance
      let variance = Math.floor(Math.random() * 5);
      let totalScore = Math.min(100, Math.round(skillScore + qualScore) + variance);

      results.push({ student, totalScore });

      await Placement.findOneAndUpdate(
        { student: student._id, company: company._id },
        { atsScore: totalScore },
        { upsert: true, new: true }
      );
    }

    results.sort((a, b) => b.totalScore - a.totalScore);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

router.get('/results/:companyId', async (req, res, next) => {
  try {
    const placements = await Placement.find({ company: req.params.companyId }).populate('student').sort({ atsScore: -1 });
    
    const stats = { bracket61_70: 0, bracket71_80: 0, bracket81_90: 0, bracket91_100: 0 };
    
    placements.forEach(p => {
      const score = p.atsScore || 0;
      if (score >= 91) stats.bracket91_100++;
      else if (score >= 81) stats.bracket81_90++;
      else if (score >= 71) stats.bracket71_80++;
      else if (score >= 61) stats.bracket61_70++;
    });

    res.status(200).json({ success: true, data: { ...stats, results: placements } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
