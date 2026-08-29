const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const PlacementTeam = require('../models/PlacementTeam');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const upload = require('../middleware/upload');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const { status, approvalStatus, assignedMember, search } = req.query;
    let query = { isArchived: false };

    if (status) query.status = status;
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (assignedMember) query.assignedMember = assignedMember;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const companies = await Company.find(query).populate('assignedMember', 'name email');
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id).populate('assignedMember', 'name email').populate('createdBy', 'name email');
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/placements', async (req, res, next) => {
  try {
    const Placement = require('../models/Placement');
    const placements = await Placement.find({ company: req.params.id, status: 'selected' })
      .populate('student', 'name rollNumber department');
    res.status(200).json({ success: true, data: placements });
  } catch (error) {
    next(error);
  }
});

router.post('/', authorize('admin', 'lead', 'manager', 'member'), async (req, res, next) => {
  try {
    // If the creator is a member or lead, they should be the assignedMember implicitly
    const assignedMemberId = (req.user.role === 'member' || req.user.role === 'lead') ? req.user._id : (req.body.assignedMember || req.user._id);
    
    const companyData = { ...req.body, createdBy: req.user._id, assignedMember: assignedMemberId };
    const company = await Company.create(companyData);

    // Add this company to the user's PlacementTeam record so it reflects on Dashboard
    await PlacementTeam.findOneAndUpdate(
      { user: req.user._id },
      { $push: { assignedCompanies: company._id } }
    );

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'Create',
      entity: 'Company',
      entityId: company._id,
      details: `Created company ${company.name}`
    });

    res.status(201).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'Update',
      entity: 'Company',
      entityId: company._id,
      details: `Updated company ${company.name}`
    });

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, { isArchived: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'Archive',
      entity: 'Company',
      entityId: company._id,
      details: `Archived company ${company.name}`
    });

    res.status(200).json({ success: true, message: 'Company archived' });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/status', async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    company.status = status;
    company.statusHistory.push({
      status,
      changedBy: req.user._id,
      note
    });
    await company.save();

    if (status === 'drive_completed') {
      await Notification.create({
        user: company.createdBy || req.user._id,
        title: 'Drive Completed',
        message: `Placement drive for ${company.name} is marked as completed.`,
        type: 'drive_completed',
        relatedEntity: 'Company',
        relatedId: company._id
      });
    }

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'Update Status',
      entity: 'Company',
      entityId: company._id,
      details: `Changed status of ${company.name} to ${status}`
    });

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/forward', authorize('lead', 'manager', 'admin'), async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    company.approvalStatus = 'forwarded';
    await company.save();

    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' });
    const notifications = admins.map(admin => ({
      user: admin._id,
      title: 'Company Forwarded',
      message: `${company.name} has been forwarded for approval.`,
      type: 'company_forwarded',
      relatedEntity: 'Company',
      relatedId: company._id
    }));
    await Notification.insertMany(notifications);

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'Forward',
      entity: 'Company',
      entityId: company._id,
      details: `Forwarded company ${company.name} for approval`
    });

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/approve', authorize('admin'), async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    company.approvalStatus = 'approved';
    await company.save();

    if (company.createdBy) {
      await Notification.create({
        user: company.createdBy,
        title: 'Company Approved',
        message: `${company.name} has been approved.`,
        type: 'company_approved',
        relatedEntity: 'Company',
        relatedId: company._id
      });
    }

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'Approve',
      entity: 'Company',
      entityId: company._id,
      details: `Approved company ${company.name}`
    });

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/reject', authorize('admin'), async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    company.approvalStatus = 'rejected';
    await company.save();

    if (company.createdBy) {
      await Notification.create({
        user: company.createdBy,
        title: 'Company Rejected',
        message: `${company.name} has been rejected.`,
        type: 'company_rejected',
        relatedEntity: 'Company',
        relatedId: company._id
      });
    }

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'Reject',
      entity: 'Company',
      entityId: company._id,
      details: `Rejected company ${company.name}`
    });

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/upload-jd', upload.single('file'), async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const filePath = req.file.path;
    let extractedText = '';

    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      extractedText = data.text;
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || req.file.mimetype === 'application/msword') {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;
    }

    // Simple keyword extraction
    const commonTechSkills = ['javascript', 'python', 'java', 'react', 'node.js', 'node', 'html', 'css', 'sql', 'mongodb', 'c++', 'machine learning', 'data science', 'angular', 'typescript', 'docker', 'aws', 'git', 'rest api', 'spring boot', 'flutter', 'django'];
    const words = extractedText.toLowerCase().split(/[\s,]+/);
    const foundSkills = [...new Set(words.filter(w => commonTechSkills.includes(w)))];

    company.jobDescription = extractedText;
    company.jdFileUrl = `/uploads/${req.file.filename}`;
    company.jdParsedData = {
      skills: foundSkills,
      keywords: foundSkills,
      qualifications: [],
      experience: '',
      jobTitle: ''
    };
    await company.save();

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
