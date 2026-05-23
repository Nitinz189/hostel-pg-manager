import express from 'express'
import Tenant from '../models/Tenant.js'
import Payment from '../models/Payment.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { ownerId } = req.query
    const today = new Date()
    const sevenDaysLater = new Date()
    sevenDaysLater.setDate(today.getDate() + 7)

    const totalMembers = await Tenant.countDocuments({ ownerId })
    const activeMembers = await Tenant.countDocuments({ ownerId, status: 'active' })
    const expiredMembers = await Tenant.countDocuments({ ownerId, status: 'expired' })
    const dueSoonMembers = await Tenant.countDocuments({ ownerId, status: 'due_soon' })

    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
    const monthlyPayments = await Payment.find({ ownerId, month: currentMonth, status: 'paid' })
    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0)

    const expiringSoon = await Tenant.find({
      ownerId,
      expiryDate: { $lte: sevenDaysLater, $gte: today },
      status: { $ne: 'expired' }
    }).limit(5)

    const recentExpired = await Tenant.find({
      ownerId,
      status: 'expired'
    }).sort({ expiryDate: -1 }).limit(5)

    res.json({
      totalMembers,
      activeMembers,
      expiredMembers,
      dueSoonMembers,
      monthlyRevenue,
      expiringSoon,
      recentExpired,
      upcomingDue: [...expiringSoon, ...recentExpired]
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router