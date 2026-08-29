const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: String,
  mapsLink: String,
  website: String,
  hrName: String,
  hrEmail: String,
  hrMobile: String,
  companySize: String,
  jobDescription: String,
  jdFileUrl: String,
  jdParsedData: {
    skills: [String],
    qualifications: [String],
    experience: String,
    jobTitle: String,
    keywords: [String]
  },
  ctc: Number,
  assignedMember: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['cold', 'warm', 'hot', 'drive_completed'], default: 'cold' },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'forwarded'], default: 'pending' },
  offersCount: { type: Number, default: 0 },
  registeredStudents: { type: Number, default: 0 },
  studentsAppeared: { type: Number, default: 0 },
  studentsPlaced: { type: Number, default: 0 },
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: String
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
