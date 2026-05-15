import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function Dashboard() {
  const { currentUser } = useAuth()
  const [stats, setStats] = useState({
    totalTenants: 0,
    paidTenants: 0,
    pendingTenants: 0,
    monthlyRevenue: 0,
    upcomingDue: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await axios.get(`${API}/dashboard?ownerId=${currentUser.uid}`)
        setStats(res.data)
      } catch (err) {
        console.log(err)
      }
      setLoading(false)
    }
    if (currentUser) fetchStats()
  }, [currentUser])

  const cards = [
    {
      label: 'Total Tenants',
      value: stats.totalTenants,
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: '🏠'
    },
    {
      label: 'Paid This Month',
      value: stats.paidTenants,
      bg: 'bg-green-50',
      text: 'text-green-600',
      icon: '✅'
    },
    {
      label: 'Pending Rent',
      value: stats.pendingTenants,
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: '⏳'
    },
    {
      label: 'Monthly Revenue',
      value: `₹${stats.monthlyRevenue}`,
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      icon: '💰'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">
        Welcome back, {currentUser?.email}
      </p>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`${card.bg} rounded-2xl p-5`}
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className={`text-2xl font-semibold ${card.text}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Upcoming Due */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4">
          Pending Rent Tenants
        </h2>
        {stats.upcomingDue.length === 0 ? (
          <p className="text-gray-400 text-sm">
            All tenants have paid this month 🎉
          </p>
        ) : (
          <div className="space-y-3">
            {stats.upcomingDue.map((tenant) => (
              <div
                key={tenant._id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {tenant.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    Room {tenant.roomNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-500">
                    ₹{tenant.rentAmount}
                  </p>
                  <p className="text-xs text-gray-400">
                    Due: {tenant.rentDueDate}th
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}