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

// Indexes for fast queries
memberSchema.index({ ownerId: 1 })                        // fetch all members by owner
memberSchema.index({ ownerId: 1, status: 1 })             // filter by status
memberSchema.index({ ownerId: 1, expiryDate: 1 })         // expiry queries
memberSchema.index({ ownerId: 1, membershipType: 1 })     // plan filter

export default mongoose.model('Member', memberSchema)
