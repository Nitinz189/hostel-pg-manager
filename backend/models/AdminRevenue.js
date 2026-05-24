import mongoose from 'mongoose'

const adminRevenueSchema = new mongoose.Schema({
  gymmitraId: { type: String, required: true },
  gymName: { type: String, required: true },
  amount: { type: Number, required: true },
  planMonths: { type: Number },
  month: { type: String },
  paidOn: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('AdminRevenue', adminRevenueSchema)