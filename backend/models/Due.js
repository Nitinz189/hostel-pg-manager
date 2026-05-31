import mongoose from 'mongoose'

const dueSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  memberName: { type: String, required: true },
  mobile: { type: String, required: true },
  amount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  note: { type: String, default: '' },
  status: { type: String, default: 'pending', enum: ['pending', 'partial', 'paid'] },
}, { timestamps: true })

// Indexes for fast queries
dueSchema.index({ ownerId: 1 })                    // fetch all dues by owner
dueSchema.index({ ownerId: 1, status: 1 })         // filter pending/partial dues
dueSchema.index({ memberId: 1 })                   // fetch dues for one member
dueSchema.index({ ownerId: 1, memberId: 1 })       // dues summary per member

export default mongoose.model('Due', dueSchema)