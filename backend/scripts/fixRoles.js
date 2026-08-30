const { DB, initDB, saveUsers, saveTeams, genId } = require('../utils/excelDatabase');
const bcrypt = require('bcryptjs');
initDB();

// 1. Revert Kavitha to Lead
const kUser = DB.users.find(u => u.name === 'Kavitha');
if (kUser) {
  kUser.email = 'kavitha@placehub.com';
  kUser.role = 'lead';
}
const kTeam = DB.teams.find(t => t.name === 'Kavitha');
if (kTeam) {
  kTeam.email = 'kavitha@placehub.com';
  kTeam.role = 'lead';
}

// 2. Remove any existing "manager" or "lead" users if they exist to avoid duplicates
DB.users = DB.users.filter(u => u.email !== 'manager@placehub.com' && u.email !== 'lead@placehub.com');
DB.teams = DB.teams.filter(t => t.email !== 'manager@placehub.com' && t.email !== 'lead@placehub.com');

// 3. Create explicit Manager
const managerId = genId();
DB.users.push({
  id: managerId,
  name: 'Manager',
  email: 'manager@placehub.com',
  password: bcrypt.hashSync('Password@123', 10),
  role: 'manager',
  avatar: '',
  isActive: true,
  createdAt: new Date().toISOString()
});
DB.teams.push({
  id: genId(),
  userId: managerId,
  name: 'Manager',
  email: 'manager@placehub.com',
  role: 'manager',
  assignedCompanies: ''
});

// 4. Create explicit Lead
const leadId = genId();
DB.users.push({
  id: leadId,
  name: 'Team Lead',
  email: 'lead@placehub.com',
  password: bcrypt.hashSync('Password@123', 10),
  role: 'lead',
  avatar: '',
  isActive: true,
  createdAt: new Date().toISOString()
});
DB.teams.push({
  id: genId(),
  userId: leadId,
  name: 'Team Lead',
  email: 'lead@placehub.com',
  role: 'lead',
  assignedCompanies: ''
});

saveUsers();
saveTeams();
console.log('Fixed Kavitha, created Manager and Team Lead.');
