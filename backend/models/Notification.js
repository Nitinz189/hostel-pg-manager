import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['reminder', 'payment', 'overdue', 'system'], default: 'system' },
  isRead: { type: Boolean, default: false },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
}, { timestamps: true })

export default mongoose.model('Notification', notificationSchema)