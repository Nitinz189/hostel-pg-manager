import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL
const ADMIN_EMAIL = 'vnitin398@gmail.com'

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <p className="text-sm text-gray-700 mb-5 text-center">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm font-medium">Cancel</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 text-white py-3 rounded-2xl text-sm font-bold">Confirm</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [owners, setOwners] = useState([])
  const [stats, setStats] = useState({ totalOwners: 0, activeOwners: 0, pendingOwners: 0, expiringThisMonth: 0 })
  const [adminRevenue, setAdminRevenue] = useState([])
  const [adminStats, setAdminStats] = useState({ total: 0, thisMonthRevenue: 0 })
  const [loading, setLoading] = useState(true)
  const [gymFilter, setGymFilter] = useState('all')
  const [confirmAction, setConfirmAction] = useState(null)
  const [extendModal, setExtendModal] = useState(null)
  const [extendForm, setExtendForm] = useState({ planMonths: '3', planDays: '', plan: 'basic', memberLimit: '100', paymentAmount: '' })
  const [addRevenueModal, setAddRevenueModal] = useState(false)
  const [revenueForm, setRevenueForm] = useState({ gymmitraId: '', gymName: '', amount: '', planMonths: '', notes: '' })
  const navigate = useNavigate()
  const isAdmin = currentUser?.email === ADMIN_EMAIL

  async function fetchAll() {
    try {
      const [ownersRes, revenueRes] = await Promise.all([
        axios.get(`${API}/admin/owners`),
        axios.get(`${API}/admin/revenue`)
      ])
      setOwners(ownersRes.data.owners)
      setStats(ownersRes.data.stats)
      setAdminRevenue(revenueRes.data.revenue)
      setAdminStats({ total: revenueRes.data.total, thisMonthRevenue: revenueRes.data.thisMonthRevenue })
    } catch (err) { toast.error('Failed to load admin data') }
    setLoading(false)
  }

  useEffect(() => { if (currentUser && isAdmin) fetchAll() }, [currentUser])

  async function approveOwner(firebaseUid) {
    try {
      await axios.put(`${API}/admin/owners/${firebaseUid}/approve`)
      toast.success('Approved!'); fetchAll()
    } catch { toast.error('Failed') }
  }

  async function extendPlan(firebaseUid) {
    try {
      const payload = {
        plan: extendForm.plan,
        memberLimit: parseInt(extendForm.memberLimit),
        isApproved: true,
        paymentAmount: extendForm.paymentAmount ? parseInt(extendForm.paymentAmount) : null,
      }
      // Use days if provided, otherwise months
      if (extendForm.planDays && parseInt(extendForm.planDays) > 0) {
        payload.planDays = parseInt(extendForm.planDays)
      } else {
        payload.planMonths = parseInt(extendForm.planMonths)
      }
      await axios.put(`${API}/admin/owners/${firebaseUid}`, payload)
      toast.success('Plan extended!'); setExtendModal(null); fetchAll()
    } catch { toast.error('Failed to extend') }
  }

  async function revokeOwner(firebaseUid) {
    try {
      await axios.put(`${API}/admin/owners/${firebaseUid}`, { isApproved: false })
      toast.success('Revoked!'); setConfirmAction(null); fetchAll()
    } catch { toast.error('Failed') }
  }

  async function deleteOwner(firebaseUid) {
    try {
      await axios.delete(`${API}/admin/owners/${firebaseUid}`)
      toast.success('Deleted!'); setConfirmAction(null); fetchAll()
    } catch { toast.error('Failed') }
  }

  async function addRevenue(e) {
    e.preventDefault()
    try {
      const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
      await axios.post(`${API}/admin/revenue`, {
        ...revenueForm, amount: parseInt(revenueForm.amount),
        planMonths: parseInt(revenueForm.planMonths), month: currentMonth, paidOn: new Date()
      })
      toast.success('Logged!'); setAddRevenueModal(false)
      setRevenueForm({ gymmitraId: '', gymName: '', amount: '', planMonths: '', notes: '' }); fetchAll()
    } catch { toast.error('Failed') }
  }

  async function deleteRevenue(id) {
    try {
      await axios.delete(`${API}/admin/revenue/${id}`)
      toast.success('Deleted!'); fetchAll()
    } catch { toast.error('Failed') }
  }

  if (!isAdmin) return (
    <div className="p-6 text-center">
      <div className="text-5xl mb-4">🚫</div>
      <h1 className="text-xl font-semibold text-gray-800">Access Denied</h1>
    </div>
  )

  const filteredOwners = owners.filter(o => {
    if (gymFilter === 'pending') return !o.isApproved
    if (gymFilter === 'active') return o.isApproved && o.planEndDate && new Date(o.planEndDate) > new Date()
    if (gymFilter === 'expiring') {
      if (!o.planEndDate) return false
      const days = Math.ceil((new Date(o.planEndDate) - new Date()) / (1000 * 60 * 60 * 24))
      return days > 0 && days <= 30
    }
    if (gymFilter === 'expired') return o.planEndDate && new Date(o.planEndDate) < new Date()
    return true
  })

  const chartData = adminRevenue.reduce((acc, r) => {
    const existing = acc.find(a => a.month === r.month?.split(' ')[0]?.substring(0, 3))
    if (existing) existing.amount += r.amount
    else acc.push({ month: r.month?.split(' ')[0]?.substring(0, 3) || 'N/A', amount: r.amount })
    return acc
  }, []).slice(-6)

  return (
    <div className="pb-32 md:pb-8 max-w-4xl mx-auto">
      {confirmAction && <ConfirmModal message={confirmAction.message} onConfirm={confirmAction.action} onCancel={() => setConfirmAction(null)} />}

      {/* Hero */}
      <div className="mx-4 mt-4 mb-4 rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a5f 100%)' }}>
        <p className="text-xs text-blue-300 font-medium mb-1">Admin Dashboard</p>
        <p className="text-2xl font-bold mb-3">Smart Gym Management</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total', value: stats.totalOwners, color: 'text-blue-300' },
            { label: 'Active', value: stats.activeOwners, color: 'text-green-300' },
            { label: 'Pending', value: stats.pendingOwners, color: 'text-yellow-300' },
            { label: 'Expiring', value: stats.expiringThisMonth, color: 'text-red-300' },
          ].map((s, i) => (
            <div key={i} className="bg-white bg-opacity-10 rounded-2xl px-3 py-2 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-blue-200">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-4 mb-4 flex gap-2">
        {[
          { value: 'overview', label: 'Overview' },
          { value: 'gyms', label: `Gyms (${stats.totalOwners})` },
          { value: 'revenue', label: 'Revenue' },
        ].map(tab => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold transition ${
              activeTab === tab.value ? 'text-white' : 'bg-white border border-gray-200 text-gray-500'
            }`}
            style={activeTab === tab.value ? { background: 'linear-gradient(135deg, #1e40af, #7c3aed)' } : {}}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="px-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">This Month Revenue</p>
              <p className="text-2xl font-bold text-purple-600">₹{adminStats.thisMonthRevenue?.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">All Time Revenue</p>
              <p className="text-2xl font-bold text-blue-600">₹{adminStats.total?.toLocaleString()}</p>
            </div>
          </div>
          {stats.pendingOwners > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="text-sm font-semibold text-yellow-700 mb-2">
                ⚠️ {stats.pendingOwners} gym{stats.pendingOwners > 1 ? 's' : ''} waiting for approval
              </p>
              <button onClick={() => { setActiveTab('gyms'); setGymFilter('pending') }}
                className="text-xs bg-yellow-500 text-white px-3 py-1.5 rounded-xl font-medium">
                Review Now →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Gyms Tab */}
      {activeTab === 'gyms' && (
        <div className="px-4">
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
            {[
              { value: 'all', label: 'All' },
              { value: 'pending', label: `Pending (${stats.pendingOwners})` },
              { value: 'active', label: 'Active' },
              { value: 'expiring', label: `Expiring (${stats.expiringThisMonth})` },
              { value: 'expired', label: 'Expired' },
            ].map(f => (
              <button key={f.value} onClick={() => setGymFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  gymFilter === f.value ? 'text-white' : 'bg-white border border-gray-200 text-gray-500'
                }`}
                style={gymFilter === f.value ? { background: 'linear-gradient(135deg, #1e40af, #7c3aed)' } : {}}>
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse"></div>)}
            </div>
          ) : filteredOwners.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🏋️</p>
              <p className="text-sm">No gyms found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOwners.map(owner => {
                const daysLeft = owner.planEndDate
                  ? Math.ceil((new Date(owner.planEndDate) - new Date()) / (1000 * 60 * 60 * 24))
                  : null
                return (
                  <div key={owner._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <button onClick={() => navigate(`/admin/gym/${owner.firebaseUid}`)}
                          className="text-sm font-bold text-blue-600 hover:underline text-left">
                          {owner.propertyName || owner.name}
                        </button>
                        {owner.gymmitraId && (
                          <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">
                            {owner.gymmitraId}
                          </span>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">{owner.email} · {owner.mobile}</p>
                        <p className="text-xs text-gray-400">{owner.address?.city}{owner.address?.state ? `, ${owner.address.state}` : ''}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          !owner.isApproved ? 'bg-yellow-100 text-yellow-700' :
                          daysLeft !== null && daysLeft < 0 ? 'bg-red-100 text-red-600' :
                          daysLeft !== null && daysLeft <= 7 ? 'bg-orange-100 text-orange-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {!owner.isApproved ? 'Pending' :
                           daysLeft !== null && daysLeft < 0 ? 'Expired' :
                           daysLeft !== null ? `${daysLeft}d left` : 'No plan'}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">{owner.memberCount || 0}/{owner.memberLimit || 10} members</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!owner.isApproved && (
                        <button onClick={() => approveOwner(owner.firebaseUid)}
                          className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-xl font-medium">
                          ✓ Approve
                        </button>
                      )}
                      <button onClick={() => {
                        setExtendModal(owner)
                        setExtendForm({ planMonths: '3', planDays: '', plan: owner.plan || 'basic', memberLimit: String(owner.memberLimit || 100), paymentAmount: '' })
                      }}
                        className="text-white text-xs px-3 py-1.5 rounded-xl font-medium"
                        style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)' }}>
                        Extend Plan
                      </button>
                      {owner.isApproved && owner.email !== ADMIN_EMAIL && (
                        <button onClick={() => setConfirmAction({
                          message: `Revoke access for ${owner.propertyName || owner.name}?`,
                          action: () => revokeOwner(owner.firebaseUid)
                        })} className="border border-yellow-200 text-yellow-600 text-xs px-3 py-1.5 rounded-xl">
                          Revoke
                        </button>
                      )}
                      {owner.email !== ADMIN_EMAIL && (
                        <button onClick={() => setConfirmAction({
                          message: `Delete ${owner.propertyName || owner.name} permanently?`,
                          action: () => deleteOwner(owner.firebaseUid)
                        })} className="border border-red-200 text-red-400 text-xs px-3 py-1.5 rounded-xl ml-auto">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-gray-800">Your Income</p>
              <p className="text-xs text-gray-400">Payments from gym owners</p>
            </div>
            <button onClick={() => setAddRevenueModal(true)}
              className="text-white text-xs px-4 py-2 rounded-xl font-semibold"
              style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)' }}>
              + Log Payment
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">This Month</p>
              <p className="text-2xl font-bold text-green-600">₹{adminStats.thisMonthRevenue?.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">All Time</p>
              <p className="text-2xl font-bold text-blue-600">₹{adminStats.total?.toLocaleString()}</p>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-purple-400 rounded-full"></div>
                <h2 className="text-sm font-bold text-gray-800">Monthly Income</h2>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [`₹${v}`, 'Income']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} fill="url(#adminGradient)" />
                  <defs>
                    <linearGradient id="adminGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6d28d9" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-green-400 rounded-full"></div>
              <h2 className="text-sm font-bold text-gray-800">Payment Log</h2>
            </div>
            {adminRevenue.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-3xl mb-2">💰</p>
                <p className="text-sm">No payments logged yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {adminRevenue.map(r => (
                  <div key={r._id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{r.gymName}</p>
                      <p className="text-xs text-gray-400">
                        {r.gymmitraId} · {r.planMonths}mo · {r.paidOn ? new Date(r.paidOn).toLocaleDateString('en-IN') : ''}
                      </p>
                      {r.notes && <p className="text-xs text-gray-400">{r.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-green-600">₹{r.amount?.toLocaleString()}</p>
                      <button onClick={() => deleteRevenue(r._id)}
                        className="w-7 h-7 border border-red-100 text-red-400 rounded-xl flex items-center justify-center text-xs hover:bg-red-50">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Extend Plan Modal */}
      {extendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Extend Plan</h2>
            <p className="text-sm text-gray-400 mb-4">{extendModal.propertyName || extendModal.name}</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Plan Type</label>
                <select value={extendForm.plan} onChange={e => setExtendForm({...extendForm, plan: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="free">Free (10 members)</option>
                  <option value="basic">Basic (100 members)</option>
                  <option value="pro">Pro (unlimited)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Duration by Months</label>
                <select value={extendForm.planMonths} onChange={e => setExtendForm({...extendForm, planMonths: e.target.value, planDays: ''})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="1">1 Month</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Or Exact Days <span className="text-blue-400 normal-case">(overrides months if filled)</span>
                </label>
                <input type="number" value={extendForm.planDays}
                  onChange={e => setExtendForm({...extendForm, planDays: e.target.value})}
                  placeholder="e.g. 15 for 15 days trial"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Member Limit</label>
                <input type="number" value={extendForm.memberLimit}
                  onChange={e => setExtendForm({...extendForm, memberLimit: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Payment Received (₹) — optional</label>
                <input type="number" value={extendForm.paymentAmount}
                  onChange={e => setExtendForm({...extendForm, paymentAmount: e.target.value})}
                  placeholder="Amount paid via UPI"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setExtendModal(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm font-medium">Cancel</button>
              <button onClick={() => extendPlan(extendModal.firebaseUid)}
                className="flex-1 text-white py-3 rounded-2xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)' }}>
                Extend Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Revenue Modal */}
      {addRevenueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h2 className="text-base font-bold text-gray-900 mb-4">Log Payment Received</h2>
            <form onSubmit={addRevenue} className="space-y-4">
              {[
                { label: 'GYMmitra ID', key: 'gymmitraId', placeholder: 'e.g. POWFKPT001' },
                { label: 'Gym Name', key: 'gymName', placeholder: 'Gym name' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{f.label}</label>
                  <input required value={revenueForm[f.key]} onChange={e => setRevenueForm({...revenueForm, [f.key]: e.target.value})}
                    placeholder={f.placeholder}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Amount (₹)</label>
                <input required type="number" value={revenueForm.amount} onChange={e => setRevenueForm({...revenueForm, amount: e.target.value})}
                  placeholder="e.g. 499"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Plan Duration (months)</label>
                <input required type="number" value={revenueForm.planMonths} onChange={e => setRevenueForm({...revenueForm, planMonths: e.target.value})}
                  placeholder="e.g. 3"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Notes (optional)</label>
                <input value={revenueForm.notes} onChange={e => setRevenueForm({...revenueForm, notes: e.target.value})}
                  placeholder="Any notes"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAddRevenueModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm font-medium">Cancel</button>
                <button type="submit"
                  className="flex-1 text-white py-3 rounded-2xl text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)' }}>
                  Log Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}