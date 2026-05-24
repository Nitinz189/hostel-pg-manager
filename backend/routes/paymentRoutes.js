import Owner from '../models/Owner.js'
import express from 'express'
import Payment from '../models/Payment.js'
import Member from '../models/Member.js'

const router = express.Router()

// Get all payments
router.get('/', async (req, res) => {
  try {
    const { ownerId } = req.query
    const payments = await Payment.find({ ownerId }).sort({ createdAt: -1 })
    res.json(payments)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Mark as paid
router.post('/mark-paid', async (req, res) => {
  try {
    
    const owner = await Owner.findOne({ firebaseUid: ownerId })
    if (owner?.planEndDate && new Date(owner.planEndDate) < new Date()) {
      return res.status(403).json({ message: 'Your GYMmitra plan has expired. Contact admin to renew.' })
    }
    const { memberId, ownerId, month, amount, memberName, registrationNumber } = req.body
    const payment = new Payment({
      ownerId,
      tenantId: memberId,
      tenantName: memberName,
      roomNumber: registrationNumber,
      amount,
      month,
      status: 'paid',
      paidOn: new Date()
    })
    await payment.save()
    res.status(201).json(payment)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Mark as unpaid
router.post('/mark-unpaid', async (req, res) => {
  try {
    const { memberId, month } = req.body
    await Payment.findOneAndDelete({ tenantId: memberId, month })
    res.json({ message: 'Marked as unpaid' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Edit payment
router.put('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    )
    if (!payment) return res.status(404).json({ message: 'Payment not found' })
    res.json(payment)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id)
    res.json({ message: 'Payment deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get analytics
router.get('/analytics', async (req, res) => {
  try {
    const { ownerId } = req.query
    const payments = await Payment.find({ ownerId, status: 'paid' })
    const analytics = {}
    payments.forEach(p => {
      if (!analytics[p.month]) analytics[p.month] = 0
      analytics[p.month] += p.amount
    })
    res.json(analytics)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router