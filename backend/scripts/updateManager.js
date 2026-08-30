const { DB, initDB, saveUsers, saveTeams } = require('../utils/excelDatabase');
initDB();

const userIndex = DB.users.findIndex(u => u.email === 'kavitha@placehub.com');
if (userIndex !== -1) {
  DB.users[userIndex].role = 'manager';
}

const teamIndex = DB.teams.findIndex(t => t.email === 'kavitha@placehub.com');
if (teamIndex !== -1) {
  DB.teams[teamIndex].role = 'manager';
}

saveUsers();
saveTeams();
console.log('Successfully updated Kavitha to manager role.');
