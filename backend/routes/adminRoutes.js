import express from 'express'
import Owner from '../models/Owner.js'
import Tenant from '../models/Tenant.js'
import Payment from '../models/Payment.js'
import Notification from '../models/Notification.js'

const router = express.Router()

const ADMIN_EMAIL = 'vnitin398@gmail.com'

// Get all owners with stats
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
      stats: {
        totalOwners: owners.length,
        totalTenants
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete an owner and all their data
router.delete('/owners/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params
    await Tenant.deleteMany({ ownerId: firebaseUid })
    await Payment.deleteMany({ ownerId: firebaseUid })
    await Notification.deleteMany({ ownerId: firebaseUid })
    await Owner.findOneAndDelete({ firebaseUid })
    res.json({ message: 'Owner and all data deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router