import AdminRevenue from '../models/AdminRevenue.js'
import express from 'express'
import Owner from '../models/Owner.js'
import Member from '../models/Member.js'
import Payment from '../models/Payment.js'
import Notification from '../models/Notification.js'

const router = express.Router()

function generateGymmitraId(gymName, city, sequence) {
  const cleanGym = gymName.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 4)
  const cleanCity = city.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 3)
  const num = String(sequence).padStart(3, '0')
  return `${cleanGym}${cleanCity}${num}`
}

// Get all owners with stats
router.get('/owners', async (req, res) => {
  try {
    const owners = await Owner.find().sort({ createdAt: -1 })
    const ownersWithStats = await Promise.all(
      owners.map(async (owner) => {
        const memberCount = await Member.countDocuments({ ownerId: owner.firebaseUid })
        return { ...owner.toObject(), memberCount }
      })
    )
    const totalOwners = owners.length
    const activeOwners = owners.filter(o => o.isApproved && (!o.planEndDate || new Date(o.planEndDate) > new Date())).length
    const pendingOwners = owners.filter(o => !o.isApproved).length
    const expiringThisMonth = owners.filter(o => {
      if (!o.planEndDate) return false
      const end = new Date(o.planEndDate)
      const now = new Date()
      const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
      return daysLeft > 0 && daysLeft <= 30
    }).length

    res.json({
      owners: ownersWithStats,
      stats: { totalOwners, activeOwners, pendingOwners, expiringThisMonth }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get admin revenue
router.get('/revenue', async (req, res) => {
  try {
    const revenue = await AdminRevenue.find().sort({ createdAt: -1 })
    const total = revenue.reduce((sum, r) => sum + r.amount, 0)
    const thisMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
    const thisMonthRevenue = revenue.filter(r => r.month === thisMonth).reduce((sum, r) => sum + r.amount, 0)
    res.json({ revenue, total, thisMonthRevenue })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Approve owner and generate GYMmitra ID
router.put('/owners/:firebaseUid/approve', async (req, res) => {
  try {
    const owner = await Owner.findOne({ firebaseUid: req.params.firebaseUid })
    if (!owner) return res.status(404).json({ message: 'Owner not found' })

    if (!owner.gymmitraId) {
      const count = await Owner.countDocuments()
      const gymName = owner.propertyName || owner.name || 'GYM'
      const city = owner.address?.city || 'IND'
      const id = generateGymmitraId(gymName, city, count)
      owner.gymmitraId = id
    }
    owner.isApproved = true
    await owner.save()
    res.json(owner)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Update owner — plan, limit, revoke etc
router.put('/owners/:firebaseUid', async (req, res) => {
  try {
    const { planMonths, paymentAmount, ...rest } = req.body
    const updateData = { ...rest }

    if (planMonths) {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + parseInt(planMonths))
      updateData.planStartDate = startDate
      updateData.planEndDate = endDate
      updateData.isApproved = true

      if (paymentAmount) {
        const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
        const owner = await Owner.findOne({ firebaseUid: req.params.firebaseUid })
        await AdminRevenue.create({
          gymmitraId: owner?.gymmitraId || req.params.firebaseUid,
          gymName: owner?.propertyName || 'Unknown',
          amount: paymentAmount,
          planMonths,
          month: currentMonth,
          paidOn: new Date()
        })
      }
    }

    const owner = await Owner.findOneAndUpdate(
      { firebaseUid: req.params.firebaseUid },
      updateData,
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
    await Member.deleteMany({ ownerId: firebaseUid })
    await Payment.deleteMany({ ownerId: firebaseUid })
    await Notification.deleteMany({ ownerId: firebaseUid })
    await Owner.findOneAndDelete({ firebaseUid })
    res.json({ message: 'Owner deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Log admin revenue manually
router.post('/revenue', async (req, res) => {
  try {
    const revenue = await AdminRevenue.create(req.body)
    res.status(201).json(revenue)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete revenue entry
router.delete('/revenue/:id', async (req, res) => {
  try {
    await AdminRevenue.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router