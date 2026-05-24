import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const API = import.meta.env.VITE_API_URL
const ADMIN_EMAIL = 'vnitin398@gmail.com'

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <p className="text-sm text-gray-700 mb-5 text-center">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancel</button>
          <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium">Confirm</button>
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
  const [extendForm, setExtendForm] = useState({ planMonths: '3', plan: 'basic', memberLimit: '100', paymentAmount: '' })
  const [addRevenueModal, setAddRevenueModal] = useState(false)
  const [revenueForm, setRevenueForm] = useState({ gymmitraId: '', gymName: '', amount: '', planMonths: '', notes: '' })

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
    } catch (err) {
      toast.error('Failed to load admin data')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (currentUser && isAdmin) fetchAll()
  }, [currentUser])

  async function approveOwner(firebaseUid) {
    try {
      await axios.put(`${API}/admin/owners/${firebaseUid}/approve`)
      toast.success('Owner approved!')
      fetchAll()
    } catch (err) {
      toast.error('Failed to approve')
    }
  }

  async function extendPlan(firebaseUid) {
    try {
      await axios.put(`${API}/admin/owners/${firebaseUid}`, {
        plan: extendForm.plan,
        memberLimit: parseInt(extendForm.memberLimit),
        planMonths: parseInt(extendForm.planMonths),
        paymentAmount: extendForm.paymentAmount ? parseInt(extendForm.paymentAmount) : null,
        isApproved: true
      })
      toast.success('Plan extended!')
      setExtendModal(null)
      fetchAll()
    } catch (err) {
      toast.error('Failed to extend plan')
    }
  }

  async function revokeOwner(firebaseUid) {
    try {
      await axios.put(`${API}/admin/owners/${firebaseUid}`, { isApproved: false })
      toast.success('Access revoked!')
      setConfirmAction(null)
      fetchAll()
    } catch (err) {
      toast.error('Failed to revoke')
    }
  }

  async function deleteOwner(firebaseUid) {
    try {
      await axios.delete(`${API}/admin/owners/${firebaseUid}`)
      toast.success('Owner deleted!')
      setConfirmAction(null)
      fetchAll()
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  async function addRevenue(e) {
    e.preventDefault()
    try {
      const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
      await axios.post(`${API}/admin/revenue`, {
        ...revenueForm,
        amount: parseInt(revenueForm.amount),
        planMonths: parseInt(revenueForm.planMonths),
        month: currentMonth,
        paidOn: new Date()
      })
      toast.success('Revenue logged!')
      setAddRevenueModal(false)
      setRevenueForm({ gymmitraId: '', gymName: '', amount: '', planMonths: '', notes: '' })
      fetchAll()
    } catch (err) {
      toast.error('Failed to log revenue')
    }
  }

  async function deleteRevenue(id) {
    try {
      await axios.delete(`${API}/admin/revenue/${id}`)
      toast.success('Deleted!')
      fetchAll()
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  if (!isAdmin) return (
    <div className="p-6 text-center">
      <div className="text-5xl mb-4">🚫</div>
      <h1 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h1>
    </div>
  )

  const filteredOwners = owners.filter(o => {
    if (gymFilter === 'pending') return !o.isApproved
    if (gymFilter === 'active') {
      return o.isApproved && o.planEndDate && new Date(o.planEndDate) > new Date()
    }
    if (gymFilter === 'expiring') {
      if (!o.planEndDate) return false
      const days = Math.ceil((new Date(o.planEndDate) - new Date()) / (1000 * 60 * 60 * 24))
      return days > 0 && days <= 30
    }
    if (gymFilter === 'expired') {
      return o.planEndDate && new Date(o.planEndDate) < new Date()
    }
    return true
  })

  const chartData = adminRevenue.reduce((acc, r) => {
    const existing = acc.find(a => a.month === r.month?.split(' ')[0]?.substring(0, 3))
    if (existing) existing.amount += r.amount
    else acc.push({ month: r.month?.split(' ')[0]?.substring(0, 3) || 'N/A', amount: r.amount })
    return acc
  }, []).slice(-6)

  return (
    <div className="p-4 md:p-6">
      {confirmAction && (
        <ConfirmModal
          message={confirmAction.message}
          onConfirm={confirmAction.action}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Admin Panel</h1>
        <p className="text-gray-500 text-sm">GYMmitra business dashboard</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-100">
        {[
          { value: 'overview', label: 'Overview' },
          { value: 'gyms', label: `Gyms (${stats.totalOwners})` },
          { value: 'revenue', label: 'Your Revenue' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === tab.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Gyms', value: stats.totalOwners, color: 'blue' },
              { label: 'Active Gyms', value: stats.activeOwners, color: 'green' },
              { label: 'Pending Approval', value: stats.pendingOwners, color: 'yellow' },
              { label: 'Expiring This Month', value: stats.expiringThisMonth, color: 'red' },
            ].map((card, i) => (
              <div key={i} className={`bg-${card.color}-50 border border-${card.color}-100 rounded-2xl p-4`}>
                <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                <p className={`text-2xl font-bold text-${card.color}-600`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-1">Your Revenue This Month</p>
              <p className="text-2xl font-bold text-purple-600">₹{adminStats.thisMonthRevenue?.toLocaleString()}</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-1">Total GYMmitra Revenue</p>
              <p className="text-2xl font-bold text-indigo-600">₹{adminStats.total?.toLocaleString()}</p>
            </div>
          </div>

          {stats.pendingOwners > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="text-sm font-semibold text-yellow-700 mb-2">
                {stats.pendingOwners} gym{stats.pendingOwners > 1 ? 's' : ''} waiting for approval
              </p>
              <button
                onClick={() => { setActiveTab('gyms'); setGymFilter('pending') }}
                className="text-xs bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600"
              >
                Review Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Gyms Tab */}
      {activeTab === 'gyms' && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { value: 'all', label: 'All' },
              { value: 'pending', label: `Pending (${stats.pendingOwners})` },
              { value: 'active', label: 'Active' },
              { value: 'expiring', label: `Expiring (${stats.expiringThisMonth})` },
              { value: 'expired', label: 'Expired' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setGymFilter(f.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  gymFilter === f.value ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse h-24"></div>)}
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
                  <div key={owner._id} className={`bg-white border rounded-2xl p-4 ${!owner.isApproved ? 'border-yellow-200' : 'border-gray-100'}`}>
                    <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-800">{owner.propertyName || owner.name}</p>
                          {owner.gymmitraId && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">
                              {owner.gymmitraId}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{owner.email} • {owner.mobile}</p>
                        <p className="text-xs text-gray-400">{owner.address?.city}{owner.address?.state ? `, ${owner.address.state}` : ''}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          !owner.isApproved ? 'bg-yellow-100 text-yellow-700' :
                          daysLeft !== null && daysLeft < 0 ? 'bg-red-100 text-red-600' :
                          daysLeft !== null && daysLeft <= 7 ? 'bg-orange-100 text-orange-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {!owner.isApproved ? 'Pending' :
                           daysLeft !== null && daysLeft < 0 ? 'Expired' :
                           daysLeft !== null ? `${daysLeft}d left` : 'No plan'}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          {owner.memberCount || 0}/{owner.memberLimit || 10} members
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!owner.isApproved && (
                        <button
                          onClick={() => approveOwner(owner.firebaseUid)}
                          className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-600"
                        >
                          Approve
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setExtendModal(owner)
                          setExtendForm({ planMonths: '3', plan: owner.plan || 'basic', memberLimit: String(owner.memberLimit || 100), paymentAmount: '' })
                        }}
                        className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700"
                      >
                        Extend Plan
                      </button>

                      {owner.isApproved && owner.email !== ADMIN_EMAIL && (
                        <button
                          onClick={() => setConfirmAction({
                            message: `Revoke access for ${owner.propertyName || owner.name}?`,
                            action: () => revokeOwner(owner.firebaseUid)
                          })}
                          className="border border-yellow-200 text-yellow-600 text-xs px-3 py-1.5 rounded-lg hover:bg-yellow-50"
                        >
                          Revoke
                        </button>
                      )}

                      {owner.email !== ADMIN_EMAIL && (
                        <button
                          onClick={() => setConfirmAction({
                            message: `Delete ${owner.propertyName || owner.name} and ALL their data permanently?`,
                            action: () => deleteOwner(owner.firebaseUid)
                          })}
                          className="border border-red-200 text-red-500 text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 ml-auto"
                        >
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
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">Your GYMmitra Income</p>
              <p className="text-xs text-gray-400">Payments received from gym owners</p>
            </div>
            <button
              onClick={() => setAddRevenueModal(true)}
              className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-blue-700"
            >
              + Log Payment
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-1">This Month</p>
              <p className="text-2xl font-bold text-green-600">₹{adminStats.thisMonthRevenue?.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-1">All Time</p>
              <p className="text-2xl font-bold text-blue-600">₹{adminStats.total?.toLocaleString()}</p>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Income</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={v => [`₹${v}`, 'Income']} />
                  <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Payment Log</h2>
            {adminRevenue.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-3xl mb-2">💰</p>
                <p className="text-sm">No payments logged yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {adminRevenue.map(r => (
                  <div key={r._id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{r.gymName}</p>
                      <p className="text-xs text-gray-400">
                        {r.gymmitraId} • {r.planMonths} months • {r.paidOn ? new Date(r.paidOn).toLocaleDateString('en-IN') : ''}
                      </p>
                      {r.notes && <p className="text-xs text-gray-400">{r.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-green-600">₹{r.amount?.toLocaleString()}</p>
                      <button onClick={() => deleteRevenue(r._id)} className="text-red-400 text-xs hover:text-red-600">Del</button>
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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Extend Plan — {extendModal.propertyName || extendModal.name}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Plan Type</label>
                <select value={extendForm.plan} onChange={e => setExtendForm({...extendForm, plan: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="free">Free (10 members)</option>
                  <option value="basic">Basic (100 members)</option>
                  <option value="pro">Pro (unlimited)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Duration</label>
                <select value={extendForm.planMonths} onChange={e => setExtendForm({...extendForm, planMonths: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="1">1 Month</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Member Limit</label>
                <input type="number" value={extendForm.memberLimit} onChange={e => setExtendForm({...extendForm, memberLimit: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Payment Received (₹) — optional</label>
                <input type="number" value={extendForm.paymentAmount} onChange={e => setExtendForm({...extendForm, paymentAmount: e.target.value})} placeholder="Amount paid via UPI" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setExtendModal(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={() => extendPlan(extendModal.firebaseUid)} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium">Extend Plan</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Revenue Modal */}
      {addRevenueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Log Payment Received</h2>
            <form onSubmit={addRevenue} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">GYMmitra ID</label>
                <input required value={revenueForm.gymmitraId} onChange={e => setRevenueForm({...revenueForm, gymmitraId: e.target.value})} placeholder="e.g. POWFKPT001" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Gym Name</label>
                <input required value={revenueForm.gymName} onChange={e => setRevenueForm({...revenueForm, gymName: e.target.value})} placeholder="Gym name" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Amount (₹)</label>
                <input required type="number" value={revenueForm.amount} onChange={e => setRevenueForm({...revenueForm, amount: e.target.value})} placeholder="e.g. 499" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Plan Duration (months)</label>
                <input required type="number" value={revenueForm.planMonths} onChange={e => setRevenueForm({...revenueForm, planMonths: e.target.value})} placeholder="e.g. 3" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Notes (optional)</label>
                <input value={revenueForm.notes} onChange={e => setRevenueForm({...revenueForm, notes: e.target.value})} placeholder="Any notes" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setAddRevenueModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium">Log Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}