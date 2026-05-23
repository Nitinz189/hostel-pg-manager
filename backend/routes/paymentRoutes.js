import express from 'express'
import Payment from '../models/Payment.js'
import Tenant from '../models/Tenant.js'

const router = express.Router()

// Get all payments for an owner
router.get('/', async (req, res) => {
  try {
    const { ownerId } = req.query
    const payments = await Payment.find({ ownerId })
    res.json(payments)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Mark rent as paid
router.post('/mark-paid', async (req, res) => {
  try {
    const { tenantId, ownerId, month, amount, tenantName, roomNumber } = req.body
    const payment = new Payment({
      ownerId,
      tenantId,
      tenantName,
      roomNumber,
      amount,
      month,
      status: 'paid',
      paidOn: new Date()
    })
    await payment.save()
    await Tenant.findByIdAndUpdate(tenantId, { paymentStatus: 'paid' })
    res.status(201).json(payment)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Mark rent as unpaid
router.post('/mark-unpaid', async (req, res) => {
  try {
    const { tenantId, month } = req.body
    await Payment.findOneAndDelete({ tenantId, month })
    await Tenant.findByIdAndUpdate(tenantId, { paymentStatus: 'unpaid' })
    res.json({ message: 'Marked as unpaid' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get monthly analytics
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
// Edit a payment
router.put('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    if (!payment) return res.status(404).json({ message: 'Payment not found' })
    res.json(payment)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete a payment
router.delete('/:id', async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id)
    res.json({ message: 'Payment deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})
export default router