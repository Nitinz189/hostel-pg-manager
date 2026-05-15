import express from 'express'
import Owner from '../models/Owner.js'
import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'

const router = express.Router()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const storage = multer.memoryStorage()
const upload = multer({ storage })

// Get or create owner profile
router.get('/:firebaseUid', async (req, res) => {
  try {
    let owner = await Owner.findOne({ firebaseUid: req.params.firebaseUid })
    if (!owner) {
      owner = new Owner({ firebaseUid: req.params.firebaseUid, name: 'Owner' })
      await owner.save()
    }
    res.json(owner)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Update owner profile
router.put('/:firebaseUid', async (req, res) => {
  try {
    const owner = await Owner.findOneAndUpdate(
      { firebaseUid: req.params.firebaseUid },
      req.body,
      { new: true, upsert: true }
    )
    res.json(owner)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Upload QR code
router.post('/upload-qr', upload.single('qr'), async (req, res) => {
  try {
    const b64 = Buffer.from(req.file.buffer).toString('base64')
    const dataURI = `data:${req.file.mimetype};base64,${b64}`
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'hostel-qr-codes'
    })
    await Owner.findOneAndUpdate(
      { firebaseUid: req.body.firebaseUid },
      { qrCodeUrl: result.secure_url }
    )
    res.json({ qrCodeUrl: result.secure_url })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router