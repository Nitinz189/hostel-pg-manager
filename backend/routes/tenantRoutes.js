import express from 'express'
import Tenant from '../models/Tenant.js'

const router = express.Router()

// Get all tenants
router.get('/', async (req, res) => {
  try {
    const { ownerId } = req.query
    if (!ownerId) return res.status(400).json({ message: 'ownerId is required' })
    const tenants = await Tenant.find({ ownerId }).sort({ createdAt: -1 })
    res.json(tenants)
  } catch (err) {
    console.log('Get tenants error:', err)
    res.status(500).json({ message: err.message })
  }
})
// Get single tenant
router.get('/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id)
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' })
    res.json(tenant)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Add tenant
router.post('/', async (req, res) => {
  try {
    const tenant = new Tenant(req.body)
    await tenant.save()
    res.status(201).json(tenant)
  } catch (err) {
    console.log('Add tenant error:', err)
    res.status(500).json({ message: err.message })
  }
})

// Edit tenant
router.put('/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' })
    res.json(tenant)
  } catch (err) {
    console.log('Edit tenant error:', err)
    res.status(500).json({ message: err.message })
  }
})

// Delete tenant
router.delete('/:id', async (req, res) => {
  try {
    await Tenant.findByIdAndDelete(req.params.id)
    res.json({ message: 'Tenant deleted successfully' })
  } catch (err) {
    console.log('Delete tenant error:', err)
    res.status(500).json({ message: err.message })
  }
})

export default router