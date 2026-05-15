import express from 'express'
import Tenant from '../models/Tenant.js'

const router = express.Router()

// Get all tenants for an owner
router.get('/', async (req, res) => {
  try {
    const { ownerId } = req.query
    const tenants = await Tenant.find({ ownerId })
    res.json(tenants)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Add a new tenant
router.post('/', async (req, res) => {
  try {
    const tenant = new Tenant(req.body)
    await tenant.save()
    res.status(201).json(tenant)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Edit a tenant
router.put('/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    res.json(tenant)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete a tenant
router.delete('/:id', async (req, res) => {
  try {
    await Tenant.findByIdAndDelete(req.params.id)
    res.json({ message: 'Tenant deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router