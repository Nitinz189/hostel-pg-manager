import cron from 'node-cron'
import Tenant from '../models/Tenant.js'
import Notification from '../models/Notification.js'

export function startCronJob() {
  // Runs every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily rent check...')
    try {
      const today = new Date()
      const todayDate = today.getDate()
      const tenants = await Tenant.find({ isActive: true })

      for (const tenant of tenants) {
        // Check if rent due today
        if (tenant.rentDueDate === todayDate && tenant.paymentStatus !== 'paid') {
          await Notification.create({
            ownerId: tenant.ownerId,
            title: 'Rent Due Today',
            message: `${tenant.name} (Room ${tenant.roomNumber}) has rent of ₹${tenant.rentAmount} due today.`,
            type: 'reminder',
            tenantId: tenant._id
          })
        }

        // Check overdue — due date has passed
        if (tenant.rentDueDate < todayDate && tenant.paymentStatus !== 'paid') {
          await Tenant.findByIdAndUpdate(tenant._id, { paymentStatus: 'overdue' })
          await Notification.create({
            ownerId: tenant.ownerId,
            title: 'Rent Overdue',
            message: `${tenant.name} (Room ${tenant.roomNumber}) rent of ₹${tenant.rentAmount} is overdue!`,
            type: 'overdue',
            tenantId: tenant._id
          })
        }
      }
      console.log('Daily rent check complete!')
    } catch (err) {
      console.log('Cron error:', err)
    }
  })
}