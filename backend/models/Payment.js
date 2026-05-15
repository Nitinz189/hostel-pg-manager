import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  tenantName: { type: String, required: true },
  roomNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  month: { type: String, required: true },
  status: { type: String, default: 'unpaid' },
  paidOn: { type: Date },
}, { timestamps: true })

export default mongoose.model('Payment', paymentSchema)