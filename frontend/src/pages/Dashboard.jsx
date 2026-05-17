import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const API = import.meta.env.VITE_API_URL

export default function Dashboard() {
  const { currentUser } = useAuth()
  const [stats, setStats] = useState({
    totalTenants: 0,
    paidTenants: 0,
    pendingTenants: 0,
    overdueTenants: 0,
    monthlyRevenue: 0,
    upcomingDue: []
  })
  const [analytics, setAnalytics] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [statsRes, analyticsRes, notifRes] = await Promise.all([
          axios.get(`${API}/dashboard?ownerId=${currentUser.uid}`),
          axios.get(`${API}/payments/analytics?ownerId=${currentUser.uid}`),
          axios.get(`${API}/notifications?ownerId=${currentUser.uid}`)
        ])
        setStats(statsRes.data)
        const chartData = Object.entries(analyticsRes.data).map(([month, amount]) => ({
          month: month.split(' ')[0].substring(0, 3),
          amount
        }))
        setAnalytics(chartData)
        setNotifications(notifRes.data.filter(n => !n.isRead).slice(0, 3))
      } catch (err) {
        console.log(err)
      }
      setLoading(false)
    }
    if (currentUser) fetchAll()
  }, [currentUser])

  const cards = [
    { label: 'Total Tenants', value: stats.totalTenants, bg: 'bg-blue-50', text: 'text-blue-600', icon: '🏠', border: 'border-blue-100' },
    { label: 'Paid This Month', value: stats.paidTenants, bg: 'bg-green-50', text: 'text-green-600', icon: '✅', border: 'border-green-100' },
    { label: 'Pending Rent', value: stats.pendingTenants, bg: 'bg-yellow-50', text: 'text-yellow-600', icon: '⏳', border: 'border-yellow-100' },
    { label: 'Overdue', value: stats.overdueTenants || 0, bg: 'bg-red-50', text: 'text-red-600', icon: '🚨', border: 'border-red-100' },
    { label: 'Monthly Revenue', value: `₹${stats.monthlyRevenue.toLocaleString()}`, bg: 'bg-purple-50', text: 'text-purple-600', icon: '💰', border: 'border-purple-100' },
  ]

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
              <div className="h-8 w-8 bg-gray-100 rounded-full mb-3"></div>
              <div className="h-3 bg-gray-100 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back! Here is your overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {cards.map((card, i) => (
          <div key={i} className={`${card.bg} border ${card.border} rounded-2xl p-4`}>
            <div className="text-xl mb-2">{card.icon}</div>
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-xl font-semibold ${card.text}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Revenue</h2>
          {analytics.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              No payment data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Recent Alerts</h2>
            <Link to="/notifications" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">🔔</p>
              <p className="text-xs">No new alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n._id} className="flex items-start gap-2">
                  <span className="text-base flex-shrink-0">
                    {n.type === 'overdue' ? '🚨' : n.type === 'reminder' ? '🔔' : '✅'}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-gray-700">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Tenants */}
      <div className="mt-4 bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Pending & Overdue Tenants</h2>
          <Link to="/payments" className="text-xs text-blue-600 hover:underline">Manage payments</Link>
        </div>
        {stats.upcomingDue.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-sm">All tenants have paid this month!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.upcomingDue.map(tenant => (
              <div key={tenant._id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                    {tenant.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{tenant.name}</p>
                    <p className="text-xs text-gray-400">Room {tenant.roomNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-500">₹{tenant.rentAmount}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    tenant.paymentStatus === 'overdue'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {tenant.paymentStatus === 'overdue' ? 'Overdue' : 'Due ' + tenant.rentDueDate + 'th'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}