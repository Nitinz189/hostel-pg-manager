import mongoose from 'mongoose'

const ownerSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  mobile: { type: String },
  propertyName: { type: String },
  qrCodeUrl: { type: String, default: '' },
  upiId: { type: String, default: '' },
  isApproved: { type: Boolean, default: false },
  memberLimit: { type: Number, default: 10 },
  plan: { type: String, default: 'free', enum: ['free', 'basic', 'pro'] },
}, { timestamps: true })

export default mongoose.model('Owner', ownerSchema)