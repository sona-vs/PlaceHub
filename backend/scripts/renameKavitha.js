const { DB, initDB, saveUsers, saveTeams, saveCompanies } = require('../utils/excelDatabase');
initDB();

// Find Kavitha
const kUser = DB.users.find(u => u.name === 'Kavitha');
const kTeam = DB.teams.find(t => t.name === 'Kavitha');

// Find the explicit Manager I created last time
const mUserIdx = DB.users.findIndex(u => u.name === 'Manager' && u.id !== kUser?.id);
const mTeamIdx = DB.teams.findIndex(t => t.name === 'Manager' && t.id !== kTeam?.id);

// Delete the explicit Manager if found
if (mUserIdx !== -1) DB.users.splice(mUserIdx, 1);
if (mTeamIdx !== -1) DB.teams.splice(mTeamIdx, 1);

// Rename Kavitha to Manager
if (kUser) {
  kUser.name = 'Manager';
  kUser.email = 'manager@placehub.com';
  kUser.role = 'manager';
}
if (kTeam) {
  kTeam.name = 'Manager';
  kTeam.email = 'manager@placehub.com';
  kTeam.role = 'manager';
}

saveUsers();
saveTeams();
console.log('Successfully renamed Kavitha to Manager.');
