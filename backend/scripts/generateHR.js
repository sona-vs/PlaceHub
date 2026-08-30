const { DB, initDB, saveCompanies } = require('../utils/excelDatabase');

initDB();

const firstNames = ['Amit', 'Priya', 'Rahul', 'Neha', 'Sanjay', 'Kavita', 'Vikram', 'Anjali', 'Arjun', 'Sneha', 'Ravi', 'Pooja'];
const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Verma', 'Reddy', 'Rao', 'Nair', 'Menon'];

DB.companies.forEach(c => {
  if (!c.hrName || c.hrName.trim() === '') {
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    c.hrName = `${fName} ${lName}`;
    c.hrEmail = `${fName.toLowerCase()}.${lName.toLowerCase()}@${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    c.hrMobile = `+91 ${Math.floor(9000000000 + Math.random() * 999999999)}`;
  }
});

saveCompanies();
console.log('Successfully generated HR Names, Emails, and Mobiles for all companies.');
