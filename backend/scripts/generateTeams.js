const { DB, initDB, saveUsers, saveTeams, saveCompanies, genId } = require('../utils/excelDatabase');
const bcrypt = require('bcryptjs');

initDB();

const names = ['Kavitha', 'Suresh', 'Deepa', 'Ramesh', 'Anitha', 'Karthik', 'Meena', 'Vijay', 'Priya', 'Arun'];
const roles = ['lead', 'member', 'member', 'member', 'member', 'lead', 'member', 'member', 'member', 'member'];

// Clear existing non-admin users and teams
DB.users = DB.users.filter(u => u.role === 'admin');
DB.teams = [];

// Reset company assignments
DB.companies.forEach(c => {
  c.assignedMemberId = '';
});

// Create 10 users and teams
names.forEach((name, i) => {
  const userId = genId();
  const teamId = genId();
  const email = `${name.toLowerCase()}@placehub.com`;
  
  const user = {
    id: userId,
    name: name,
    email: email,
    password: bcrypt.hashSync('Password@123', 10),
    role: roles[i],
    avatar: '',
    isActive: true,
    createdAt: new Date().toISOString()
  };
  
  DB.users.push(user);
  
  const teamMember = {
    id: teamId,
    userId: userId,
    name: name,
    email: email,
    role: roles[i],
    assignedCompanies: ''
  };
  
  DB.teams.push(teamMember);
});

// Distribute the 20 companies among the 10 team members (2 each)
DB.companies.forEach((company, index) => {
  const teamMemberIndex = index % 10;
  const teamMember = DB.teams[teamMemberIndex];
  
  company.assignedMemberId = teamMember.userId;
  
  let assignedList = teamMember.assignedCompanies ? teamMember.assignedCompanies.split(',') : [];
  assignedList.push(company.id);
  teamMember.assignedCompanies = assignedList.join(',');
});

saveUsers();
saveTeams();
saveCompanies();

console.log('Successfully generated 10 team members and assigned 2 companies to each.');
