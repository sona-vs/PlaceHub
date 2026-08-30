const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

const DB = {
  users: [],
  students: [], // Dynamic now based on the user's Excel
  companies: [],
  placements: [],
  teams: [],
  notifications: [],
  auditLogs: [],
  companyStatusHistory: []
};

const genId = () => crypto.randomBytes(16).toString('hex');

const readTable = (tableName, headers) => {
  const filePath = path.join(UPLOADS_DIR, `${tableName}.xlsx`);
  if (!fs.existsSync(filePath)) {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet([headers]);
    xlsx.utils.book_append_sheet(wb, ws, tableName);
    xlsx.writeFile(wb, filePath);
    return [];
  }
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return xlsx.utils.sheet_to_json(ws, { defval: null });
};

let studentHeadersFound = [];
let studentTitleRows = [];

const readStudentsTable = () => {
  const filePath = path.join(UPLOADS_DIR, `students.xlsx`);
  if (!fs.existsSync(filePath)) return [];
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  
  // Read as 2D array
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
  
  let hIdx = rows.findIndex(r => r.includes('Roll No'));
  if (hIdx === -1) {
    // fallback if no Roll No header is found, try first row
    hIdx = 0;
  }
  
  studentHeadersFound = rows[hIdx] || [];
  studentTitleRows = rows.slice(0, hIdx); // Preserve any titles
  
  const results = [];
  for (let i = hIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    // map row array to object using headers
    const obj = {};
    for (let j = 0; j < studentHeadersFound.length; j++) {
      if (studentHeadersFound[j]) {
        obj[studentHeadersFound[j]] = row[j] !== undefined ? row[j] : '';
      }
    }
    // Only add if there is a roll number
    if (obj['Roll No']) {
      results.push(obj);
    }
  }
  return results;
};

const saveStudentsTable = () => {
  const filePath = path.join(UPLOADS_DIR, `students.xlsx`);
  const wb = xlsx.utils.book_new();
  
  // Create 2D array: Titles -> Headers -> Data
  const aoa = [...studentTitleRows, studentHeadersFound];
  
  DB.students.forEach(s => {
    const row = [];
    studentHeadersFound.forEach(h => {
      row.push(s[h] !== undefined ? s[h] : '');
    });
    aoa.push(row);
  });
  
  const ws = xlsx.utils.aoa_to_sheet(aoa);
  xlsx.utils.book_append_sheet(wb, ws, 'students');
  xlsx.writeFile(wb, filePath);
};

const saveTable = (tableName, data, headers) => {
  const filePath = path.join(UPLOADS_DIR, `${tableName}.xlsx`);
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(data, { header: headers });
  xlsx.utils.book_append_sheet(wb, ws, tableName);
  xlsx.writeFile(wb, filePath);
};

const HEADERS = {
  users: ['id', 'name', 'email', 'password', 'role', 'avatar', 'isActive', 'createdAt'],
  companies: ['id', 'name', 'location', 'website', 'hrName', 'hrEmail', 'hrMobile', 'companySize', 'jobDescription', 'jdFileUrl', 'jdSkills', 'jdQualifications', 'jdExperience', 'jdJobTitle', 'jdKeywords', 'ctc', 'assignedMemberId', 'status', 'approvalStatus', 'offersCount', 'registeredStudents', 'studentsAppeared', 'studentsPlaced', 'createdById', 'isArchived', 'createdAt'],
  placements: ['id', 'studentId', 'companyId', 'atsScore', 'status', 'appliedDate', 'selectedDate'],
  teams: ['id', 'userId', 'name', 'email', 'role', 'assignedCompanies'],
  notifications: ['id', 'userId', 'title', 'message', 'type', 'isRead', 'relatedEntity', 'relatedId', 'createdAt'],
  auditLogs: ['id', 'userId', 'userName', 'action', 'entity', 'entityId', 'details', 'timestamp'],
  companyStatusHistory: ['id', 'companyId', 'status', 'changedById', 'changedAt', 'note']
};

const initDB = () => {
  console.log('Initializing Excel Database from uploads folder...');
  
  // Custom read for students
  DB.students = readStudentsTable();
  
  Object.keys(HEADERS).forEach(table => {
    DB[table] = readTable(table, HEADERS[table]);
  });

  if (DB.users.length === 0) {
    console.log('No users found. Creating default admin...');
    DB.users.push({
      id: genId(),
      name: 'Admin User',
      email: 'admin@placehub.com',
      password: bcrypt.hashSync('Admin@123', 10),
      role: 'admin',
      avatar: '',
      isActive: true,
      createdAt: new Date().toISOString()
    });
    saveTable('users', DB.users, HEADERS.users);
  }
};

module.exports = {
  DB,
  initDB,
  genId,
  saveUsers: () => saveTable('users', DB.users, HEADERS.users),
  saveStudents: saveStudentsTable,
  saveCompanies: () => saveTable('companies', DB.companies, HEADERS.companies),
  savePlacements: () => saveTable('placements', DB.placements, HEADERS.placements),
  saveTeams: () => saveTable('teams', DB.teams, HEADERS.teams),
  saveNotifications: () => saveTable('notifications', DB.notifications, HEADERS.notifications),
  saveAuditLogs: () => saveTable('auditLogs', DB.auditLogs, HEADERS.auditLogs),
  saveCompanyStatusHistory: () => saveTable('companyStatusHistory', DB.companyStatusHistory, HEADERS.companyStatusHistory)
};
