import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL

export default function Notifications() {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchNotifications() {
    try {
      const res = await axios.get(`${API}/notifications?ownerId=${currentUser.uid}`)
      setNotifications(res.data)
    } catch (err) {
      toast.error('Failed to load notifications')
    }
    setLoading(false)
  }

  async function markAllRead() {
    try {
      await axios.put(`${API}/notifications/mark-read`, { ownerId: currentUser.uid })
      fetchNotifications()
      toast.success('All marked as read!')
    } catch (err) {
      toast.error('Failed to mark as read')
    }
  }

  useEffect(() => {
    if (currentUser) fetchNotifications()
  }, [currentUser])

  const typeStyles = {
    reminder: { bg: 'bg-blue-50', text: 'text-blue-600', icon: '🔔' },
    overdue: { bg: 'bg-red-50', text: 'text-red-600', icon: '⚠️' },
    payment: { bg: 'bg-green-50', text: 'text-green-600', icon: '✅' },
    system: { bg: 'bg-gray-50', text: 'text-gray-600', icon: '📢' },
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Notifications</h1>
          <p className="text-gray-500 text-sm">Stay updated on rent and payments</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={markAllRead}
            className="text-sm text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-3">🔔</p>
          <p className="text-sm">No notifications yet</p>
          <p className="text-xs mt-1">Rent reminders will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => {
            const style = typeStyles[n.type] || typeStyles.system
            return (
              <div
                key={n._id}
                className={`bg-white rounded-xl p-4 border transition ${
                  n.isRead ? 'border-gray-100' : 'border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0 text-base`}>
                    {style.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}