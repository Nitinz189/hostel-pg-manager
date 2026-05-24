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

export default mongoose.model('Due', dueSchema)