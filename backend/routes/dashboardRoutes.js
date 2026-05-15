import express from 'express'
import Tenant from '../models/Tenant.js'
import Payment from '../models/Payment.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { ownerId } = req.query
    const totalTenants = await Tenant.countDocuments({ ownerId })
    const paidTenants = await Tenant.countDocuments({ ownerId, paymentStatus: 'paid' })
    const pendingTenants = totalTenants - paidTenants
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
    const monthlyPayments = await Payment.find({ ownerId, month: currentMonth, status: 'paid' })
    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0)
    const upcomingDue = await Tenant.find({
      ownerId,
      paymentStatus: 'unpaid'
    }).limit(5)

    res.json({
      totalTenants,
      paidTenants,
      pendingTenants,
      monthlyRevenue,
      upcomingDue
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router