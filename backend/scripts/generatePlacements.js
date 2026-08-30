const { DB, initDB, savePlacements, saveCompanies, genId } = require('../utils/excelDatabase');

initDB();

const companies = DB.companies;
const placedStudents = DB.students.filter(s => s['Placement Status'] === 'PLACED');

console.log('Placed students:', placedStudents.length);
console.log('Total companies:', companies.length);

if (companies.length >= 20) {
  const activeCompanies = companies.slice(0, 19);
  const inactiveCompany = companies[19];
  
  inactiveCompany.status = 'cold';
  inactiveCompany.offersCount = 0;
  inactiveCompany.studentsPlaced = 0;
  
  activeCompanies.forEach(c => {
    c.status = 'drive_completed';
    c.offersCount = 0;
    c.studentsPlaced = 0;
  });
  
  // Clear existing placements
  DB.placements = [];
  
  placedStudents.forEach((student, index) => {
    // Pick a random active company, but try to distribute somewhat evenly
    const company = activeCompanies[index % activeCompanies.length];
    
    // Add to company counts
    company.offersCount = (Number(company.offersCount) || 0) + 1;
    company.studentsPlaced = (Number(company.studentsPlaced) || 0) + 1;
    
    // Determine offer status (mostly joined, some offer_letter)
    const offerStatus = Math.random() > 0.3 ? 'joined' : 'offer_letter';
    
    DB.placements.push({
      id: genId(),
      studentId: student['Roll No'],
      companyId: company.id,
      atsScore: Math.floor(Math.random() * 30) + 60, // 60-90
      status: 'selected',
      appliedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      selectedDate: new Date().toISOString(),
      ctc: company.ctc || '4 LPA',
      offerStatus: offerStatus
    });
  });
  
  saveCompanies();
  savePlacements();
  console.log('Successfully generated placements for 70 students across 19 companies.');
} else {
  console.log('Not enough companies to split 19/1.');
}
