import express from 'express'
import Member from '../models/Member.js'
import Payment from '../models/Payment.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { ownerId } = req.query
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysLater = new Date()
    sevenDaysLater.setDate(today.getDate() + 7)
    sevenDaysLater.setHours(23, 59, 59, 999)

    const totalMembers = await Member.countDocuments({ ownerId })
    const activeMembers = await Member.countDocuments({ ownerId, status: 'active' })
    const inactiveMembers = await Member.countDocuments({ ownerId, status: 'inactive' })
    const expiredMembers = await Member.countDocuments({ ownerId, status: 'expired' })
    const dueSoonMembers = await Member.countDocuments({ ownerId, status: 'due_soon' })

    const expiringThisWeek = await Member.find({
      ownerId,
      status: { $in: ['active', 'due_soon'] },
      expiryDate: { $gte: today, $lte: sevenDaysLater }
    }).sort({ expiryDate: 1 })

    const expiredList = await Member.find({
      ownerId,
      status: 'expired'
    }).sort({ expiryDate: -1 }).limit(10)

    const dueSoonList = await Member.find({
      ownerId,
      status: 'due_soon'
    }).sort({ expiryDate: 1 }).limit(10)

    res.json({
      totalMembers,
      activeMembers,
      inactiveMembers,
      expiredMembers,
      dueSoonMembers,
      expiringThisWeek,
      expiredList,
      dueSoonList,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router