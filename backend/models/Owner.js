import mongoose from 'mongoose'

const ownerSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  mobile: { type: String },
  propertyName: { type: String },
  qrCodeUrl: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('Owner', ownerSchema)