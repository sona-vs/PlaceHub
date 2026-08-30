const { DB, initDB, saveCompanies, saveUsers, genId } = require('../utils/excelDatabase');
const bcrypt = require('bcryptjs');

initDB();

// Add some team members if they don't exist
let john = DB.users.find(u => u.email === 'john@placehub.com');
if (!john) {
  john = {
    id: genId(),
    name: 'John Doe',
    email: 'john@placehub.com',
    password: bcrypt.hashSync('Password@123', 10),
    role: 'manager',
    avatar: '',
    isActive: true,
    createdAt: new Date().toISOString()
  };
  DB.users.push(john);
}

let jane = DB.users.find(u => u.email === 'jane@placehub.com');
if (!jane) {
  jane = {
    id: genId(),
    name: 'Jane Smith',
    email: 'jane@placehub.com',
    password: bcrypt.hashSync('Password@123', 10),
    role: 'lead',
    avatar: '',
    isActive: true,
    createdAt: new Date().toISOString()
  };
  DB.users.push(jane);
}

saveUsers();

const teamMembers = DB.users;

DB.companies.forEach((c, i) => {
  const assignee = teamMembers[i % teamMembers.length];
  c.assignedMemberId = assignee.id;
});

saveCompanies();
console.log('Assigned companies to team members!');
