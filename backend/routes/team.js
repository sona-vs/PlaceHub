const express = require('express');
const router = express.Router();
const { DB, genId, saveTeams, saveCompanies, saveNotifications } = require('../utils/excelDatabase');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/', (req, res, next) => {
  try {
    const mapped = DB.teams.map(t => {
      const user = DB.users.find(u => u.id === t.userId);
      const cIds = t.assignedCompanies ? t.assignedCompanies.split(',') : [];
      const assignedCompanies = DB.companies.filter(c => cIds.includes(c.id)).map(c => ({ ...c, _id: c.id }));
      return { ...t, _id: t.id, user, assignedCompanies };
    });
    res.status(200).json({ success: true, data: mapped });
  } catch (error) { next(error); }
});

router.get('/:id', (req, res, next) => {
  try {
    const member = DB.teams.find(t => t.id === req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });
    const user = DB.users.find(u => u.id === member.userId);
    const cIds = member.assignedCompanies ? member.assignedCompanies.split(',') : [];
    const assignedCompanies = DB.companies.filter(c => cIds.includes(c.id)).map(c => ({ ...c, _id: c.id }));
    res.status(200).json({ success: true, data: { ...member, _id: member.id, user, assignedCompanies } });
  } catch (error) { next(error); }
});

router.post('/', authorize('admin'), (req, res, next) => {
  try {
    const member = { id: genId(), ...req.body, assignedCompanies: '' };
    DB.teams.push(member);
    saveTeams();
    res.status(201).json({ success: true, data: { ...member, _id: member.id } });
  } catch (error) { next(error); }
});

router.put('/:id', authorize('admin'), (req, res, next) => {
  try {
    const idx = DB.teams.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Team member not found' });
    DB.teams[idx] = { ...DB.teams[idx], ...req.body };
    saveTeams();
    res.status(200).json({ success: true, data: { ...DB.teams[idx], _id: DB.teams[idx].id } });
  } catch (error) { next(error); }
});

router.delete('/:id', authorize('admin'), (req, res, next) => {
  try {
    const idx = DB.teams.findIndex(t => t.id === req.params.id);
    if (idx !== -1) {
      DB.teams.splice(idx, 1);
      saveTeams();
    }
    res.status(200).json({ success: true, message: 'Team member removed' });
  } catch (error) { next(error); }
});

router.put('/:id/assign', authorize('admin'), (req, res, next) => {
  try {
    const { companyId } = req.body;
    const idx = DB.teams.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Team member not found' });
    
    const company = DB.companies.find(c => c.id === companyId);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    let cIds = DB.teams[idx].assignedCompanies ? DB.teams[idx].assignedCompanies.split(',') : [];
    if (!cIds.includes(companyId)) {
      cIds.push(companyId);
      DB.teams[idx].assignedCompanies = cIds.join(',');
      saveTeams();
    }

    if (DB.teams[idx].userId) {
      const cIdx = DB.companies.findIndex(c => c.id === companyId);
      DB.companies[cIdx].assignedMemberId = DB.teams[idx].userId;
      saveCompanies();

      DB.notifications.push({ id: genId(), userId: DB.teams[idx].userId, title: 'Company Assigned', message: `You have been assigned to ${company.name}`, type: 'company_assigned', relatedEntity: 'Company', relatedId: company.id, isRead: false, createdAt: new Date().toISOString() });
      saveNotifications();
    }
    res.status(200).json({ success: true, data: DB.teams[idx] });
  } catch (error) { next(error); }
});

module.exports = router;
