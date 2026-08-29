const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  message: String,
  type: { type: String, enum: ['company_forwarded', 'company_approved', 'company_rejected', 'company_assigned', 'drive_completed', 'general'] },
  isRead: { type: Boolean, default: false },
  relatedEntity: String,
  relatedId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
