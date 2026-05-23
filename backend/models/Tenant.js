import mongoose from 'mongoose'

const memberSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  membershipType: { type: String, default: 'Monthly', enum: ['Monthly', 'Quarterly', 'Yearly'] },
  membershipFee: { type: Number, required: true },
  joiningDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  status: { type: String, default: 'active', enum: ['active', 'expired', 'due_soon'] },
  notes: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('Tenant', memberSchema)