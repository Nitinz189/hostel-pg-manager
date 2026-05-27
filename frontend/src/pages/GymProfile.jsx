import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL

export default function GymProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [owner, setOwner] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState({ amount: '', notes: '', paidOn: '' })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [ownersRes, revenueRes] = await Promise.all([
          axios.get(`${API}/admin/owners`),
          axios.get(`${API}/admin/revenue`)
        ])
        const found = ownersRes.data.owners.find(o => o.firebaseUid === id)
        setOwner(found)
        const gymRevenue = revenueRes.data.revenue.filter(r =>
          r.gymmitraId === found?.gymmitraId || r.gymName === found?.propertyName
        )
        setRevenue(gymRevenue)
      } catch (err) {
        toast.error('Failed to load gym data')
      }
      setLoading(false)
    }
    fetchData()
  }, [id])

  async function editRevenue(revId) {
    try {
      await axios.put(`${API}/admin/revenue/${revId}`, {
        amount: parseInt(editForm.amount),
        notes: editForm.notes,
        paidOn: editForm.paidOn
      })
      toast.success('Updated!')
      setEditModal(null)
      const revenueRes = await axios.get(`${API}/admin/revenue`)
      const gymRevenue = revenueRes.data.revenue.filter(r =>
        r.gymmitraId === owner?.gymmitraId || r.gymName === owner?.propertyName
      )
      setRevenue(gymRevenue)
    } catch (err) {
      toast.error('Failed to update')
    }
  }

  async function deleteRevenue(revId) {
    try {
      await axios.delete(`${API}/admin/revenue/${revId}`)
      toast.success('Deleted!')
      setRevenue(revenue.filter(r => r._id !== revId))
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  const totalPaid = revenue.reduce((sum, r) => sum + (r.amount || 0), 0)

  const daysLeft = owner?.planEndDate
    ? Math.ceil((new Date(owner.planEndDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  if (loading) {
    return (
      <div className="p-4 pb-32">
        <div className="h-40 bg-gray-100 rounded-3xl animate-pulse mb-4"></div>
        <div className="h-48 bg-gray-100 rounded-3xl animate-pulse mb-4"></div>
        <div className="h-48 bg-gray-100 rounded-3xl animate-pulse"></div>
      </div>
    )
  }

  if (!owner) {
    return (
      <div className="p-6 text-center">
        <p className="text-4xl mb-3">🏋️</p>
        <p className="text-sm text-gray-500">Gym not found</p>
        <button onClick={() => navigate('/admin')} className="mt-4 text-blue-600 text-sm">← Back to Admin</button>
      </div>
    )
  }

  return (
    <div className="pb-32 md:pb-8">

      {/* Back Button */}
      <div className="px-4 pt-4 mb-2">
        <button onClick={() => navigate('/admin')}
          className="flex items-center gap-1.5 text-sm text-blue-600 font-medium">
          ← Back to Admin
        </button>
      </div>

      {/* Hero Card */}
      <div className="mx-4 mt-2 mb-4 rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 40%, #7c3aed 100%)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(20%, -20%)' }}></div>

        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-blue-200 mb-1 font-medium">Gym Profile</p>
            <h1 className="text-2xl font-bold">{owner.propertyName || owner.name}</h1>
            {owner.gymmitraId && (
              <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full font-mono mt-1 inline-block">
                {owner.gymmitraId}
              </span>
            )}
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold mt-1 ${
            !owner.isApproved ? 'bg-yellow-400 text-yellow-900' :
            daysLeft !== null && daysLeft < 0 ? 'bg-red-400 text-white' :
            daysLeft !== null && daysLeft <= 7 ? 'bg-orange-400 text-white' :
            'bg-green-400 text-white'
          }`}>
            {!owner.isApproved ? 'Pending' :
             daysLeft !== null && daysLeft < 0 ? 'Expired' :
             daysLeft !== null ? `${daysLeft}d left` : 'No plan'}
          </span>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-300"></div>
            <span className="text-xs text-blue-100">{owner.email}</span>
          </div>
          {owner.mobile && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-300"></div>
              <span className="text-xs text-blue-100">{owner.mobile}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mx-4 mb-4">
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total</p>
          <p className="text-xs text-gray-400">Paid to you</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-blue-600">{revenue.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Payments</p>
          <p className="text-xs text-gray-400">Total entries</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-purple-600">{owner.memberCount || 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Members</p>
          <p className="text-xs text-gray-400">of {owner.memberLimit || 10}</p>
        </div>
      </div>

      {/* Gym Details Card */}
      <div className="mx-4 mb-4 bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-blue-400 rounded-full"></div>
          <h2 className="text-sm font-bold text-gray-800">Gym Details</h2>
        </div>
        <div className="space-y-2.5">
          {[
            { label: 'Owner Name', value: owner.name },
            { label: 'Email', value: owner.email },
            { label: 'Mobile', value: owner.mobile || '—' },
            { label: 'City', value: owner.address?.city || '—' },
            { label: 'State', value: owner.address?.state || '—' },
            { label: 'Plan', value: owner.plan ? owner.plan.charAt(0).toUpperCase() + owner.plan.slice(1) : 'Free' },
            { label: 'Plan Expires', value: owner.planEndDate ? new Date(owner.planEndDate).toLocaleDateString('en-IN') : '—' },
            { label: 'Member Limit', value: `${owner.memberCount || 0} / ${owner.memberLimit || 10}` },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-xs font-semibold text-gray-700">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Section */}
      <div className="mx-4 mb-4 bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-green-400 rounded-full"></div>
          <h2 className="text-sm font-bold text-gray-800">Payment History</h2>
        </div>

        {revenue.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">💰</p>
            <p className="text-sm">No payments logged yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {revenue.map(r => (
              <div key={r._id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">₹{r.amount?.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">
                    {r.planMonths} months • {r.paidOn ? new Date(r.paidOn).toLocaleDateString('en-IN') : '—'}
                  </p>
                  {r.notes && <p className="text-xs text-gray-400">{r.notes}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setEditModal(r._id)
                      setEditForm({
                        amount: String(r.amount),
                        notes: r.notes || '',
                        paidOn: r.paidOn ? new Date(r.paidOn).toISOString().split('T')[0] : ''
                      })
                    }}
                    className="text-blue-400 text-xs hover:text-blue-600">Edit</button>
                  <button onClick={() => deleteRevenue(r._id)}
                    className="text-red-400 text-xs hover:text-red-600">Del</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Revenue Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Edit Payment</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Amount (₹)</label>
                <input type="number" value={editForm.amount}
                  onChange={e => setEditForm({...editForm, amount: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date</label>
                <input type="date" value={editForm.paidOn}
                  onChange={e => setEditForm({...editForm, paidOn: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Notes</label>
                <input value={editForm.notes}
                  onChange={e => setEditForm({...editForm, notes: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditModal(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={() => editRevenue(editModal)}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}