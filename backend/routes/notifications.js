const express = require('express');
const router = express.Router();
const { DB, saveNotifications } = require('../utils/excelDatabase');
const { protect } = require('../middleware/auth');

router.use(protect);
const isTrue = (val) => val === true || val === 'true';

router.get('/', (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    let notifs = DB.notifications.filter(n => n.userId === req.user.id);
    notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = notifs.length;
    const skip = (page - 1) * limit;
    const paginated = notifs.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: paginated.map(n => ({ ...n, _id: n.id, user: n.userId })),
      pagination: { total, page, pages: Math.ceil(total / limit) }
    });
  } catch (error) { next(error); }
});

router.get('/unread-count', (req, res, next) => {
  try {
    const count = DB.notifications.filter(n => n.userId === req.user.id && !isTrue(n.isRead)).length;
    res.status(200).json({ success: true, count });
  } catch (error) { next(error); }
});

router.put('/:id/read', (req, res, next) => {
  try {
    const idx = DB.notifications.findIndex(n => n.id === req.params.id && n.userId === req.user.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Notification not found' });
    
    DB.notifications[idx].isRead = true;
    saveNotifications();
    res.status(200).json({ success: true, data: { ...DB.notifications[idx], _id: DB.notifications[idx].id } });
  } catch (error) { next(error); }
});

router.put('/read-all', (req, res, next) => {
  try {
    let changed = false;
    DB.notifications.forEach(n => {
      if (n.userId === req.user.id && !isTrue(n.isRead)) {
        n.isRead = true;
        changed = true;
      }
    });
    if (changed) saveNotifications();
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) { next(error); }
});

module.exports = router;
