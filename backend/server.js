import { startCronJob, checkMemberships } from './utils/cronJob.js'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import memberRoutes from './routes/memberRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import ownerRoutes from './routes/ownerRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import { startCronJob } from './utils/cronJob.js'
import adminRoutes from './routes/adminRoutes.js'

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

// Manual trigger for membership check
app.get('/api/check-memberships', async (req, res) => {
  await checkMemberships()
  res.json({ message: 'Membership check complete!' })
})

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  })
})

app.use('/api/members', memberRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/owner', ownerRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin', adminRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
// Self ping every 4 minutes to stay alive
import https from 'https'

setInterval(() => {
  https.get('https://hostel-pg-manager.onrender.com/health', (res) => {
    console.log('Self ping status:', res.statusCode)
  }).on('error', (err) => {
    console.log('Self ping error:', err.message)
  })
}, 4 * 60 * 1000)