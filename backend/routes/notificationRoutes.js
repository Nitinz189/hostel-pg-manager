import express from 'express'
import Notification from '../models/Notification.js'

const router = express.Router()

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const { ownerId } = req.query
    const notifications = await Notification.find({ ownerId })
      .sort({ createdAt: -1 })
      .limit(20)
    res.json(notifications)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Mark all as read
router.put('/mark-read', async (req, res) => {
  try {
    const { ownerId } = req.body
    await Notification.updateMany({ ownerId }, { isRead: true })
    res.json({ message: 'All marked as read' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const { ownerId } = req.query
    const count = await Notification.countDocuments({ ownerId, isRead: false })
    res.json({ count })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router