import { useAuth } from '../context/AuthContext'
import { usePlanStatus } from '../hooks/usePlanStatus'

const ADMIN_CONTACT = '98XXXXXXXX'
const ADMIN_NAME = 'GYMmitra Admin'

export default function ExpiredWall() {
  const { logout } = useAuth()
  const { gymmitraId } = usePlanStatus()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center shadow-sm">
        <div className="text-5xl mb-4">💪</div>
        <h1 className="text-xl font-bold text-blue-600 mb-1">GYMmitra</h1>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 my-5">
          <p className="text-red-600 font-semibold text-sm mb-1">Your subscription has expired</p>
          <p className="text-gray-500 text-xs">You cannot make changes until you renew.</p>
        </div>
        {gymmitraId && (
          <div className="bg-gray-50 rounded-xl p-3 mb-5">
            <p className="text-xs text-gray-400 mb-1">Your GYMmitra ID</p>
            <p className="text-lg font-bold text-gray-700 tracking-wider">{gymmitraId}</p>
            <p className="text-xs text-gray-400 mt-1">Share this with admin when calling</p>
          </div>
        )}
        <p className="text-sm text-gray-600 mb-2">Contact to renew:</p>
        <p className="text-lg font-semibold text-blue-600 mb-1">{ADMIN_CONTACT}</p>
        <p className="text-xs text-gray-400 mb-6">{ADMIN_NAME}</p>
        <button
          onClick={logout}
          className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition"
        >
          Logout
        </button>
      </div>
    </div>
  )
}