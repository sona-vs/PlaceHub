const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Models
const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const PlacementTeam = require('../models/PlacementTeam');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const Placement = require('../models/Placement');

// Load env vars
dotenv.config({ path: require('path').join(__dirname, '..', '.env') });

const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/placehub';

const seedData = async () => {
  try {
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected for Seeding...');

    // Clear DB
    await User.deleteMany();
    await Student.deleteMany();
    await Company.deleteMany();
    await PlacementTeam.deleteMany();
    await Notification.deleteMany();
    await AuditLog.deleteMany();
    await Placement.deleteMany();
    console.log('Collections cleared');

    // Users - create individually to trigger pre-save password hashing
    // Users - create individually to trigger pre-save password hashing
    const admin = await User.create({ name: 'Admin User', email: 'admin@placehub.com', password: 'Admin@123', role: 'admin' });
    const manager = await User.create({ name: 'Manager User', email: 'manager@placehub.com', password: 'Manager@123', role: 'manager' });
    const lead = await User.create({ name: 'Placement Lead', email: 'lead@placehub.com', password: 'Lead@123', role: 'lead' });
    const adminId = admin._id;
    const managerId = manager._id;
    const leadId = lead._id;
    
    // Create actual user accounts for the 10 team members
    const teamNames = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Reddy', 'Vikram Singh', 'Ananya Gupta', 'Karthik Nair', 'Deepa Menon', 'Arjun Desai', 'Meera Iyer'];
    
    const teamUsers = [];
    for (let i = 0; i < teamNames.length; i++) {
      const name = teamNames[i];
      const email = `${name.split(' ')[0].toLowerCase()}@placehub.com`;
      if (i === 0) {
        // Rahul is already the lead
        teamUsers.push(lead);
      } else {
        const u = await User.create({ name, email, password: 'Member@123', role: 'member' });
        teamUsers.push(u);
      }
    }
    console.log('Users created with hashed passwords');

    // Placement Team
    const teamDocs = teamNames.map((name, i) => ({
      user: teamUsers[i]._id,
      name,
      email: teamUsers[i].email,
      role: i === 0 ? 'lead' : 'member'
    }));
    const team = await PlacementTeam.insertMany(teamDocs);
    console.log('Placement Team created');

    // Companies
    const companyData = [
      { 
        name: 'TCS', location: 'Chennai', website: 'https://www.tcs.com', hrName: 'Arun Kumar', hrEmail: 'arun.k@tcs.com', hrMobile: '9876543210', 
        status: 'drive_completed', approvalStatus: 'approved', ctc: 7, 
        registeredStudents: 210, studentsAppeared: 180, studentsPlaced: 72, offersCount: 72, 
        createdBy: adminId, assignedMember: leadId, 
        jobDescription: 'Tata Consultancy Services is looking for dynamic engineers for the role of Software Developer.\n\nRequirements:\n- Strong knowledge in Java, Python, and SQL.\n- Experience with Spring Boot and REST API development.\n- Excellent problem solving and communication skills.', 
        jdParsedData: { skills: ['Java', 'SQL', 'Python', 'Spring Boot', 'REST API'] },
        statusHistory: [
          { status: 'cold', changedBy: adminId, changedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), note: 'Initial contact' },
          { status: 'warm', changedBy: leadId, changedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), note: 'HR replied' },
          { status: 'hot', changedBy: adminId, changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), note: 'Drive scheduled' },
          { status: 'drive_completed', changedBy: adminId, changedAt: new Date(), note: 'Drive completed successfully' }
        ]
      },
      { 
        name: 'Infosys', location: 'Bangalore', website: 'https://www.infosys.com', hrName: 'Priya Sharma', hrEmail: 'priya.s@infosys.com', hrMobile: '9876543211', 
        status: 'drive_completed', approvalStatus: 'approved', ctc: 5.5, 
        registeredStudents: 190, studentsAppeared: 150, studentsPlaced: 61, offersCount: 61, 
        createdBy: adminId, assignedMember: leadId, 
        jobDescription: 'Infosys is hiring Systems Engineers.\n\nKey Responsibilities:\n- Develop and maintain software applications.\n- Collaborate with cross-functional teams.\n- Experience in Python, JavaScript, React, and Node.js is required.', 
        jdParsedData: { skills: ['Python', 'JavaScript', 'React', 'Node.js', 'SQL'] },
        statusHistory: [
          { status: 'cold', changedBy: managerId, changedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), note: 'Reached out via email' },
          { status: 'hot', changedBy: leadId, changedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), note: 'Fast tracked to drive' },
          { status: 'drive_completed', changedBy: adminId, changedAt: new Date(), note: 'Results declared' }
        ]
      },
      { name: 'Wipro', location: 'Hyderabad', website: 'https://www.wipro.com', hrName: 'Ravi Teja', hrEmail: 'ravi.t@wipro.com', hrMobile: '9876543212', status: 'drive_completed', approvalStatus: 'approved', ctc: 5, registeredStudents: 150, studentsAppeared: 120, studentsPlaced: 45, offersCount: 45, createdBy: managerId, jobDescription: 'Wipro is looking for Frontend Developers.\n\n- Strong proficiency in HTML, CSS, and JavaScript.\n- Experience with modern UI frameworks.\n- Good understanding of web accessibility.', jdParsedData: { skills: ['Java', 'HTML', 'CSS', 'JavaScript'] } },
      { name: 'Cognizant', location: 'Chennai', website: 'https://www.cognizant.com', hrName: 'Sneha Reddy', hrEmail: 'sneha.r@cognizant.com', hrMobile: '9876543213', status: 'hot', approvalStatus: 'approved', ctc: 6, registeredStudents: 100, studentsAppeared: 0, studentsPlaced: 0, offersCount: 0, createdBy: adminId, jobDescription: 'Cognizant is hiring Data Analysts.\n\n- Proficiency in SQL and Python.\n- Experience with data visualization tools.\n- Strong analytical skills.', jdParsedData: { skills: ['Python', 'SQL', 'Data Science', 'Machine Learning'] } },
      { name: 'Accenture', location: 'Mumbai', website: 'https://www.accenture.com', hrName: 'Vikas Singh', hrEmail: 'vikas.s@accenture.com', hrMobile: '9876543214', status: 'hot', approvalStatus: 'approved', ctc: 6.5, registeredStudents: 120, studentsAppeared: 0, studentsPlaced: 0, offersCount: 0, createdBy: managerId, jobDescription: 'Accenture is looking for Cloud Engineers.\n\n- Experience with AWS and Docker.\n- Strong knowledge of DevOps practices.\n- Knowledge of REST APIs.', jdParsedData: { skills: ['AWS', 'Docker', 'REST API'] } },
      { name: 'HCL Technologies', location: 'Noida', website: 'https://www.hcl.com', hrName: 'Neha Gupta', hrEmail: 'neha.g@hcl.com', hrMobile: '9876543215', status: 'warm', approvalStatus: 'approved', ctc: 5.5, createdBy: adminId, jobDescription: 'HCL Tech is hiring Backend Developers.\n\n- Strong Java and Spring Boot knowledge.\n- Experience with Microservices architecture.', jdParsedData: { skills: ['Java', 'Spring Boot'] } },
      { name: 'Tech Mahindra', location: 'Pune', website: 'https://www.techmahindra.com', hrName: 'Amit Patel', hrEmail: 'amit.p@techmahindra.com', hrMobile: '9876543216', status: 'warm', approvalStatus: 'approved', ctc: 5, createdBy: adminId, jobDescription: 'Tech Mahindra is looking for Full Stack Developers.\n\n- Experience with React and Node.js.\n- Good knowledge of MongoDB.', jdParsedData: { skills: ['React', 'Node.js', 'MongoDB'] } },
      { name: 'Capgemini', location: 'Mumbai', website: 'https://www.capgemini.com', hrName: 'Karthik Nair', hrEmail: 'karthik.n@capgemini.com', hrMobile: '9876543217', status: 'warm', approvalStatus: 'forwarded', ctc: 6, createdBy: leadId, jobDescription: 'Capgemini is hiring QA Automation Engineers.\n\n- Experience with Selenium and Python.\n- Strong understanding of testing methodologies.', jdParsedData: { skills: ['Python', 'SQL'] } },
      { name: 'Zoho', location: 'Chennai', website: 'https://www.zoho.com', hrName: 'Deepa Menon', hrEmail: 'deepa.m@zoho.com', hrMobile: '9876543218', status: 'hot', approvalStatus: 'approved', ctc: 8, createdBy: adminId, jobDescription: 'Zoho is looking for Product Developers.\n\n- Strong C++ and Java skills.\n- Experience with scalable architectures.\n- Deep understanding of data structures.', jdParsedData: { skills: ['C++', 'Java'] } },
      { name: 'Freshworks', location: 'Chennai', website: 'https://www.freshworks.com', hrName: 'Arjun Desai', hrEmail: 'arjun.d@freshworks.com', hrMobile: '9876543219', status: 'cold', approvalStatus: 'pending', ctc: 10, createdBy: leadId, jobDescription: 'Freshworks is hiring UI/UX Developers.\n\n- Experience with React and Angular.\n- Strong design sensibilities.', jdParsedData: { skills: ['React', 'Angular', 'HTML/CSS'] } },
      { name: 'PayPal', location: 'Bangalore', website: 'https://www.paypal.com', hrName: 'Meera Iyer', hrEmail: 'meera.i@paypal.com', hrMobile: '9876543220', status: 'cold', approvalStatus: 'pending', ctc: 18, createdBy: managerId, jobDescription: 'PayPal is looking for Senior Software Engineers.\n\n- Extensive experience with Node.js and scalable systems.\n- Strong understanding of financial systems and security.', jdParsedData: { skills: ['Node.js', 'React', 'MongoDB'] } },
      { name: 'Microsoft', location: 'Hyderabad', website: 'https://www.microsoft.com', hrName: 'Rajesh Kumar', hrEmail: 'rajesh.k@microsoft.com', hrMobile: '9876543221', status: 'cold', approvalStatus: 'pending', ctc: 25, createdBy: adminId, jobDescription: 'Microsoft is hiring Software Engineers.\n\n- Strong problem solving skills.\n- Experience with C++ and Cloud architectures.', jdParsedData: { skills: ['C++', 'AWS', 'Data Science'] } },
      { name: 'Amazon', location: 'Bangalore', website: 'https://www.amazon.in', hrName: 'Sanjay Dutt', hrEmail: 'sanjay.d@amazon.com', hrMobile: '9876543222', status: 'warm', approvalStatus: 'forwarded', ctc: 20, createdBy: leadId, jobDescription: 'Amazon is looking for SDE-1.\n\n- Strong algorithmic skills.\n- Experience with Java and scalable systems design.', jdParsedData: { skills: ['Java', 'SQL', 'AWS'] } },
      { name: 'Google', location: 'Bangalore', website: 'https://www.google.com', hrName: 'Sundar P', hrEmail: 'sundar.p@google.com', hrMobile: '9876543223', status: 'cold', approvalStatus: 'pending', ctc: 30, createdBy: leadId, jobDescription: 'Google is hiring Software Engineers for Search.\n\n- Deep knowledge of Machine Learning and Data Science.\n- Strong Python and C++ skills.', jdParsedData: { skills: ['Python', 'C++', 'Machine Learning'] } },
      { name: 'Deloitte', location: 'Hyderabad', website: 'https://www.deloitte.com', hrName: 'Anil Ambani', hrEmail: 'anil.a@deloitte.com', hrMobile: '9876543224', status: 'hot', approvalStatus: 'approved', ctc: 7, createdBy: managerId, jobDescription: 'Deloitte is hiring Technology Consultants.\n\n- Strong communication skills.\n- Experience with enterprise software and SQL.', jdParsedData: { skills: ['SQL', 'Java'] } }
    ];
    const companies = await Company.insertMany(companyData);
    
    // Distribute companies among placement team members for realistic dashboard stats
    for (let i = 0; i < companies.length; i++) {
      const comp = companies[i];
      const memberIndex = i % team.length;
      const member = team[memberIndex];
      
      await PlacementTeam.findByIdAndUpdate(member._id, {
        $push: { assignedCompanies: comp._id }
      });
      
      if (member.user) {
        await Company.findByIdAndUpdate(comp._id, {
          assignedMember: member.user
        });
      }
    }
    console.log('Companies created and assigned to team');

    // Students
    const allSkills = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'HTML/CSS', 'SQL', 'MongoDB', 'C++', 'Machine Learning', 'Data Science', 'Angular', 'TypeScript', 'Docker', 'AWS', 'Git', 'REST API', 'Spring Boot', 'Flutter', 'Django'];
    const depts = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];
    const studentsData = [];
    
    let rollCounter = 1;
    for (const dept of depts) {
      const count = dept === 'CSE' ? 20 : (dept === 'ECE' || dept === 'MECH' ? 15 : 10);
      for (let i = 0; i < count; i++) {
        const gender = Math.random() > 0.45 ? 'Male' : 'Female';
        const numSkills = Math.floor(Math.random() * 5) + 3;
        const sSkills = [];
        for (let j = 0; j < numSkills; j++) {
          const sk = allSkills[Math.floor(Math.random() * allSkills.length)];
          if (!sSkills.includes(sk)) sSkills.push(sk);
        }

        const isPlaced = Math.random() > 0.6;
        let pStatus = 'unplaced';
        let pCompany = null;
        let pCtc = null;
        if (isPlaced) {
          pStatus = 'placed';
          const placedComp = companies[Math.floor(Math.random() * 3)]; // from the first 3 (completed)
          pCompany = placedComp.name;
          pCtc = placedComp.ctc;
        }

        const photoIndex = Math.floor(Math.random() * 99) + 1;
        const genPhotoUrl = gender === 'Male' 
          ? `https://randomuser.me/api/portraits/men/${photoIndex}.jpg`
          : `https://randomuser.me/api/portraits/women/${photoIndex}.jpg`;

        studentsData.push({
          rollNumber: `21${dept}${String(rollCounter).padStart(3, '0')}`,
          name: `Student ${rollCounter}`,
          department: dept,
          gender,
          hostelStatus: Math.random() > 0.4 ? 'Hosteller' : 'Day Scholar',
          sslcPercentage: parseFloat((70 + Math.random() * 28).toFixed(2)),
          hscPercentage: parseFloat((65 + Math.random() * 32).toFixed(2)),
          ugPercentage: parseFloat((55 + Math.random() * 40).toFixed(2)),
          pgPercentage: Math.random() > 0.8 ? parseFloat((60 + Math.random() * 30).toFixed(2)) : null,
          graduationYear: 2025,
          email: `student${rollCounter}@placehub.edu`,
          mobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
          github: `https://github.com/student${rollCounter}`,
          linkedin: `https://linkedin.com/in/student${rollCounter}`,
          resumeUrl: `https://example.com/resume_student${rollCounter}.pdf`,
          portfolioUrl: `https://student${rollCounter}.portfolio.com`,
          photoUrl: genPhotoUrl,
          skills: sSkills,
          placementStatus: pStatus,
          placedCompany: pCompany,
          ctc: pCtc
        });
        rollCounter++;
      }
    }
    const students = await Student.insertMany(studentsData);
    console.log('Students created');

    // Placements
    const placementData = [];
    const completedComps = companies.filter(c => c.status === 'drive_completed');
    for (const comp of completedComps) {
      const placedStudentsForComp = students.filter(s => s.placedCompany === comp.name);
      for (const st of placedStudentsForComp) {
        placementData.push({
          student: st._id,
          company: comp._id,
          atsScore: 70 + Math.floor(Math.random() * 25),
          status: 'selected',
          selectedDate: new Date()
        });
      }
    }
    await Placement.insertMany(placementData);
    console.log('Placements created');

    // Notifications
    await Notification.insertMany([
      { user: adminId, title: 'Company Forwarded', message: 'Capgemini has been forwarded for approval', type: 'company_forwarded' },
      { user: leadId, title: 'Company Approved', message: 'TCS has been approved', type: 'company_approved' },
      { user: adminId, title: 'Drive Completed', message: 'TCS drive completed', type: 'drive_completed' }
    ]);
    console.log('Notifications created');

    // Audit Logs
    await AuditLog.insertMany([
      { user: adminId, userName: 'Admin User', action: 'Create', entity: 'Company', details: 'Created TCS' },
      { user: managerId, userName: 'Manager User', action: 'Update', entity: 'Student', details: 'Updated Student 1' }
    ]);
    console.log('Audit Logs created');

    console.log(`
--- Seeding Completed Successfully ---
Demo Credentials:
Admin: admin@placehub.com / Admin@123
Manager: manager@placehub.com / Manager@123
Lead (Rahul): lead@placehub.com / Lead@123

Team Members (Password: Member@123):
${teamNames.slice(1).map(name => `- ${name}: ${name.split(' ')[0].toLowerCase()}@placehub.com`).join('\n')}
    `);

    if (require.main === module) {
      process.exit();
    }
  } catch (error) {
    console.error('Error with seed data: ', error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedData();
} else {
  module.exports = seedData;
}
