import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import tenantRoutes from './routes/tenantRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import ownerRoutes from './routes/ownerRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import { startCronJob } from './utils/cronJob.js'

dotenv.config()

const app = express()

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// MongoDB connection with auto reconnect
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    console.log('MongoDB Connected Successfully')
    startCronJob()
  } catch (err) {
    console.log('MongoDB Error:', err)
    setTimeout(connectDB, 5000)
  }
}

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Reconnecting...')
  setTimeout(connectDB, 5000)
})

connectDB()

app.get('/', (req, res) => {
  res.json({ message: 'Hostel PG Manager API is running!' })
})

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  })
})

app.use('/api/tenants', tenantRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/owner', ownerRoutes)
app.use('/api/notifications', notificationRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})