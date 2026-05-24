import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function Dashboard() {
  const { currentUser } = useAuth()
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    expiredMembers: 0,
    expiringThisWeek: [],
    expiredList: [],
  })
  const [dueData, setDueData] = useState({ dues: [], totalDue: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    setError(false)
    try {
      const [statsRes, dueRes] = await Promise.all([
        axios.get(`${API}/dashboard?ownerId=${currentUser.uid}`),
        axios.get(`${API}/dues/summary/${currentUser.uid}`)
      ])
      setStats(statsRes.data)
      setDueData(dueRes.data)
    } catch (err) {
      setError(true)
    }
    setLoading(false)
  }, [currentUser])

  useEffect(() => { fetchAll() }, [fetchAll])

  function sendWhatsApp(due) {
    const message = `Hi ${due.memberName},\n\nYou have a pending due of Rs.${due.amount - due.paidAmount} at our gym.\n\nPlease clear your dues at the earliest.\n\nThank you!`
    const phone = due.mobile.replace(/[^0-9]/g, '')
    const indiaPhone = phone.startsWith('91') ? phone : `91${phone}`
    window.open(`https://wa.me/${indiaPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse h-24"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-400 text-xs">Welcome to GYMmitra</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 flex items-center justify-between">
          <p className="text-xs text-red-600">Failed to load. Tap retry.</p>
          <button onClick={fetchAll} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg ml-3">Retry</button>
        </div>
      )}

      {/* Top 3 stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-blue-600 rounded-2xl p-4 text-white">
          <p className="text-xs opacity-80 mb-1">Total</p>
          <p className="text-3xl font-bold">{stats.totalMembers}</p>
          <p className="text-xs opacity-70 mt-1">Members</p>
        </div>
        <div className="bg-green-500 rounded-2xl p-4 text-white">
          <p className="text-xs opacity-80 mb-1">Active</p>
          <p className="text-3xl font-bold">{stats.activeMembers}</p>
          <p className="text-xs opacity-70 mt-1">Members</p>
        </div>
        <div className="bg-gray-400 rounded-2xl p-4 text-white">
          <p className="text-xs opacity-80 mb-1">Inactive</p>
          <p className="text-3xl font-bold">{stats.inactiveMembers}</p>
          <p className="text-xs opacity-70 mt-1">Members</p>
        </div>
      </div>

      {/* Due Payments Card */}
      <div className="bg-white border-2 border-red-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-red-700">Due Payments</h2>
            <p className="text-xs text-red-400">Pending collections</p>
          </div>
          <div className="bg-red-50 rounded-xl px-3 py-1 text-right">
            <p className="text-xs text-red-400">Total Due</p>
            <p className="text-lg font-bold text-red-600">₹{dueData.totalDue.toLocaleString()}</p>
          </div>
        </div>
        {dueData.dues.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No pending dues</p>
        ) : (
          <div className="space-y-2">
            {dueData.dues.map(due => (
              <div key={due._id} className="flex items-center justify-between bg-red-50 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-xs font-bold text-red-600">
                    {due.memberName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{due.memberName}</p>
                    {due.note && <p className="text-xs text-gray-400">{due.note}</p>}
                    {due.status === 'partial' && (
                      <p className="text-xs text-orange-500">Partial — ₹{due.paidAmount} paid</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-red-600">₹{(due.amount - due.paidAmount).toLocaleString()}</p>
                  <button
                    onClick={() => sendWhatsApp(due)}
                    className="bg-green-500 text-white text-xs px-2 py-1.5 rounded-lg hover:bg-green-600"
                  >
                    WA
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two cards — Expiry This Week + Expired */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expiry This Week */}
        <div className="bg-white border-2 border-orange-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-orange-700">Expiring This Week</h2>
              <p className="text-xs text-orange-400">Next 7 days</p>
            </div>
            <span className="text-xl font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              {stats.expiringThisWeek.length}
            </span>
          </div>
          {stats.expiringThisWeek.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No memberships expiring this week</p>
          ) : (
            <div className="space-y-2">
              {stats.expiringThisWeek.map(member => {
                const daysLeft = Math.ceil((new Date(member.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
                return (
                  <Link key={member._id} to={`/member/${member._id}`} className="flex items-center justify-between bg-orange-50 rounded-xl p-3 hover:bg-orange-100 transition">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{member.name}</p>
                        <p className="text-xs text-gray-400">#{member.registrationNumber}</p>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-orange-600">
                      {daysLeft === 0 ? 'Today!' : `${daysLeft}d left`}
                    </p>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Expired */}
        <div className="bg-white border-2 border-red-100 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-red-700">Expired Members</h2>
              <p className="text-xs text-red-400">Need renewal</p>
            </div>
            <span className="text-xl font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
              {stats.expiredMembers}
            </span>
          </div>
          {stats.expiredList.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No expired memberships</p>
          ) : (
            <div className="space-y-2">
              {stats.expiredList.map(member => (
                <Link key={member._id} to={`/member/${member._id}`} className="flex items-center justify-between bg-red-50 rounded-xl p-3 hover:bg-red-100 transition">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center text-xs font-bold text-red-600">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-medium text-gray-700">{member.name}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(member.expiryDate).toLocaleDateString('en-IN')}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}