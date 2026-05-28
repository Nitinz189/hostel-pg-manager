import express from 'express'
import Member from '../models/Member.js'
import Owner from '../models/Owner.js'
import Payment from '../models/Payment.js'

const router = express.Router()

function isPlanExpired(owner) {
  if (!owner) return false
  if (!owner.planEndDate) return false
  return new Date(owner.planEndDate) < new Date()
}

// Get all members
router.get('/', async (req, res) => {
  try {
    const { ownerId } = req.query
    if (!ownerId) return res.status(400).json({ message: 'ownerId required' })
    const members = await Member.find({ ownerId }).sort({ createdAt: -1 })
    res.json(members)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get single member
router.get('/:id', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
    if (!member) return res.status(404).json({ message: 'Member not found' })
    res.json(member)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Add member — blocked if plan expired or limit reached
router.post('/', async (req, res) => {
  try {
    const { ownerId } = req.body
    const owner = await Owner.findOne({ firebaseUid: ownerId })

    if (isPlanExpired(owner)) {
      return res.status(403).json({ message: 'Your GYMmitra plan has expired. Contact admin to renew.' })
    }

    const memberCount = await Member.countDocuments({ ownerId, status: { $ne: 'inactive' } })
    const limit = owner?.memberLimit || 10
    if (memberCount >= limit) {
      return res.status(403).json({ message: `Member limit reached (${limit}). Contact admin to upgrade.` })
    }

    const member = new Member(req.body)
    await member.save()

    // Auto create payment record when member is added
    if (req.body.membershipFee) {
      const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
      const payment = new Payment({
        ownerId: req.body.ownerId,
        tenantId: member._id.toString(),
        tenantName: member.name,
        roomNumber: member.registrationNumber,
        amount: req.body.membershipFee,
        month: currentMonth,
        status: 'paid',
        paidOn: new Date()
      })
      await payment.save()
    }

    res.status(201).json(member)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Edit member — blocked if plan expired
router.put('/:id', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
    if (!member) return res.status(404).json({ message: 'Member not found' })

    const owner = await Owner.findOne({ firebaseUid: member.ownerId })
    if (isPlanExpired(owner)) {
      return res.status(403).json({ message: 'Your GYMmitra plan has expired. Contact admin to renew.' })
    }

    const updated = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete member — blocked if plan expired
router.delete('/:id', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
    if (!member) return res.status(404).json({ message: 'Member not found' })

    const owner = await Owner.findOne({ firebaseUid: member.ownerId })
    if (isPlanExpired(owner)) {
      return res.status(403).json({ message: 'Your GYMmitra plan has expired. Contact admin to renew.' })
    }

    await Member.findByIdAndDelete(req.params.id)
    res.json({ message: 'Member deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router