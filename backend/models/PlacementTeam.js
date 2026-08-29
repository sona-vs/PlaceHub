const mongoose = require('mongoose');

const placementTeamSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, default: 'member' },
  assignedCompanies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }]
}, { timestamps: true });

module.exports = mongoose.model('PlacementTeam', placementTeamSchema);
