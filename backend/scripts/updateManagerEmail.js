const { DB, initDB, saveUsers, saveTeams } = require('../utils/excelDatabase');
initDB();

const userIndex = DB.users.findIndex(u => u.email === 'kavitha@placehub.com');
if (userIndex !== -1) {
  DB.users[userIndex].email = 'manager@placehub.com';
}

const teamIndex = DB.teams.findIndex(t => t.email === 'kavitha@placehub.com');
if (teamIndex !== -1) {
  DB.teams[teamIndex].email = 'manager@placehub.com';
}

saveUsers();
saveTeams();
console.log('Successfully updated email to manager@placehub.com');
