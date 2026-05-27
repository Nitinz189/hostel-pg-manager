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
    } catch (err) {}
  }

  function sendWhatsApp(due) {
    const message = `Hi ${due.memberName},\n\nYou have a pending due of Rs.${due.amount - due.paidAmount} at our gym.\n\nPlease clear your dues at the earliest.\n\nThank you!`
    const phone = due.mobile.replace(/[^0-9]/g, '')
    const indiaPhone = phone.startsWith('91') ? phone : `91${phone}`
    window.open(`https://wa.me/${indiaPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  if (loading) {
    return (
      <div className="p-4 pb-32">
        <div className="h-40 bg-gray-100 rounded-3xl animate-pulse mb-4"></div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>)}
        </div>
        <div className="h-48 bg-gray-100 rounded-3xl animate-pulse mb-4"></div>
        <div className="h-48 bg-gray-100 rounded-3xl animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="pb-32 md:pb-8">

      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-100 rounded-xl p-3 flex items-center justify-between">
          <p className="text-xs text-red-600">Failed to load. Tap retry.</p>
          <button onClick={fetchAll} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg ml-3">Retry</button>
        </div>
      )}

      {/* Gradient Hero Card */}
      <div className="mx-4 mt-4 mb-4 rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 40%, #7c3aed 100%)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(20%, -20%)' }}></div>
        <p className="text-xs text-blue-200 mb-1 font-medium">Welcome back 👋</p>
        <p className="text-3xl font-bold mb-3">{stats.totalMembers} Members</p>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-xs text-blue-100">Active <span className="font-bold text-white">{stats.activeMembers}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="text-xs text-blue-100">Inactive <span className="font-bold text-white">{stats.inactiveMembers}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <span className="text-xs text-blue-100">Expired <span className="font-bold text-white">{stats.expiredMembers}</span></span>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3 mx-4 mb-4">
        <Link to="/expiring-members" className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100 active:scale-95 transition-transform">
          <p className="text-2xl font-bold text-orange-500">{stats.expiringThisWeek.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Expiring</p>
          <p className="text-xs text-gray-400">This week</p>
        </Link>
        <Link to="/expired-members" className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100 active:scale-95 transition-transform">
          <p className="text-2xl font-bold text-red-500">{stats.expiredMembers}</p>
          <p className="text-xs text-gray-500 mt-0.5">Expired</p>
          <p className="text-xs text-gray-400">Need renewal</p>
        </Link>
        <Link to="/due-members" className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100 active:scale-95 transition-transform">
          <p className="text-2xl font-bold text-purple-500">{dueData.dues.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Due</p>
          <p className="text-xs text-gray-400">₹{dueData.totalDue.toLocaleString()}</p>
        </Link>
      </div>

      {/* Expiring This Week */}
      {stats.expiringThisWeek.length > 0 && (
        <div className="mx-4 mb-4 bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-orange-400 rounded-full"></div>
              <h2 className="text-sm font-bold text-gray-800">Expiring This Week</h2>
            </div>
            <Link to="/expiring-members" className="text-xs text-orange-500 font-medium">View all →</Link>
          </div>
          <div className="space-y-2">
            {stats.expiringThisWeek.slice(0, 5).map(member => {
              const daysLeft = Math.ceil((new Date(member.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
              return (
                <Link key={member._id} to={`/member/${member._id}`}
                  className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 capitalize">{member.name}</p>
                      <p className="text-xs text-gray-400">#{member.registrationNumber}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    daysLeft <= 1 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {daysLeft === 0 ? 'Today!' : `${daysLeft}d left`}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Expired Members */}
      {stats.expiredList.length > 0 && (
        <div className="mx-4 mb-4 bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-red-400 rounded-full"></div>
              <h2 className="text-sm font-bold text-gray-800">Expired Members</h2>
            </div>
            <Link to="/expired-members" className="text-xs text-red-500 font-medium">View all →</Link>
          </div>
          <div className="space-y-2">
            {stats.expiredList.slice(0, 5).map(member => (
              <Link key={member._id} to={`/member/${member._id}`}
                className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 capitalize">{member.name}</p>
                    <p className="text-xs text-red-400">#{member.registrationNumber}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(member.expiryDate).toLocaleDateString('en-IN')}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Due Payments */}
      {dueData.dues.length > 0 && (
        <div className="mx-4 mb-4 bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-purple-400 rounded-full"></div>
              <h2 className="text-sm font-bold text-gray-800">Due Payments</h2>
            </div>
            <Link to="/due-members" className="text-xs text-purple-500 font-medium">View all →</Link>
          </div>
          <div className="space-y-2">
            {dueData.dues.slice(0, 5).map(due => (
              <div key={due._id}>
                {payingDue === due._id ? (
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-3">
                    <p className="text-xs text-green-700 font-medium mb-2">
                      {due.memberName} — Remaining: ₹{due.amount - due.paidAmount}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={payAmount}
                        onChange={e => setPayAmount(e.target.value)}
                        placeholder="Amount received"
                        className="flex-1 border border-gray-200 rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                      <button onClick={() => payDue(due._id)}
                        className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-xl hover:bg-green-600">Save</button>
                      <button onClick={() => setPayingDue(null)}
                        className="border border-gray-200 text-gray-500 text-xs px-2 py-1.5 rounded-xl">✕</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <Link to={`/member/${due.memberId}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                        {due.memberName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate capitalize">{due.memberName}</p>
                        <p className="text-xs font-bold text-red-500">₹{(due.amount - due.paidAmount).toLocaleString()} pending</p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <button onClick={() => sendWhatsApp(due)}
                        className="w-8 h-8 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-sm hover:bg-green-100 transition"
                        title="WhatsApp">💬</button>
                      <button onClick={() => { setPayingDue(due._id); setPayAmount(String(due.amount - due.paidAmount)) }}
                        className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-sm font-bold hover:bg-blue-100 transition"
                        title="Mark Paid">✓</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pay Due Modal */}
      {payingDue && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h2 className="text-base font-bold text-gray-800 mb-4">Record Payment</h2>
            <input
              type="number"
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              placeholder="Amount received"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setPayingDue(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm font-medium">Cancel</button>
              <button onClick={() => payDue(payingDue)}
                className="flex-1 bg-green-500 text-white py-3 rounded-2xl text-sm font-bold">Save Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}