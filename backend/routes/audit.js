const express = require('express');
const router = express.Router();
const { DB } = require('../utils/excelDatabase');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.use(authorize('admin'));

router.get('/', (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    let logs = [...DB.auditLogs];
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = logs.length;
    const skip = (page - 1) * limit;
    const paginated = logs.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: paginated.map(l => {
        const user = DB.users.find(u => u.id === l.userId);
        return {
          ...l, _id: l.id,
          user: user ? { _id: user.id, id: user.id, name: user.name, email: user.email, role: user.role } : null
        };
      }),
      pagination: { total, page, pages: Math.ceil(total / limit) }
    });
  } catch (error) { next(error); }
});

module.exports = router;
