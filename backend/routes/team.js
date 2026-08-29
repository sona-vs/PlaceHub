const express = require('express');
const router = express.Router();
const PlacementTeam = require('../models/PlacementTeam');
const Company = require('../models/Company');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const team = await PlacementTeam.find().populate('user', 'name email avatar').populate('assignedCompanies', 'name status');
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const member = await PlacementTeam.findById(req.params.id).populate('user', 'name email avatar').populate('assignedCompanies');
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
});

router.post('/', authorize('admin'), async (req, res, next) => {
  try {
    const member = await PlacementTeam.create(req.body);
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const member = await PlacementTeam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const member = await PlacementTeam.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });
    res.status(200).json({ success: true, message: 'Team member removed' });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/assign', authorize('admin'), async (req, res, next) => {
  try {
    const { companyId } = req.body;
    const member = await PlacementTeam.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    if (!member.assignedCompanies.includes(companyId)) {
      member.assignedCompanies.push(companyId);
      await member.save();
    }

    company.assignedMember = member.user;
    await company.save();

    if (member.user) {
      await Notification.create({
        user: member.user,
        title: 'Company Assigned',
        message: `You have been assigned to ${company.name}`,
        type: 'company_assigned',
        relatedEntity: 'Company',
        relatedId: company._id
      });
    }

    res.status(200).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
