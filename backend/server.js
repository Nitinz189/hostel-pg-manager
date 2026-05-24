import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import https from 'https'
import memberRoutes from './routes/memberRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import dueRoutes from './routes/dueRoutes.js'
import ownerRoutes from './routes/ownerRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import { startCronJob, checkMemberships } from './utils/cronJob.js'

dotenv.config()

const app = express()

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }))
app.use(express.json())

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    console.log('MongoDB Connected')
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

app.get('/', (req, res) => res.json({ message: 'GYMmitra API is running!' }))
app.get('/health', (req, res) => res.json({ status: 'ok', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }))
app.get('/api/check-memberships', async (req, res) => {
  await checkMemberships()
  res.json({ message: 'Membership check complete!' })
})

app.use('/api/members', memberRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/owner', ownerRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/dues', dueRoutes)

// Self ping
setInterval(() => {
  https.get(`https://hostel-pg-manager.onrender.com/health`, () => {}).on('error', () => {})
}, 4 * 60 * 1000)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`GYMmitra server running on port ${PORT}`))