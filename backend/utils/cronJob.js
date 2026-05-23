import cron from 'node-cron'
import Tenant from '../models/Tenant.js'
import Notification from '../models/Notification.js'

export function startCronJob() {
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily membership check...')
    try {
      const today = new Date()
      const sevenDaysLater = new Date()
      sevenDaysLater.setDate(today.getDate() + 7)

      const members = await Tenant.find({ isActive: true })

      for (const member of members) {
        const expiry = new Date(member.expiryDate)
        const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

        if (daysLeft < 0) {
          await Tenant.findByIdAndUpdate(member._id, { status: 'expired' })
          await Notification.create({
            ownerId: member.ownerId,
            title: 'Membership Expired',
            message: `${member.name} (Reg: ${member.registrationNumber}) membership has expired!`,
            type: 'overdue',
            tenantId: member._id
          })
        } else if (daysLeft <= 7) {
          await Tenant.findByIdAndUpdate(member._id, { status: 'due_soon' })
          await Notification.create({
            ownerId: member.ownerId,
            title: 'Membership Expiring Soon',
            message: `${member.name} (Reg: ${member.registrationNumber}) membership expires in ${daysLeft} days on ${expiry.toLocaleDateString('en-IN')}.`,
            type: 'reminder',
            tenantId: member._id
          })
        } else {
          await Tenant.findByIdAndUpdate(member._id, { status: 'active' })
        }
      }
      console.log('Daily membership check complete!')
    } catch (err) {
      console.log('Cron error:', err)
    }
  })
}