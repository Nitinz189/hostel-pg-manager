import express from 'express'
import Member from '../models/Member.js'
import Owner from '../models/Owner.js'

const router = express.Router()

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

// Add member with limit check
router.post('/', async (req, res) => {
  try {
    const { ownerId } = req.body
    const owner = await Owner.findOne({ firebaseUid: ownerId })
    const memberCount = await Member.countDocuments({
      ownerId,
      status: { $ne: 'inactive' }
    })
    const limit = owner?.memberLimit || 10
    if (memberCount >= limit) {
      return res.status(403).json({
        message: `Member limit reached (${limit}). Please contact admin to upgrade your plan.`
      })
    }
    const member = new Member(req.body)
    await member.save()
    res.status(201).json(member)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Edit member
router.put('/:id', async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    )
    if (!member) return res.status(404).json({ message: 'Member not found' })
    res.json(member)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete member
router.delete('/:id', async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id)
    res.json({ message: 'Member deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router