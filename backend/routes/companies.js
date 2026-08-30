const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { DB, genId, saveCompanies, saveAuditLogs, saveNotifications, saveCompanyStatusHistory } = require('../utils/excelDatabase');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const upload = multer({ dest: 'uploads/' });
router.use(protect);

const mapCompany = (c) => {
  if (!c) return c;
  return {
    ...c,
    _id: c.id,
    jdParsedData: {
      skills: c.jdSkills ? c.jdSkills.split(',').filter(Boolean) : [],
      qualifications: c.jdQualifications ? c.jdQualifications.split(',').filter(Boolean) : [],
      experience: c.jdExperience || '',
      jobTitle: c.jdJobTitle || '',
      keywords: c.jdKeywords ? c.jdKeywords.split(',').filter(Boolean) : [],
    },
    statusHistory: DB.companyStatusHistory.filter(h => h.companyId === c.id).map(h => ({
      ...h,
      changedBy: DB.users.find(u => u.id === h.changedById) || null
    })),
    assignedMember: DB.users.find(u => u.id === c.assignedMemberId) || null,
    createdBy: DB.users.find(u => u.id === c.createdById) || null,
  };
};

const isTrue = (val) => val === true || val === 'true';

router.get('/', (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, approvalStatus, sort, order } = req.query;
    
    let results = DB.companies.filter(c => !isTrue(c.isArchived));

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(c => String(c.name || '').toLowerCase().includes(q));
    }
    if (status) results = results.filter(c => c.status === status);
    if (approvalStatus) results = results.filter(c => c.approvalStatus === approvalStatus);

    const sortField = sort || 'createdAt';
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
      data: paginated.map(mapCompany),
      total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) { next(error); }
});

router.get('/:id', (req, res, next) => {
  try {
    const company = DB.companies.find(c => c.id === req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.status(200).json({ success: true, data: mapCompany(company) });
  } catch (error) { next(error); }
});

router.get('/:id/placements', (req, res, next) => {
  try {
    const companyId = req.params.id;
    const placements = DB.placements.filter(p => p.companyId === companyId && (p.status === 'selected' || p.status === 'joined' || p.status === 'offer_letter'));
    
    // Attach student info
    const enrichedPlacements = placements.map(p => {
      const student = DB.students.find(s => s['Roll No'] === p.studentId);
      return {
        ...p,
        _id: p.id,
        student: student ? {
          rollNumber: student['Roll No'],
          name: student['Name'],
          department: student['Department']
        } : null
      };
    });

    res.status(200).json({ success: true, data: enrichedPlacements });
  } catch (error) { next(error); }
});

router.post('/', (req, res, next) => {
  try {
    const assignedMemberId = (req.user.role === 'member' || req.user.role === 'lead')
      ? req.user.id : (req.body.assignedMember || req.user.id);
    
    const { jdParsedData, ...rest } = req.body;
    
    const company = {
      id: genId(),
      ...rest,
      ctc: rest.ctc ? parseFloat(rest.ctc) : null,
      createdById: req.user.id,
      assignedMemberId,
      jdSkills: jdParsedData?.skills?.join(',') || null,
      jdQualifications: jdParsedData?.qualifications?.join(',') || null,
      jdExperience: jdParsedData?.experience || null,
      jdJobTitle: jdParsedData?.jobTitle || null,
      jdKeywords: jdParsedData?.keywords?.join(',') || null,
      status: rest.status || 'cold',
      approvalStatus: 'pending',
      isArchived: false,
      createdAt: new Date().toISOString()
    };
    
    DB.companies.push(company);
    saveCompanies();

    DB.auditLogs.push({ id: genId(), userId: req.user.id, userName: req.user.name, action: 'Create', entity: 'Company', entityId: company.id, details: `Created company ${company.name}`, timestamp: new Date().toISOString() });
    saveAuditLogs();

    res.status(201).json({ success: true, data: mapCompany(company) });
  } catch (error) { next(error); }
});

router.put('/:id', (req, res, next) => {
  try {
    const idx = DB.companies.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Company not found' });

    const { jdParsedData, _id, statusHistory, assignedMember, createdBy, ...rest } = req.body;
    
    DB.companies[idx] = {
      ...DB.companies[idx],
      ...rest,
      ctc: rest.ctc ? parseFloat(rest.ctc) : DB.companies[idx].ctc,
      jdSkills: jdParsedData?.skills ? jdParsedData.skills.join(',') : DB.companies[idx].jdSkills,
      jdQualifications: jdParsedData?.qualifications ? jdParsedData.qualifications.join(',') : DB.companies[idx].jdQualifications,
      jdExperience: jdParsedData?.experience || DB.companies[idx].jdExperience,
      jdJobTitle: jdParsedData?.jobTitle || DB.companies[idx].jdJobTitle,
      jdKeywords: jdParsedData?.keywords ? jdParsedData.keywords.join(',') : DB.companies[idx].jdKeywords,
    };
    saveCompanies();

    DB.auditLogs.push({ id: genId(), userId: req.user.id, userName: req.user.name, action: 'Update', entity: 'Company', entityId: req.params.id, details: `Updated company ${DB.companies[idx].name}`, timestamp: new Date().toISOString() });
    saveAuditLogs();

    res.status(200).json({ success: true, data: mapCompany(DB.companies[idx]) });
  } catch (error) { next(error); }
});

router.delete('/:id', authorize('admin'), (req, res, next) => {
  try {
    const idx = DB.companies.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Company not found' });

    DB.companies[idx].isArchived = true;
    saveCompanies();

    DB.auditLogs.push({ id: genId(), userId: req.user.id, userName: req.user.name, action: 'Archive', entity: 'Company', entityId: req.params.id, details: `Archived company ${DB.companies[idx].name}`, timestamp: new Date().toISOString() });
    saveAuditLogs();

    res.status(200).json({ success: true, message: 'Company archived' });
  } catch (error) { next(error); }
});

router.put('/:id/status', (req, res, next) => {
  try {
    const { status, note } = req.body;
    const idx = DB.companies.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Company not found' });
    
    DB.companies[idx].status = status;
    saveCompanies();
    
    DB.companyStatusHistory.push({ id: genId(), companyId: req.params.id, status, changedById: req.user.id, note, changedAt: new Date().toISOString() });
    saveCompanyStatusHistory();

    if (status === 'drive_completed' && DB.companies[idx].createdById) {
      DB.notifications.push({ id: genId(), userId: DB.companies[idx].createdById, title: 'Drive Completed', message: `Placement drive for ${DB.companies[idx].name} completed.`, type: 'drive_completed', relatedEntity: 'Company', relatedId: req.params.id, isRead: false, createdAt: new Date().toISOString() });
      saveNotifications();
    }

    DB.auditLogs.push({ id: genId(), userId: req.user.id, userName: req.user.name, action: 'Update Status', entity: 'Company', entityId: req.params.id, details: `Changed status to ${status}`, timestamp: new Date().toISOString() });
    saveAuditLogs();

    res.status(200).json({ success: true, data: mapCompany(DB.companies[idx]) });
  } catch (error) { next(error); }
});

router.post('/:id/forward', authorize('lead', 'manager', 'admin'), (req, res, next) => {
  try {
    const idx = DB.companies.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Company not found' });
    
    DB.companies[idx].approvalStatus = 'forwarded';
    saveCompanies();
    
    const admins = DB.users.filter(u => u.role === 'admin');
    admins.forEach(admin => {
      DB.notifications.push({ id: genId(), userId: admin.id, title: 'Company Forwarded', message: `${DB.companies[idx].name} forwarded for approval.`, type: 'company_forwarded', relatedEntity: 'Company', relatedId: req.params.id, isRead: false, createdAt: new Date().toISOString() });
    });
    saveNotifications();

    DB.auditLogs.push({ id: genId(), userId: req.user.id, userName: req.user.name, action: 'Forward', entity: 'Company', entityId: req.params.id, details: `Forwarded for approval`, timestamp: new Date().toISOString() });
    saveAuditLogs();

    res.status(200).json({ success: true, data: mapCompany(DB.companies[idx]) });
  } catch (error) { next(error); }
});

router.post('/:id/approve', authorize('admin'), (req, res, next) => {
  try {
    const idx = DB.companies.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Company not found' });
    
    DB.companies[idx].approvalStatus = 'approved';
    saveCompanies();

    if (DB.companies[idx].createdById) {
      DB.notifications.push({ id: genId(), userId: DB.companies[idx].createdById, title: 'Company Approved', message: `${DB.companies[idx].name} approved.`, type: 'company_approved', relatedEntity: 'Company', relatedId: req.params.id, isRead: false, createdAt: new Date().toISOString() });
      saveNotifications();
    }

    DB.auditLogs.push({ id: genId(), userId: req.user.id, userName: req.user.name, action: 'Approve', entity: 'Company', entityId: req.params.id, details: `Approved`, timestamp: new Date().toISOString() });
    saveAuditLogs();

    res.status(200).json({ success: true, data: mapCompany(DB.companies[idx]) });
  } catch (error) { next(error); }
});

router.post('/:id/upload-jd', upload.single('file'), async (req, res, next) => {
  try {
    const idx = DB.companies.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Company not found' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    let extractedText = '';
    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const data = await pdfParse(dataBuffer);
      extractedText = data.text;
    } else if (req.file.mimetype.includes('word')) {
      const result = await mammoth.extractRawText({ path: req.file.path });
      extractedText = result.value;
    }

    const commonTechSkills = ['javascript', 'python', 'java', 'react', 'node.js', 'html', 'css', 'sql', 'mongodb', 'c++', 'machine learning', 'data science', 'aws', 'docker'];
    const words = extractedText.toLowerCase().split(/[\s,]+/);
    const foundSkills = [...new Set(words.filter(w => commonTechSkills.includes(w)))];

    DB.companies[idx].jobDescription = extractedText;
    DB.companies[idx].jdFileUrl = `/uploads/${req.file.filename}`;
    DB.companies[idx].jdSkills = foundSkills.join(',');
    DB.companies[idx].jdKeywords = foundSkills.join(',');
    saveCompanies();

    res.status(200).json({ success: true, data: mapCompany(DB.companies[idx]) });
  } catch (error) { next(error); }
});

module.exports = router;
