import mongoose from 'mongoose'

const memberSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  membershipType: {
    type: String,
    default: 'Monthly',
    enum: ['Monthly', '3 Months', '6 Months', 'Yearly']
  },
  membershipFee: { type: Number, required: true },
  joiningDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'expired', 'due_soon', 'inactive']
  },
  notes: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('Member', memberSchema)