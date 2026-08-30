const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  department: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  hostelStatus: { type: String },
  sslcPercentage: Number,
  hscPercentage: Number,
  ugPercentage: Number,
  pgPercentage: Number,
  graduationYear: Number,
  email: String,
  mobile: String,
  github: String,
  linkedin: String,
  resumeUrl: String,
  portfolioUrl: String,
  photoUrl: String,
  skills: [String],
  isArchived: { type: Boolean, default: false },
  placementStatus: { type: String, enum: ['unplaced', 'placed', 'opted_out'], default: 'unplaced' },
  placedCompany: String,
  ctc: Number
}, { timestamps: true });

studentSchema.index({ rollNumber: 1 });
studentSchema.index({ department: 1 });
studentSchema.index({ name: 1 });

module.exports = mongoose.model('Student', studentSchema);
