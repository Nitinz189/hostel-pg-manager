import express from 'express'
import Due from '../models/Due.js'

const router = express.Router()

// Get all dues for owner
router.get('/', async (req, res) => {
  try {
    const { ownerId } = req.query
    const dues = await Due.find({ ownerId, status: { $ne: 'paid' } }).sort({ createdAt: -1 })
    res.json(dues)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get dues for specific member
router.get('/member/:memberId', async (req, res) => {
  try {
    const dues = await Due.find({ memberId: req.params.memberId }).sort({ createdAt: -1 })
    res.json(dues)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Add new due
router.post('/', async (req, res) => {
  try {
    const due = new Due(req.body)
    await due.save()
    res.status(201).json(due)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Make payment on due
router.put('/:id/pay', async (req, res) => {
  try {
    const { payAmount } = req.body
    const due = await Due.findById(req.params.id)
    if (!due) return res.status(404).json({ message: 'Due not found' })

    due.paidAmount += payAmount
    const remaining = due.amount - due.paidAmount

    if (remaining <= 0) {
      due.status = 'paid'
      due.paidAmount = due.amount
    } else {
      due.status = 'partial'
    }

    await due.save()
    res.json(due)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete due
router.delete('/:id', async (req, res) => {
  try {
    await Due.findByIdAndDelete(req.params.id)
    res.json({ message: 'Due deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Dashboard summary
router.get('/summary/:ownerId', async (req, res) => {
  try {
    const dues = await Due.find({
      ownerId: req.params.ownerId,
      status: { $ne: 'paid' }
    }).sort({ createdAt: -1 })

    const totalDue = dues.reduce((sum, d) => sum + (d.amount - d.paidAmount), 0)
    res.json({ dues, totalDue })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
