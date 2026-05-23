import cron from 'node-cron'
import Member from '../models/Member.js'
import Notification from '../models/Notification.js'

export function startCronJob() {
  cron.schedule('0 8 * * *', async () => {
    await checkMemberships()
  })
  console.log('Cron job scheduled — runs daily at 8 AM')
}

export async function checkMemberships() {
  console.log('Running membership expiry check...')
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysLater = new Date()
    sevenDaysLater.setDate(today.getDate() + 7)

    const members = await Member.find({
      status: { $ne: 'inactive' }
    })

    for (const member of members) {
      const expiry = new Date(member.expiryDate)
      expiry.setHours(0, 0, 0, 0)
      const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

      if (daysLeft < 0 && member.status !== 'expired') {
        await Member.findByIdAndUpdate(member._id, { status: 'expired' })
        await Notification.create({
          ownerId: member.ownerId,
          title: 'Membership Expired',
          message: `${member.name} (Reg: ${member.registrationNumber}) membership expired ${Math.abs(daysLeft)} days ago.`,
          type: 'overdue',
          tenantId: member._id
        })
      } else if (daysLeft >= 0 && daysLeft <= 7 && member.status !== 'due_soon') {
        await Member.findByIdAndUpdate(member._id, { status: 'due_soon' })
        await Notification.create({
          ownerId: member.ownerId,
          title: 'Membership Expiring Soon',
          message: `${member.name} (Reg: ${member.registrationNumber}) membership expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} on ${expiry.toLocaleDateString('en-IN')}.`,
          type: 'reminder',
          tenantId: member._id
        })
      } else if (daysLeft > 7 && member.status !== 'active') {
        await Member.findByIdAndUpdate(member._id, { status: 'active' })
      }
    }
    console.log('Membership check complete!')
  } catch (err) {
    console.log('Cron error:', err)
  }
}