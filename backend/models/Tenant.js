import mongoose from 'mongoose'

const tenantSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  roomNumber: { type: String, required: true },
  rentAmount: { type: Number, required: true },
  securityDeposit: { type: Number, default: 0 },
  rentDueDate: { type: Number, required: true },
  joiningDate: { type: Date, required: true },
  paymentStatus: { type: String, default: 'unpaid', enum: ['paid', 'unpaid', 'overdue'] },
  notes: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('Tenant', tenantSchema)