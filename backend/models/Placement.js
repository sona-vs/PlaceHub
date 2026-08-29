const mongoose = require('mongoose');

const placementSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  atsScore: Number,
  status: { type: String, enum: ['applied', 'shortlisted', 'selected', 'rejected'], default: 'applied' },
  appliedDate: { type: Date, default: Date.now },
  selectedDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Placement', placementSchema);
