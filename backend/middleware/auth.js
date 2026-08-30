const jwt = require('jsonwebtoken');
const { DB } = require('../utils/excelDatabase');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token)
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = DB.users.find(u => u.id === decoded.id);
    if (!user)
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    
    // Convert string 'true'/'false' to boolean if needed
    user.isActive = user.isActive === true || user.isActive === 'true';
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
