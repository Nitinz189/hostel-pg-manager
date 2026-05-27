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
  const [activeTab, setActiveTab] = useState('expired')
  const [payingDue, setPayingDue] = useState(null)
  const [payAmount, setPayAmount] = useState('')

  const fetchAll = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    setError(false)
    try {
      const statsRes = await axios.get(`${API}/dashboard?ownerId=${currentUser.uid}`)
      setStats(statsRes.data)
    } catch (err) {
      setError(true)
    }

    try {
      const dueRes = await axios.get(`${API}/dues/summary/${currentUser.uid}`)
      setDueData(dueRes.data)
    } catch (err) {
      console.log('Dues error:', err)
      setDueData({ dues: [], totalDue: 0 })
    }

    setLoading(false)
  }, [currentUser])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function payDue(dueId) {
    try {
      await axios.put(`${API}/dues/${dueId}/pay`, { payAmount: parseInt(payAmount) })
      setPayingDue(null)
      setPayAmount('')
      fetchAll()
    } catch (err) {
      console.log('Pay due error:', err)
    }
  }

  function sendWhatsApp(due) {
    const message = `Hi ${due.memberName},\n\nYou have a pending due of Rs.${due.amount - due.paidAmount} at our gym.\n\nPlease clear your dues at the earliest.\n\nThank you!`
    const phone = due.mobile.replace(/[^0-9]/g, '')
    const indiaPhone = phone.startsWith('91') ? phone : `91${phone}`
    window.open(`https://wa.me/${indiaPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl p-4 animate-pulse h-24 bg-gray-100"></div>
          ))}
        </div>
        <div className="bg-gray-100 rounded-2xl h-40 animate-pulse mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-100 rounded-2xl h-40 animate-pulse"></div>
          <div className="bg-gray-100 rounded-2xl h-40 animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 pb-32 md:pb-6">
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
        <div className="bg-blue-600 rounded-2xl p-3 md:p-4 text-white">
          <p className="text-xs opacity-80 mb-1">Total</p>
          <p className="text-2xl md:text-3xl font-bold">{stats.totalMembers}</p>
          <p className="text-xs opacity-70 mt-1">Members</p>
        </div>
        <div className="bg-green-500 rounded-2xl p-3 md:p-4 text-white">
          <p className="text-xs opacity-80 mb-1">Active</p>
          <p className="text-2xl md:text-3xl font-bold">{stats.activeMembers}</p>
          <p className="text-xs opacity-70 mt-1">Members</p>
        </div>
        <div className="bg-gray-400 rounded-2xl p-3 md:p-4 text-white">
          <p className="text-xs opacity-80 mb-1">Inactive</p>
          <p className="text-2xl md:text-3xl font-bold">{stats.inactiveMembers}</p>
          <p className="text-xs opacity-70 mt-1">Members</p>
        </div>
      </div>

      {/* Expiring This Week — full width, most important */}
      <div className="bg-white border-2 border-orange-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-orange-700">Expiring This Week</h2>
            <p className="text-xs text-orange-400">Next 7 days — call them now</p>
          </div>
          <span className="text-xl font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
            {stats.expiringThisWeek.length}
          </span>
        </div>
        {stats.expiringThisWeek.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">No memberships expiring this week</p>
        ) : (
          <div className="space-y-2">
            {stats.expiringThisWeek.slice(0, 5).map(member => {
              const daysLeft = Math.ceil((new Date(member.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
              return (
                <Link
                  key={member._id}
                  to={`/member/${member._id}`}
                  className="flex items-center justify-between bg-orange-50 rounded-xl p-3 hover:bg-orange-100 transition"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-orange-200 rounded-full flex items-center justify-center text-xs font-bold text-orange-700">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 capitalize">{member.name}</p>
                      <p className="text-xs text-gray-400">#{member.registrationNumber}</p>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-orange-600">
                    {daysLeft === 0 ? 'Today!' : `${daysLeft}d left`}
                  </p>
                </Link>
              )
            })}
            {stats.expiringThisWeek.length > 5 && (
  <Link to="/expiring-members" className="block text-center text-xs text-orange-600 hover:underline mt-2"> View all {stats.expiringThisWeek.length} expiring members →</Link>)}
          </div>
        )}
      </div>

      {/* Two side by side — Expired and Due with tabs on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Expired Members */}
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
            <p className="text-sm text-gray-400 text-center py-3">No expired memberships</p>
          ) : (
            <div className="space-y-2">
              {stats.expiredList.slice(0, 5).map(member => (
                <Link
                  key={member._id}
                  to={`/member/${member._id}`}
                  className="flex items-center justify-between bg-red-50 rounded-xl p-3 hover:bg-red-100 transition"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center text-xs font-bold text-red-600">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-medium text-gray-700 capitalize">{member.name}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(member.expiryDate).toLocaleDateString('en-IN')}
                  </p>
                </Link>
              ))}
              {stats.expiredList.length > 5 && (<Link to="/expired-members" className="block text-center text-xs text-red-600 hover:underline mt-2">View all {stats.expiredMembers} expired members →</Link>)}
            </div>
          )}
        </div>

        {/* Due Payments */}
        <div className="bg-white border-2 border-red-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-red-700">Due Payments</h2>
              <p className="text-xs text-red-400">Total: ₹{dueData.totalDue.toLocaleString()}</p>
            </div>
            <span className="text-xl font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
              {dueData.dues.length}
            </span>
          </div>
          {dueData.dues.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">No pending dues</p>
          ) : (
            <div className="space-y-2">
              {dueData.dues.slice(0, 5).map(due => (
                <div key={due._id}>
                  {payingDue === due._id ? (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                      <p className="text-xs text-green-700 font-medium mb-2">
                        Pay for {due.memberName} — Remaining: ₹{due.amount - due.paidAmount}
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={payAmount}
                          onChange={e => setPayAmount(e.target.value)}
                          placeholder="Amount received"
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                        <button
                          onClick={() => payDue(due._id)}
                          className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setPayingDue(null)}
                          className="border border-gray-200 text-gray-500 text-xs px-2 py-1.5 rounded-lg"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-red-50 rounded-xl p-3">
                      <Link to={`/member/${due.memberId}`} className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center text-xs font-bold text-red-600 flex-shrink-0">
                          {due.memberName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{due.memberName}</p>
                          {due.note && <p className="text-xs text-gray-400 truncate">{due.note}</p>}
                          {due.status === 'partial' && (
                            <p className="text-xs text-orange-500">Partial paid</p>
                          )}
                        </div>
                      </Link>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <p className="text-sm font-bold text-red-600">₹{(due.amount - due.paidAmount).toLocaleString()}</p>
                        <button
  onClick={() => sendWhatsApp(due)}
  className="bg-green-500 text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-green-600"
  title="Send WhatsApp"
>
  💬
</button>
<button
  onClick={() => { setPayingDue(due._id); setPayAmount(String(due.amount - due.paidAmount)) }}
  className="bg-blue-600 text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-blue-700"
  title="Mark Paid"
>
  ✓
</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {dueData.dues.length > 5 && (
  <Link to="/due-members" className="block text-center text-xs text-red-600 hover:underline mt-2">
    View all {dueData.dues.length} due members →
  </Link>
)}
            </div>
          )}
        </div>
      </div>

      {/* Pay Due Modal */}
      {payingDue && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Record Payment</h2>
            <input
              type="number"
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              placeholder="Amount received"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-3"
            />
            <div className="flex gap-2">
              <button onClick={() => setPayingDue(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={() => payDue(payingDue)} className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}