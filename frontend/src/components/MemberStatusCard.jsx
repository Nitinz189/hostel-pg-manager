import { Link } from 'react-router-dom'

export default function MemberStatusCard({
  member,
  type = 'expiring',
  due = null,
  onPay,
  onWhatsApp
}) {
  const daysLeft = member?.expiryDate
    ? Math.ceil((new Date(member.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  const styles = {
    expiring: {
      border: 'border-orange-200',
      bg: 'bg-orange-50',
      badge: 'bg-orange-100 text-orange-700',
      text: 'text-orange-600'
    },
    expired: {
      border: 'border-red-200',
      bg: 'bg-red-50',
      badge: 'bg-red-100 text-red-700',
      text: 'text-red-600'
    },
    due: {
      border: 'border-red-200',
      bg: 'bg-red-50',
      badge: 'bg-red-100 text-red-700',
      text: 'text-red-600'
    }
  }

  const current = styles[type]

  return (
    <div className={`border-2 ${current.border} rounded-2xl p-4 bg-white hover:shadow-sm transition`}>
      <div className="flex items-start justify-between gap-3">

        <Link to={`/member/${member._id || due.memberId}`} className="flex items-center gap-3 flex-1 min-w-0">

          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${current.bg} ${current.text}`}>
            {(member?.name || due?.memberName)?.charAt(0)?.toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {member?.name || due?.memberName}
              </p>

              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${current.badge}`}>
                {type === 'expiring'
                  ? `${daysLeft}d left`
                  : type === 'expired'
                  ? 'Expired'
                  : 'Due'}
              </span>
            </div>

            {type !== 'due' ? (
              <p className="text-xs text-gray-400 mt-1">
                Expiry:
                {' '}
                {new Date(member.expiryDate).toLocaleDateString('en-IN')}
              </p>
            ) : (
              <>
                <p className="text-xs text-gray-400 mt-1">
                  Due ₹{(due.amount - due.paidAmount).toLocaleString()}
                </p>

                {due.status === 'partial' && (
                  <p className="text-xs text-orange-500 mt-1">
                    Partial Paid
                  </p>
                )}
              </>
            )}
          </div>
        </Link>

        <div className="flex flex-col gap-2">

          <button
            onClick={onWhatsApp}
            className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-2 rounded-xl font-medium"
          >
            WA
          </button>

          {type === 'due' && (
            <button
              onClick={onPay}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-xl font-medium"
            >
              Pay
            </button>
          )}

        </div>
      </div>
    </div>
  )
}