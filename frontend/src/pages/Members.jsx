import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { usePlanStatus } from '../hooks/usePlanStatus'

const API = import.meta.env.VITE_API_URL

const empty = {
  name: '', mobile: '', registrationNumber: '',
  membershipType: 'Monthly', membershipFee: '',
  joiningDate: '', expiryDate: '', notes: ''
}

function calculateExpiry(joiningDate, membershipType) {
  if (!joiningDate) return ''
  const date = new Date(joiningDate)
  if (membershipType === 'Monthly') date.setMonth(date.getMonth() + 1)
  else if (membershipType === '3 Months') date.setMonth(date.getMonth() + 3)
  else if (membershipType === '6 Months') date.setMonth(date.getMonth() + 6)
  else if (membershipType === 'Yearly') date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().split('T')[0]
}

function validateMobile(mobile) {
  const cleaned = mobile.replace(/\D/g, '')
  if (cleaned.length !== 10) return 'Mobile number must be exactly 10 digits'
  if (!['6','7','8','9'].includes(cleaned[0])) return 'Mobile number must start with 6, 7, 8, or 9'
  return null
}

function exportToCSV(members) {
  const headers = ['Registration Number', 'Name', 'Mobile', 'Membership Type', 'Membership Fee', 'Joining Date', 'Expiry Date', 'Status', 'Notes']
  const rows = members.map(m => [
    m.registrationNumber || '', m.name || '', m.mobile || '',
    m.membershipType || '', m.membershipFee || '',
    m.joiningDate ? new Date(m.joiningDate).toLocaleDateString('en-IN') : '',
    m.expiryDate ? new Date(m.expiryDate).toLocaleDateString('en-IN') : '',
    m.status || '', (m.notes || '').replace(/,/g, ';')
  ])
  const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gymmitra-members-${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Members exported!')
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
        <p className="text-sm text-gray-700 mb-5 text-center">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  )
}

const avatarGradients = [
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #ef4444, #dc2626)',
  'linear-gradient(135deg, #06b6d4, #0891b2)',
]

function getGradient(name) {
  const index = name.charCodeAt(0) % avatarGradients.length
  return avatarGradients[index]
}

export default function Members() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { isExpired } = usePlanStatus()
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [mobileError, setMobileError] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [memberDues, setMemberDues] = useState({})

  async function fetchMembers() {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/members?ownerId=${currentUser.uid}`, { timeout: 60000 })
      setMembers(res.data)
    } catch (err) { console.log('Members fetch error:', err) }
    try {
      const duesRes = await axios.get(`${API}/dues?ownerId=${currentUser.uid}`)
      const duesMap = {}
      duesRes.data.forEach(due => {
        const memberId = String(due.memberId)
        if (!duesMap[memberId]) duesMap[memberId] = 0
        duesMap[memberId] += (due.amount - due.paidAmount)
      })
      setMemberDues(duesMap)
    } catch (err) { console.log('Dues fetch error:', err) }
    setLoading(false)
  }

  useEffect(() => { if (currentUser) fetchMembers() }, [currentUser])

  function handleJoiningChange(date) {
    setForm({ ...form, joiningDate: date, expiryDate: calculateExpiry(date, form.membershipType) })
  }

  function handleTypeChange(type) {
    setForm({ ...form, membershipType: type, expiryDate: calculateExpiry(form.joiningDate, type) })
  }

  function handleMobileChange(val) {
    const cleaned = val.replace(/\D/g, '').substring(0, 10)
    setForm({...form, mobile: cleaned})
    setMobileError(cleaned.length > 0 ? (validateMobile(cleaned) || '') : '')
  }

  function openAdd() {
    if (isExpired) return toast.error('Your plan has expired. Contact admin.')
    setEditing(null); setForm(empty); setMobileError(''); setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const mobileErr = validateMobile(form.mobile)
    if (mobileErr) { setMobileError(mobileErr); return }
    try {
      if (editing) {
        await axios.put(`${API}/members/${editing}`, form)
        toast.success('Member updated!')
      } else {
        await axios.post(`${API}/members`, { ...form, ownerId: currentUser.uid, status: 'active' })
        toast.success('Member added!')
      }
      setShowModal(false); fetchMembers()
    } catch (err) {
      toast.error(err.response?.status === 403 ? err.response.data.message : 'Something went wrong')
    }
  }

  async function handleDelete(id) {
    try {
      await axios.delete(`${API}/members/${id}`)
      toast.success('Member deleted!'); setConfirmDelete(null); fetchMembers()
    } catch (err) { toast.error('Failed to delete') }
  }

  const planCounts = {
    Monthly: members.filter(m => m.membershipType === 'Monthly').length,
    '3 Months': members.filter(m => m.membershipType === '3 Months').length,
    '6 Months': members.filter(m => m.membershipType === '6 Months').length,
    Yearly: members.filter(m => m.membershipType === 'Yearly').length,
  }

  const activeCount = members.filter(m => m.status === 'active' || m.status === 'due_soon').length
  const inactiveCount = members.filter(m => m.status === 'inactive').length

  const filtered = members.filter(m => {
    const matchSearch =
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      m.mobile?.includes(search)
    const matchStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? (m.status === 'active' || m.status === 'due_soon') :
      statusFilter === 'inactive' ? m.status === 'inactive' : true
    const matchPlan = planFilter === 'all' || m.membershipType === planFilter
    return matchSearch && matchStatus && matchPlan
  })

  function getStatusInfo(status) {
    const map = {
      active:   { label: 'Active',   dot: 'bg-green-400',  text: 'text-green-600'  },
      due_soon: { label: 'Expiring', dot: 'bg-yellow-400', text: 'text-yellow-600' },
      expired:  { label: 'Expired',  dot: 'bg-red-400',    text: 'text-red-500'    },
      inactive: { label: 'Inactive', dot: 'bg-gray-300',   text: 'text-gray-400'   },
    }
    return map[status] || map.inactive
  }

  function getDaysInfo(member) {
    if (!member.expiryDate) return null
    const days = Math.ceil((new Date(member.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
    if (member.status === 'expired') return { text: `Expired ${Math.abs(days)}d ago`, color: 'text-red-500' }
    if (days <= 7) return { text: `${days}d left`, color: 'text-yellow-600' }
    return { text: `${days} days left`, color: 'text-gray-400' }
  }

  return (
    <div className="pb-32 md:pb-8">
      {confirmDelete && (
        <ConfirmModal
          message={`Delete ${confirmDelete.name}? This cannot be undone.`}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Members</h1>
          <p className="text-xs text-gray-400">{members.length} total members</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(members)}
            className="border border-gray-200 text-gray-500 px-3 py-2 rounded-xl text-xs font-medium hover:bg-gray-50 transition">
            Export
          </button>
          <button onClick={openAdd} disabled={isExpired}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${isExpired ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'text-white'}`}
            style={!isExpired ? { background: 'linear-gradient(135deg, #1e40af, #7c3aed)' } : {}}>
            + Add
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search name, reg number, mobile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Status Filter */}
      <div className="px-4 mb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {[
          { value: 'all', label: `All (${members.length})` },
          { value: 'active', label: `Active (${activeCount})` },
          { value: 'inactive', label: `Inactive (${inactiveCount})` },
        ].map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
              statusFilter === f.value
                ? 'text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-500'
            }`}
            style={statusFilter === f.value ? { background: 'linear-gradient(135deg, #1e40af, #7c3aed)' } : {}}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Plan Filter */}
      {/* Plan Filter Dropdown */}
<div className="px-4 mb-4">
  <select
    value={planFilter}
    onChange={e => setPlanFilter(e.target.value)}
    className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
  >
    <option value="all">All Plans ({members.length})</option>
    {Object.entries(planCounts).map(([plan, count]) => (
      <option key={plan} value={plan}>{plan} ({count})</option>
    ))}
  </select>
</div>

      {/* Members List */}
      {loading ? (
        <div className="px-4 space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-20"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-3">💪</p>
          <p className="text-sm font-medium">No members found</p>
          <p className="text-xs mt-1">Add your first gym member to get started</p>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {filtered.map(member => {
            const statusInfo = getStatusInfo(member.status)
            const daysInfo = getDaysInfo(member)
            return (
              <div key={member._id}
                onClick={() => navigate(`/member/${member._id}`)}
                className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer active:scale-98 transition-transform shadow-sm border border-gray-100">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                  style={{ background: getGradient(member.name) }}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900 capitalize truncate">{member.name}</p>
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusInfo.dot}`}></div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-gray-400">#{member.registrationNumber}</p>
                    <span className="text-gray-200">•</span>
                    <p className="text-xs text-gray-400">{member.membershipType}</p>
                    {daysInfo && (
                      <>
                        <span className="text-gray-200">•</span>
                        <p className={`text-xs font-medium ${daysInfo.color}`}>{daysInfo.text}</p>
                      </>
                    )}
                  </div>
                  {memberDues[member._id] > 0 && (
                    <p className="text-xs text-red-500 font-medium mt-0.5">
                      ₹{memberDues[member._id].toLocaleString()} payment due
                    </p>
                  )}
                </div>
                {/* Arrow */}
                <span className="text-gray-300 text-sm flex-shrink-0">›</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 pt-4 pb-3 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3"></div>
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Edit Member' : 'Add New Member'}
              </h2>
            </div>
            <div className="px-6 py-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Full Name</label>
                  <input required value={form.name}
                    onChange={e => {
                      const val = e.target.value
                      setForm({...form, name: val.charAt(0).toUpperCase() + val.slice(1)})
                    }}
                    placeholder="Member full name"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Mobile Number</label>
                  <input required value={form.mobile} onChange={e => handleMobileChange(e.target.value)}
                    placeholder="10 digit mobile number" maxLength={10} inputMode="numeric"
                    className={`w-full bg-gray-50 border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${mobileError ? 'border-red-300' : 'border-gray-200'}`} />
                  {mobileError && <p className="text-xs text-red-500 mt-1 px-1">{mobileError}</p>}
                  {form.mobile.length === 10 && !mobileError && <p className="text-xs text-green-500 mt-1 px-1">✓ Valid number</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Registration Number</label>
                  <input required value={form.registrationNumber}
                    onChange={e => setForm({...form, registrationNumber: e.target.value})}
                    placeholder="e.g. GYM001"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Membership Type</label>
                  <select value={form.membershipType} onChange={e => handleTypeChange(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Monthly">Monthly (1 month)</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="Yearly">Yearly (12 months)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Membership Fee (₹)</label>
                  <input required type="number" value={form.membershipFee}
                    onChange={e => setForm({...form, membershipFee: e.target.value})}
                    placeholder="e.g. 1000"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Date of Joining</label>
                  <input required type="date" value={form.joiningDate} onChange={e => handleJoiningChange(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Expiry Date <span className="text-blue-400 normal-case">(auto calculated)</span>
                  </label>
                  <input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})}
                    className="w-full bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-sm text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Notes (optional)</label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                    placeholder="Any notes about this member" rows={2}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-3 pt-2 pb-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm font-medium">Cancel</button>
                  <button type="submit" disabled={!!mobileError}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold text-white ${mobileError ? 'bg-gray-300' : ''}`}
                    style={!mobileError ? { background: 'linear-gradient(135deg, #1e40af, #7c3aed)' } : {}}>
                    {editing ? 'Save Changes' : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}