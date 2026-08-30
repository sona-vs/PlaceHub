const { DB, initDB, saveUsers } = require('../utils/excelDatabase');
const bcrypt = require('bcryptjs');
initDB();

const mUser = DB.users.find(u => u.email === 'manager@placehub.com');
if (mUser) {
  mUser.password = bcrypt.hashSync('Manager@123', 10);
}

const lUser = DB.users.find(u => u.email === 'lead@placehub.com');
if (lUser) {
  lUser.password = bcrypt.hashSync('Lead@123', 10);
}

saveUsers();
console.log('Successfully updated passwords for Manager and Team Lead.');
