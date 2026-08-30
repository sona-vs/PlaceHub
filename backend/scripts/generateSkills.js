const { DB, initDB, saveCompanies } = require('../utils/excelDatabase');
initDB();
const commonSkills = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'AWS', 'Docker', 'Machine Learning', 'Data Science', 'C++', 'SQL', 'MongoDB'];
DB.companies.forEach(c => {
  const numSkills = Math.floor(Math.random() * 4) + 3; // 3 to 6 skills
  const shuffled = [...commonSkills].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, numSkills);
  c.jdSkills = selected.join(',');
});
saveCompanies();
console.log('Skills generated.');
