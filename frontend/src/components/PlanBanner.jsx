import { usePlanStatus } from '../hooks/usePlanStatus'

const ADMIN_CONTACT = '98XXXXXXXX'

export default function PlanBanner() {
  const { isExpired, daysLeft, loading } = usePlanStatus()

  if (loading || daysLeft === null || daysLeft === 999) return null
  if (isExpired) return null

  if (daysLeft <= 3) {
    return (
      <div className="bg-red-600 text-white text-xs px-4 py-2 flex items-center justify-between">
        <span>Your GYMmitra plan expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. Contact admin immediately.</span>
        <span className="font-semibold">{ADMIN_CONTACT}</span>
      </div>
    )
  }

  if (daysLeft <= 7) {
    return (
      <div className="bg-yellow-500 text-white text-xs px-4 py-2 flex items-center justify-between">
        <span>Your GYMmitra plan expires in {daysLeft} days. Contact admin to renew.</span>
        <span className="font-semibold">{ADMIN_CONTACT}</span>
      </div>
    )
  }

  return null
}