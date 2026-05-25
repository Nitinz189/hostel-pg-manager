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
    m.registrationNumber || '',
    m.name || '',
    m.mobile || '',
    m.membershipType || '',
    m.membershipFee || '',
    m.joiningDate ? new Date(m.joiningDate).toLocaleDateString('en-IN') : '',
    m.expiryDate ? new Date(m.expiryDate).toLocaleDateString('en-IN') : '',
    m.status || '',
    (m.notes || '').replace(/,/g, ';')
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
  } catch (err) {
    console.log('Members fetch error:', err)
  }

  // Fetch dues separately
  try {
    const duesRes = await axios.get(`${API}/dues?ownerId=${currentUser.uid}`)
    const duesMap = {}
    duesRes.data.forEach(due => {
      const memberId = String(due.memberId)
      if (!duesMap[memberId]) duesMap[memberId] = 0
      duesMap[memberId] += (due.amount - due.paidAmount)
    })
    setMemberDues(duesMap)
  } catch (err) {
    console.log('Dues fetch error:', err)
  }

  setLoading(false)
}

  useEffect(() => {
    if (currentUser) fetchMembers()
  }, [currentUser])

  function handleJoiningChange(date) {
    const expiry = calculateExpiry(date, form.membershipType)
    setForm({ ...form, joiningDate: date, expiryDate: expiry })
  }

  function handleTypeChange(type) {
    const expiry = calculateExpiry(form.joiningDate, type)
    setForm({ ...form, membershipType: type, expiryDate: expiry })
  }

  function handleMobileChange(val) {
    const cleaned = val.replace(/\D/g, '').substring(0, 10)
    setForm({...form, mobile: cleaned})
    if (cleaned.length > 0) {
      setMobileError(validateMobile(cleaned) || '')
    } else {
      setMobileError('')
    }
  }

  function openAdd() {
    if (isExpired) return toast.error('Your plan has expired. Contact admin.')
    setEditing(null)
    setForm(empty)
    setMobileError('')
    setShowModal(true)
  }

  function openEdit(member) {
    if (isExpired) return toast.error('Your plan has expired. Contact admin.')
    setEditing(member._id)
    setForm({
      name: member.name,
      mobile: member.mobile,
      registrationNumber: member.registrationNumber,
      membershipType: member.membershipType || 'Monthly',
      membershipFee: member.membershipFee,
      joiningDate: member.joiningDate?.split('T')[0],
      expiryDate: member.expiryDate?.split('T')[0],
      notes: member.notes || ''
    })
    setMobileError('')
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const mobileErr = validateMobile(form.mobile)
    if (mobileErr) {
      setMobileError(mobileErr)
      return
    }
    try {
      if (editing) {
        await axios.put(`${API}/members/${editing}`, form)
        toast.success('Member updated!')
      } else {
        await axios.post(`${API}/members`, { ...form, ownerId: currentUser.uid, status: 'active' })
        toast.success('Member added!')
      }
      setShowModal(false)
      fetchMembers()
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error(err.response.data.message)
      } else {
        toast.error('Something went wrong')
      }
    }
  }

  async function handleDelete(id) {
    try {
      await axios.delete(`${API}/members/${id}`)
      toast.success('Member deleted!')
      setConfirmDelete(null)
      fetchMembers()
    } catch (err) {
      toast.error('Failed to delete')
    }
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

  const statusColor = {
    active: 'border-green-200',
    due_soon: 'border-yellow-200',
    expired: 'border-red-200',
    inactive: 'border-gray-200'
  }

  const statusBadge = {
    active: 'bg-green-100 text-green-700',
    due_soon: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700',
    inactive: 'bg-gray-100 text-gray-500'
  }

  const statusLabel = {
    active: 'Active', due_soon: 'Expiring', expired: 'Expired', inactive: 'Inactive'
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      {confirmDelete && (
        <ConfirmModal
          message={`Delete ${confirmDelete.name}? This cannot be undone.`}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Members</h1>
          <p className="text-gray-500 text-sm">{members.length} total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportToCSV(members)}
            className="border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs font-medium hover:bg-gray-50 transition"
          >
            Export CSV
          </button>
          <button
            onClick={openAdd}
            disabled={isExpired}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${isExpired ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            + Add Member
          </button>
        </div>
      </div>

      {/* Plan distribution pills */}
      <div className="flex gap-2 flex-wrap mb-3">
        <button
          onClick={() => setPlanFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${planFilter === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All ({members.length})
        </button>
        {Object.entries(planCounts).map(([plan, count]) => (
          <button
            key={plan}
            onClick={() => setPlanFilter(planFilter === plan ? 'all' : plan)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${planFilter === plan ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
          >
            {plan} ({count})
          </button>
        ))}
      </div>

      {/* Status tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name, reg number, mobile..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          {[
            { value: 'all', label: `All (${members.length})` },
            { value: 'active', label: `Active (${activeCount})` },
            { value: 'inactive', label: `Inactive (${inactiveCount})` },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap ${statusFilter === f.value ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse h-28"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-3">💪</p>
          <p className="text-sm font-medium">No members found</p>
          <p className="text-xs mt-1">Add your first gym member to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(member => (
            <div
              key={member._id}
              className={`border-2 rounded-2xl p-4 cursor-pointer transition hover:shadow-md bg-white ${statusColor[member.status] || 'border-gray-200'}`}
              onClick={() => navigate(`/member/${member._id}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{member.name}</p>
                    <p className="text-xs text-gray-400">#{member.registrationNumber}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[member.status]}`}>
                  {statusLabel[member.status]}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2 items-center">
                <span>{member.membershipType}</span>
                <div className="flex items-center gap-2">
                  {memberDues[member._id] > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">
                    Due ₹{memberDues[member._id]}
                  </span>
                )}
                  <span>{member.expiryDate ? new Date(member.expiryDate).toLocaleDateString('en-IN') : 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editing ? 'Edit Member' : 'Add New Member'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Full Name</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Member full name" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Mobile Number</label>
                <input
                  required
                  value={form.mobile}
                  onChange={e => handleMobileChange(e.target.value)}
                  placeholder="10 digit Indian mobile number"
                  maxLength={10}
                  inputMode="numeric"
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${mobileError ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                />
                {mobileError && <p className="text-xs text-red-500 mt-1">{mobileError}</p>}
                {form.mobile.length > 0 && !mobileError && form.mobile.length === 10 && (
                  <p className="text-xs text-green-500 mt-1">Valid mobile number</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Registration Number</label>
                <input required value={form.registrationNumber} onChange={e => setForm({...form, registrationNumber: e.target.value})} placeholder="e.g. GYM001" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Membership Type</label>
                <select value={form.membershipType} onChange={e => handleTypeChange(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Monthly">Monthly (1 month)</option>
                  <option value="3 Months">3 Months</option>
                  <option value="6 Months">6 Months</option>
                  <option value="Yearly">Yearly (12 months)</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Membership Fee (₹)</label>
                <input required type="number" value={form.membershipFee} onChange={e => setForm({...form, membershipFee: e.target.value})} placeholder="e.g. 1000" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Date of Joining</label>
                <input required type="date" value={form.joiningDate} onChange={e => handleJoiningChange(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Expiry Date <span className="text-xs text-blue-500">(auto calculated)</span>
                </label>
                <input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Notes (optional)</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any notes" rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancel</button>
                <button
                  type="submit"
                  disabled={!!mobileError}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${mobileError ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {editing ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}