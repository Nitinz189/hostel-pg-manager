import mongoose from 'mongoose'

const ownerSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  mobile: { type: String },
  propertyName: { type: String },
  gymmitraId: { type: String, unique: true, sparse: true },
  isApproved: { type: Boolean, default: false },
  memberLimit: { type: Number, default: 10 },
  plan: { type: String, default: 'free', enum: ['free', 'basic', 'pro'] },
  planStartDate: { type: Date },
  planEndDate: { type: Date },
  address: {
    state: { type: String, default: '' },
    city: { type: String, default: '' },
    pincode: { type: String, default: '' },
  },
  upiId: { type: String, default: '' },
  qrCodeUrl: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('Owner', ownerSchema)