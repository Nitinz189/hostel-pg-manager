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
  const [planModal, setPlanModal] = useState(false)
  const [planForm, setPlanForm] = useState({ plan: 'basic', planEndDate: '', memberLimit: '100' })

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
    } catch { toast.error('Failed to load') }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [id])

  async function editRevenue(revId) {
    try {
      await axios.put(`${API}/admin/revenue/${revId}`, {
        amount: parseInt(editForm.amount), notes: editForm.notes, paidOn: editForm.paidOn
      })
      toast.success('Updated!'); setEditModal(null)
      const revenueRes = await axios.get(`${API}/admin/revenue`)
      setRevenue(revenueRes.data.revenue.filter(r =>
        r.gymmitraId === owner?.gymmitraId || r.gymName === owner?.propertyName
      ))
    } catch { toast.error('Failed') }
  }

  async function deleteRevenue(revId) {
    try {
      await axios.delete(`${API}/admin/revenue/${revId}`)
      toast.success('Deleted!'); setRevenue(revenue.filter(r => r._id !== revId))
    } catch { toast.error('Failed') }
  }

  async function savePlan() {
    try {
      await axios.put(`${API}/admin/owners/${id}`, {
        plan: planForm.plan,
        planEndDate: new Date(planForm.planEndDate),
        memberLimit: parseInt(planForm.memberLimit),
        isApproved: true
      })
      toast.success('Plan updated!')
      setPlanModal(false)
      fetchData()
    } catch { toast.error('Failed to update plan') }
  }

  const totalPaid = revenue.reduce((sum, r) => sum + (r.amount || 0), 0)
  const daysLeft = owner?.planEndDate
    ? Math.ceil((new Date(owner.planEndDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  if (loading) return (
    <div className="p-4 pb-32">
      <div className="h-48 bg-gray-100 rounded-3xl animate-pulse mb-4"></div>
      <div className="h-32 bg-gray-100 rounded-3xl animate-pulse mb-4"></div>
      <div className="h-48 bg-gray-100 rounded-3xl animate-pulse"></div>
    </div>
  )

  if (!owner) return (
    <div className="p-6 text-center">
      <p className="text-4xl mb-3">🏋️</p>
      <p className="text-sm text-gray-500">Gym not found</p>
      <button onClick={() => navigate('/admin')} className="mt-4 text-blue-600 text-sm">← Back</button>
    </div>
  )

  return (
    <div className="pb-32 md:pb-8 max-w-2xl mx-auto">

      <div className="px-4 pt-4 mb-2">
        <button onClick={() => navigate('/admin')}
          className="text-sm text-blue-600 font-medium flex items-center gap-1">
          ← Back to Admin
        </button>
      </div>

      {/* Hero */}
      <div className="mx-4 mt-2 mb-4 rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a5f 100%)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff, transparent)', transform: 'translate(20%, -20%)' }}></div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-blue-300 mb-1">Gym Profile</p>
            <h1 className="text-2xl font-bold">{owner.propertyName || owner.name}</h1>
            {owner.gymmitraId && (
              <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full font-mono mt-1 inline-block">
                {owner.gymmitraId}
              </span>
            )}
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold mt-1 flex-shrink-0 ${
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

        <div className="flex gap-3 flex-wrap mb-4">
          <p className="text-xs text-blue-200">{owner.email}</p>
          {owner.mobile && <p className="text-xs text-blue-200">{owner.mobile}</p>}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => window.open(`tel:${owner.mobile}`, '_self')}
            className="bg-white bg-opacity-10 border border-white border-opacity-20 text-white py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-opacity-20 transition">
            📞 Call
          </button>
          <button onClick={() => {
            const message = `Hi ${owner.propertyName || owner.name},\n\nYour Smart Gym Management plan expires in ${daysLeft} days.\n\nPlease renew to continue.\n\nThank you!`
            const phone = owner.mobile?.replace(/[^0-9]/g, '')
            window.open(`https://wa.me/${phone?.startsWith('91') ? phone : `91${phone}`}?text=${encodeURIComponent(message)}`, '_blank')
          }}
            className="bg-white bg-opacity-10 border border-white border-opacity-20 text-white py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-opacity-20 transition">
            💬 WhatsApp
          </button>
          <button onClick={() => {
            setPlanForm({
              plan: owner.plan || 'basic',
              planEndDate: owner.planEndDate ? new Date(owner.planEndDate).toISOString().split('T')[0] : '',
              memberLimit: String(owner.memberLimit || 100)
            })
            setPlanModal(true)
          }}
            className="bg-white bg-opacity-10 border border-white border-opacity-20 text-white py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-opacity-20 transition">
            ✏️ Edit Plan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mx-4 mb-4">
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total Paid</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-xl font-bold text-blue-600">{revenue.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Payments</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-xl font-bold text-purple-600">{owner.memberCount || 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">Members</p>
        </div>
      </div>

      {/* Gym Details */}
      <div className="mx-4 mb-4 bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-blue-400 rounded-full"></div>
          <h2 className="text-sm font-bold text-gray-800">Gym Details</h2>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Owner', value: owner.name },
            { label: 'Email', value: owner.email },
            { label: 'Mobile', value: owner.mobile || '—' },
            { label: 'City', value: owner.address?.city || '—' },
            { label: 'State', value: owner.address?.state || '—' },
            { label: 'Plan', value: owner.plan ? owner.plan.charAt(0).toUpperCase() + owner.plan.slice(1) : 'Free' },
            { label: 'Expires', value: owner.planEndDate ? new Date(owner.planEndDate).toLocaleDateString('en-IN') : '—' },
            { label: 'Members', value: `${owner.memberCount || 0} / ${owner.memberLimit || 10}` },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-xs font-semibold text-gray-700">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div className="mx-4 mb-4 bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-green-400 rounded-full"></div>
          <h2 className="text-sm font-bold text-gray-800">Payment History</h2>
        </div>
        {revenue.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">💰</p>
            <p className="text-sm">No payments logged</p>
          </div>
        ) : (
          <div className="space-y-1">
            {revenue.map(r => (
              <div key={r._id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-800">₹{r.amount?.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">
                    {r.planMonths}mo · {r.paidOn ? new Date(r.paidOn).toLocaleDateString('en-IN') : '—'}
                  </p>
                  {r.notes && <p className="text-xs text-gray-400">{r.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => {
                    setEditModal(r._id)
                    setEditForm({ amount: String(r.amount), notes: r.notes || '', paidOn: r.paidOn ? new Date(r.paidOn).toISOString().split('T')[0] : '' })
                  }} className="text-xs text-blue-500 border border-blue-100 px-2 py-1 rounded-lg hover:bg-blue-50">Edit</button>
                  <button onClick={() => deleteRevenue(r._id)}
                    className="w-7 h-7 border border-red-100 text-red-400 rounded-xl flex items-center justify-center text-xs hover:bg-red-50">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Plan Modal */}
      {planModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h2 className="text-base font-bold text-gray-900 mb-4">Edit Plan — {owner.propertyName || owner.name}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Plan Type</label>
                <select value={planForm.plan} onChange={e => setPlanForm({...planForm, plan: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="free">Free (10 members)</option>
                  <option value="basic">Basic (100 members)</option>
                  <option value="pro">Pro (unlimited)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Plan End Date</label>
                <input type="date" value={planForm.planEndDate}
                  onChange={e => setPlanForm({...planForm, planEndDate: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Member Limit</label>
                <input type="number" value={planForm.memberLimit}
                  onChange={e => setPlanForm({...planForm, memberLimit: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setPlanModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm font-medium">Cancel</button>
              <button onClick={savePlan}
                className="flex-1 text-white py-3 rounded-2xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)' }}>Save Plan</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Revenue Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h2 className="text-base font-bold text-gray-900 mb-4">Edit Payment</h2>
            <div className="space-y-4">
              {[
                { label: 'Amount (₹)', key: 'amount', type: 'number' },
                { label: 'Date', key: 'paidOn', type: 'date' },
                { label: 'Notes', key: 'notes', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{f.label}</label>
                  <input type={f.type} value={editForm[f.key]} onChange={e => setEditForm({...editForm, [f.key]: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditModal(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm font-medium">Cancel</button>
              <button onClick={() => editRevenue(editModal)}
                className="flex-1 text-white py-3 rounded-2xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}