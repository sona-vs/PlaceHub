const xlsx = require('xlsx');
const path = require('path');
const { genId, DB, saveCompanies, initDB } = require('../utils/excelDatabase');

// Initialize current DB (to not overwrite existing companies if any, or to get users if needed)
initDB();

const filePath = 'C:/Users/Sona/Desktop/Companies_List.xlsx';
const wb = xlsx.readFile(filePath);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });

// Header is at row index 3
const headerIdx = 3;
const headers = rows[headerIdx];

let imported = 0;

for (let i = headerIdx + 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r[1]) continue; // Skip if no Company Name

  const companyName = String(r[headers.indexOf('Company Name')] || '').trim();
  const role = String(r[headers.indexOf('Job Title / Role')] || '').trim();
  const ctc = parseFloat(r[headers.indexOf('CTC (LPA)')]) || null;
  const location = String(r[headers.indexOf('Location')] || '').trim();
  
  let status = String(r[headers.indexOf('Opportunity Status')] || '').trim().toLowerCase();
  // Ensure it matches our enums
  if (!['cold', 'warm', 'hot', 'drive_completed'].includes(status)) {
    status = 'cold';
  }

  let approvalStatus = String(r[headers.indexOf('Job Status')] || '').trim().toLowerCase();
  if (!['pending', 'forwarded', 'approved', 'rejected'].includes(approvalStatus)) {
    approvalStatus = 'pending';
  }

  const placedCount = parseInt(r[headers.indexOf('Placed Students Count')]) || 0;
  const jdText = String(r[headers.indexOf('Job Description Summary')] || '').trim();
  const jdLink = String(r[headers.indexOf('JD PDF Link (Rendering)')] || '').trim();
  const website = String(r[headers.indexOf('Official Careers Link')] || '').trim();
  const email = String(r[headers.indexOf('Contact Email')] || '').trim();
  const mobile = String(r[headers.indexOf('Contact Mobile')] || '').trim();

  // Find admin user to set as creator
  const adminUser = DB.users.find(u => u.role === 'admin') || DB.users[0];

  const newCompany = {
    id: genId(),
    name: companyName,
    location: location,
    website: website,
    hrName: '',
    hrEmail: email,
    hrMobile: mobile,
    companySize: null,
    jobDescription: jdText,
    jdFileUrl: jdLink,
    jdSkills: null,
    jdQualifications: null,
    jdExperience: null,
    jdJobTitle: role,
    jdKeywords: null,
    ctc: ctc,
    assignedMemberId: null,
    status: status,
    approvalStatus: approvalStatus,
    offersCount: placedCount,
    registeredStudents: placedCount * 3, // rough mock data
    studentsAppeared: placedCount * 2,   // rough mock data
    studentsPlaced: placedCount,
    createdById: adminUser ? adminUser.id : null,
    isArchived: false,
    createdAt: new Date().toISOString()
  };

  DB.companies.push(newCompany);
  imported++;
}

// Clear old fake seeded companies if desired, or just append
// To prevent duplicates, let's just clear the companies and replace them with this list
// Wait, the DB initialization doesn't add fake companies anymore. So we just append.
saveCompanies();

console.log(`Successfully imported ${imported} companies from Excel into the database!`);
