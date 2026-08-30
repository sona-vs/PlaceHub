const xlsx = require('xlsx');
const { DB, saveStudents, initDB } = require('../utils/excelDatabase');

// Load DB
initDB();

const oldStudentsFile = 'C:/Users/Sona/Downloads/100_Students_List.xlsx';
const wb = xlsx.readFile(oldStudentsFile);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });

let hIdx = rows.findIndex(r => r[0] === 'Roll No');
if (hIdx >= 0) {
  const hd = rows[hIdx];
  const psIdx = hd.indexOf('Placement Status');
  
  if (psIdx !== -1) {
    let updatedCount = 0;
    for (let i = hIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      const rollNumber = String(r[0] || '').trim();
      if (!rollNumber) continue;

      const rawStatus = String(r[psIdx] || '').trim().toLowerCase();
      let status = 'unplaced';
      if (rawStatus.includes('placed')) status = 'placed';
      if (rawStatus.includes('opted')) status = 'opted_out';

      // Find the student in our database and update them
      const studentIdx = DB.students.findIndex(s => s.rollNumber === rollNumber);
      if (studentIdx !== -1) {
        DB.students[studentIdx].placementStatus = status;
        updatedCount++;
      }
    }
    
    // Save to the actual database file
    saveStudents();
    console.log(`Successfully updated placement status for ${updatedCount} students based on your Excel file!`);
  } else {
    console.log('Could not find Placement Status column in the Excel file.');
  }
}
