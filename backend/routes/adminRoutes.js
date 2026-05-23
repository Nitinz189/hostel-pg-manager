import express from 'express'
import Owner from '../models/Owner.js'
import Tenant from '../models/Tenant.js'
import Payment from '../models/Payment.js'
import Notification from '../models/Notification.js'

const router = express.Router()

// Get all owners
router.get('/owners', async (req, res) => {
  try {
    const owners = await Owner.find().sort({ createdAt: -1 })
    const ownersWithStats = await Promise.all(
      owners.map(async (owner) => {
        const tenantCount = await Tenant.countDocuments({ ownerId: owner.firebaseUid })
        return { ...owner.toObject(), tenantCount }
      })
    )
    const totalTenants = await Tenant.countDocuments()
    res.json({
      owners: ownersWithStats,
      stats: { totalOwners: owners.length, totalTenants }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Update owner — approve, revoke, change limit, change plan
router.put('/owners/:firebaseUid', async (req, res) => {
  try {
    const owner = await Owner.findOneAndUpdate(
      { firebaseUid: req.params.firebaseUid },
      req.body,
      { new: true }
    )
    if (!owner) return res.status(404).json({ message: 'Owner not found' })
    res.json(owner)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete owner and all data
router.delete('/owners/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params
    await Tenant.deleteMany({ ownerId: firebaseUid })
    await Payment.deleteMany({ ownerId: firebaseUid })
    await Notification.deleteMany({ ownerId: firebaseUid })
    await Owner.findOneAndDelete({ firebaseUid })
    res.json({ message: 'Owner deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router