import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL

function ConfirmModal({ message, onConfirm, onCancel, danger = true }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <p className="text-sm text-gray-700 mb-5 text-center">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm font-medium">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-3 rounded-2xl text-sm font-bold text-white ${danger ? 'bg-red-500' : 'bg-blue-600'}`}>Confirm</button>
        </div>
      </div>
    </div>
  )
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

function EditMemberForm({ member, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: member.name, mobile: member.mobile,
    registrationNumber: member.registrationNumber,
    membershipType: member.membershipType || 'Monthly',
    membershipFee: member.membershipFee,
    joiningDate: member.joiningDate?.split('T')[0],
    expiryDate: member.expiryDate?.split('T')[0],
    notes: member.notes || ''
  })

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
      {[
        { label: 'Full Name', key: 'name', type: 'text' },
        { label: 'Mobile', key: 'mobile', type: 'tel', maxLength: 10 },
        { label: 'Registration Number', key: 'registrationNumber', type: 'text' },
        { label: 'Fee (₹)', key: 'membershipFee', type: 'number' },
      ].map(f => (
        <div key={f.key}>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{f.label}</label>
          <input required type={f.type} value={form[f.key]}
            onChange={e => setForm({...form, [f.key]: f.key === 'mobile' ? e.target.value.replace(/\D/g,'').substring(0,10) : e.target.value})}
            maxLength={f.maxLength}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      ))}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Membership Type</label>
        <select value={form.membershipType} onChange={e => {
          const expiry = calculateExpiry(form.joiningDate, e.target.value)
          setForm({...form, membershipType: e.target.value, expiryDate: expiry})
        }} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="Monthly">Monthly</option>
          <option value="3 Months">3 Months</option>
          <option value="6 Months">6 Months</option>
          <option value="Yearly">Yearly</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Joining Date</label>
        <input type="date" value={form.joiningDate} onChange={e => {
          const expiry = calculateExpiry(e.target.value, form.membershipType)
          setForm({...form, joiningDate: e.target.value, expiryDate: expiry})
        }} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Expiry Date <span className="text-blue-400 normal-case">(auto)</span></label>
        <input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})}
          className="w-full bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-sm text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Notes</label>
        <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2}
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm font-medium">Cancel</button>
        <button type="submit" className="flex-1 text-white py-3 rounded-2xl text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)' }}>Save Changes</button>
      </div>
    </form>
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
  return avatarGradients[name.charCodeAt(0) % avatarGradients.length]
}

export default function MemberProfile() {
  const { id } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [member, setMember] = useState(null)
  const [payments, setPayments] = useState([])
  const [dues, setDues] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPayment, setEditingPayment] = useState(null)
  const [editForm, setEditForm] = useState({ amount: '', month: '', status: '', paidOn: '' })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmPayDelete, setConfirmPayDelete] = useState(null)
  const today = new Date().toISOString().split('T')[0]
  const [showRenew, setShowRenew] = useState(false)
  const [renewForm, setRenewForm] = useState({
    membershipType: 'Monthly', membershipFee: '',
    joiningDate: today, expiryDate: calculateExpiry(today, 'Monthly')
  })
  const [showEdit, setShowEdit] = useState(false)
  const [showAddDue, setShowAddDue] = useState(false)
  const [showPayDue, setShowPayDue] = useState(null)
  const [dueForm, setDueForm] = useState({ amount: '', note: '' })
  const [payAmount, setPayAmount] = useState('')

  async function fetchData() {
    try {
      const [memberRes, paymentsRes] = await Promise.all([
        axios.get(`${API}/members/${id}`),
        axios.get(`${API}/payments?ownerId=${currentUser.uid}`)
      ])
      setMember(memberRes.data)
      setPayments(paymentsRes.data.filter(p => p.tenantId === id))
    } catch (err) { toast.error('Failed to load member') }
    try {
      const duesRes = await axios.get(`${API}/dues/member/${id}`)
      setDues(duesRes.data)
    } catch (err) { setDues([]) }
    setLoading(false)
  }

  useEffect(() => { if (currentUser) fetchData() }, [currentUser, id])

  function getDaysLeft(expiryDate) {
    const t = new Date(); t.setHours(0,0,0,0)
    const e = new Date(expiryDate); e.setHours(0,0,0,0)
    return Math.ceil((e - t) / (1000 * 60 * 60 * 24))
  }

  function getMemberDuration(joiningDate) {
    const months = Math.floor((new Date() - new Date(joiningDate)) / (1000 * 60 * 60 * 24 * 30))
    const days = Math.floor((new Date() - new Date(joiningDate)) / (1000 * 60 * 60 * 24))
    if (months >= 12) return `${Math.floor(months/12)} yr ${months%12} mo`
    if (months > 0) return `${months} month${months > 1 ? 's' : ''}`
    return `${days} day${days !== 1 ? 's' : ''}`
  }

  async function toggleStatus() {
    const newStatus = member.status === 'inactive' ? 'active' : 'inactive'
    try {
      await axios.put(`${API}/members/${id}`, { status: newStatus })
      toast.success(`Marked as ${newStatus}`); fetchData()
    } catch { toast.error('Failed to update status') }
  }

  async function deleteMember() {
    try {
      await axios.delete(`${API}/members/${id}`)
      toast.success('Member deleted!'); navigate('/members')
    } catch { toast.error('Failed to delete') }
  }

  async function savePaymentEdit() {
    try {
      await axios.put(`${API}/payments/${editingPayment}`, editForm)
      toast.success('Updated!'); setEditingPayment(null); fetchData()
    } catch { toast.error('Failed to update') }
  }

  async function deletePayment(paymentId) {
    try {
      await axios.delete(`${API}/payments/${paymentId}`)
      toast.success('Deleted!'); setConfirmPayDelete(null); fetchData()
    } catch { toast.error('Failed to delete') }
  }

  async function handleRenew(e) {
    e.preventDefault()
    try {
      const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
      await Promise.all([
        axios.put(`${API}/members/${id}`, { ...renewForm, status: 'active' }),
        axios.post(`${API}/payments/mark-paid`, {
          memberId: id, ownerId: currentUser.uid, month: currentMonth,
          amount: renewForm.membershipFee, memberName: member.name,
          registrationNumber: member.registrationNumber
        })
      ])
      toast.success('Renewed!'); setShowRenew(false); fetchData()
    } catch { toast.error('Failed to renew') }
  }

  async function addDue(e) {
    e.preventDefault()
    try {
      await axios.post(`${API}/dues`, {
        ownerId: currentUser.uid, memberId: id, memberName: member.name,
        mobile: member.mobile, amount: parseInt(dueForm.amount), note: dueForm.note
      })
      toast.success('Due added!'); setShowAddDue(false); setDueForm({ amount: '', note: '' }); fetchData()
    } catch { toast.error('Failed to add due') }
  }

  async function payDue(dueId) {
    try {
      await axios.put(`${API}/dues/${dueId}/pay`, { payAmount: parseInt(payAmount) })
      toast.success('Recorded!'); setShowPayDue(null); setPayAmount(''); fetchData()
    } catch { toast.error('Failed') }
  }

  async function deleteDue(dueId) {
    try {
      await axios.delete(`${API}/dues/${dueId}`)
      toast.success('Deleted!'); fetchData()
    } catch { toast.error('Failed') }
  }

  function sendWhatsApp() {
    if (!member) return
    const daysLeft = getDaysLeft(member.expiryDate)
    const expiryStr = new Date(member.expiryDate).toLocaleDateString('en-IN')
    const message = daysLeft < 0
      ? `Hi ${member.name},\n\nYour gym membership expired on ${expiryStr}.\n\nReg No: ${member.registrationNumber}\nMembership: ${member.membershipType}\nRenewal Fee: Rs.${member.membershipFee}\n\nPlease renew to continue!\n\nThank you!`
      : `Hi ${member.name},\n\nYour membership expires in ${daysLeft} days on ${expiryStr}.\n\nReg No: ${member.registrationNumber}\nMembership: ${member.membershipType}\nRenewal Fee: Rs.${member.membershipFee}\n\nPlease renew on time!\n\nThank you!`
    const phone = member.mobile.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${phone.startsWith('91') ? phone : `91${phone}`}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const totalPendingDue = dues.filter(d => d.status !== 'paid').reduce((sum, d) => sum + (d.amount - d.paidAmount), 0)

  if (loading) return (
    <div className="p-4 pb-32 animate-pulse">
      <div className="h-48 bg-gray-100 rounded-3xl mb-4"></div>
      <div className="h-32 bg-gray-100 rounded-3xl mb-4"></div>
      <div className="h-32 bg-gray-100 rounded-3xl"></div>
    </div>
  )

  if (!member) return (
    <div className="p-6 text-center text-gray-400 pb-24">
      <p className="text-4xl mb-2">💪</p>
      <p>Member not found</p>
      <button onClick={() => navigate('/members')} className="mt-4 text-blue-600 text-sm">← Back</button>
    </div>
  )

  const daysLeft = getDaysLeft(member.expiryDate)

  const statusConfig = {
    active:   { label: 'Active',        dot: 'bg-green-400',  text: 'text-green-600'  },
    due_soon: { label: 'Expiring Soon', dot: 'bg-yellow-400', text: 'text-yellow-600' },
    expired:  { label: 'Expired',       dot: 'bg-red-400',    text: 'text-red-500'    },
    inactive: { label: 'Inactive',      dot: 'bg-gray-300',   text: 'text-gray-400'   },
  }
  const sc = statusConfig[member.status] || statusConfig.inactive

  return (
    <div className="pb-32 md:pb-8 max-w-2xl mx-auto">

      {confirmDelete && <ConfirmModal message={`Delete ${member.name}? This cannot be undone.`} onConfirm={deleteMember} onCancel={() => setConfirmDelete(false)} />}
      {confirmPayDelete && <ConfirmModal message="Delete this payment?" onConfirm={() => deletePayment(confirmPayDelete)} onCancel={() => setConfirmPayDelete(null)} />}

      {/* Back */}
      <button onClick={() => navigate('/members')}
        className="flex items-center gap-1 text-sm text-gray-500 px-4 pt-4 mb-2">
        ← Back to Members
      </button>

      {/* Hero Card */}
      <div className="mx-4 mb-4 rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #7c3aed 100%)' }}>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white capitalize">{member.name}</h1>
              <p className="text-blue-200 text-sm">#{member.registrationNumber}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-2 h-2 rounded-full ${sc.dot}`}></div>
                <span className="text-xs text-blue-100 font-medium">{sc.label}</span>
              </div>
            </div>
          </div>

          {/* Expiry bar */}
          <div className="bg-white bg-opacity-10 rounded-2xl px-4 py-3 mb-4">
            <p className="text-white font-semibold text-sm">
              {member.status === 'inactive' ? 'Member is inactive' :
               daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} days ago` :
               daysLeft === 0 ? 'Expires today!' :
               `${daysLeft} days left`}
            </p>
            <p className="text-blue-200 text-xs mt-0.5">
              {member.membershipType} · Expires {new Date(member.expiryDate).toLocaleDateString('en-IN')}
            </p>
          </div>

          {/* Action buttons */}
          <button onClick={() => setShowRenew(true)}
            className="w-full bg-white text-blue-700 py-3 rounded-2xl text-sm font-bold mb-2 hover:bg-blue-50 transition">
            🔄 Renew Membership
          </button>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={sendWhatsApp}
              className="bg-white bg-opacity-10 border border-white border-opacity-20 text-white py-2.5 rounded-xl text-xs font-medium hover:bg-opacity-20 transition">
              💬 WhatsApp
            </button>
            <button onClick={() => setShowEdit(true)}
              className="bg-white bg-opacity-10 border border-white border-opacity-20 text-white py-2.5 rounded-xl text-xs font-medium hover:bg-opacity-20 transition">
              ✏️ Edit
            </button>
            <button onClick={toggleStatus}
              className="bg-white bg-opacity-10 border border-white border-opacity-20 text-white py-2.5 rounded-xl text-xs font-medium hover:bg-opacity-20 transition">
              {member.status === 'inactive' ? '✅ Activate' : '⏸ Inactive'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mx-4 mb-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Mobile', value: member.mobile },
          { label: 'Fee', value: `₹${member.membershipFee?.toLocaleString()}` },
          { label: 'Member For', value: getMemberDuration(member.joiningDate) },
          { label: 'Joined', value: new Date(member.joiningDate).toLocaleDateString('en-IN') },
          { label: 'Total Paid', value: `₹${totalPaid.toLocaleString()}` },
          { label: 'Pending Due', value: totalPendingDue > 0 ? `₹${totalPendingDue.toLocaleString()}` : '₹0' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">{item.label}</p>
            <p className={`text-sm font-semibold ${item.label === 'Pending Due' && totalPendingDue > 0 ? 'text-red-500' : 'text-gray-800'}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {member.notes && (
        <div className="mx-4 mb-4 bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Notes</p>
          <p className="text-sm text-gray-700">{member.notes}</p>
        </div>
      )}

      {/* Due Payments */}
      <div className="mx-4 mb-4 bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-red-400 rounded-full"></div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Due Payments</h2>
              <p className="text-xs text-gray-400">Pending: ₹{totalPendingDue.toLocaleString()}</p>
            </div>
          </div>
          <button onClick={() => setShowAddDue(true)}
            className="text-xs text-white px-3 py-2 rounded-xl font-semibold"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            + Add Due
          </button>
        </div>

        {dues.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <p className="text-2xl mb-1">✅</p>
            <p className="text-sm">No dues pending</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dues.map(due => (
              <div key={due._id} className={`rounded-2xl p-3 ${
                due.status === 'paid' ? 'bg-green-50' :
                due.status === 'partial' ? 'bg-orange-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-gray-800">₹{due.amount.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        due.status === 'paid' ? 'bg-green-100 text-green-700' :
                        due.status === 'partial' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>{due.status === 'paid' ? 'Paid' : due.status === 'partial' ? 'Partial' : 'Pending'}</span>
                    </div>
                    {due.note && <p className="text-xs text-gray-500">{due.note}</p>}
                    {due.status === 'partial' && <p className="text-xs text-orange-600">Remaining: ₹{due.amount - due.paidAmount}</p>}
                    <p className="text-xs text-gray-400">{new Date(due.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="flex gap-2 ml-3">
                    {due.status !== 'paid' && (
                      <>
                        <button onClick={() => {
                          const msg = `Hi ${due.memberName},\n\nYou have a pending due of Rs.${due.amount - due.paidAmount}.\n${due.note ? `Note: ${due.note}\n` : ''}\nPlease clear at earliest.\n\nThank you!`
                          const ph = due.mobile.replace(/[^0-9]/g,'')
                          window.open(`https://wa.me/${ph.startsWith('91')?ph:`91${ph}`}?text=${encodeURIComponent(msg)}`, '_blank')
                        }} className="w-8 h-8 bg-green-500 text-white rounded-xl flex items-center justify-center text-sm">💬</button>
                        <button onClick={() => { setShowPayDue(due); setPayAmount(String(due.amount - due.paidAmount)) }}
                          className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center text-sm font-bold">✓</button>
                      </>
                    )}
                    <button onClick={() => deleteDue(due._id)}
                      className="w-8 h-8 border border-red-200 text-red-400 rounded-xl flex items-center justify-center text-sm">✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="mx-4 mb-4 bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-blue-400 rounded-full"></div>
          <h2 className="text-sm font-bold text-gray-800">Payment History ({payments.length})</h2>
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-sm">No payment records yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {payments.map(payment => (
              <div key={payment._id}>
                {editingPayment === payment._id ? (
                  <div className="bg-blue-50 rounded-2xl p-4 space-y-3 mb-2">
                    <p className="text-sm font-semibold text-blue-700">Edit Payment</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Amount', key: 'amount', type: 'number' },
                        { label: 'Month', key: 'month', type: 'text' },
                        { label: 'Paid On', key: 'paidOn', type: 'date' },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                          <input type={f.type} value={editForm[f.key]}
                            onChange={e => setEditForm({...editForm, [f.key]: e.target.value})}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      ))}
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Status</label>
                        <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="paid">Paid</option>
                          <option value="unpaid">Unpaid</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingPayment(null)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm">Cancel</button>
                      <button onClick={savePaymentEdit} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-medium">Save</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{payment.month}</p>
                      <p className="text-xs text-gray-400">
                        {payment.paidOn ? new Date(payment.paidOn).toLocaleDateString('en-IN') : 'Not paid'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800">₹{payment.amount}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${payment.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {payment.status}
                      </span>
                      <button onClick={() => { setEditingPayment(payment._id); setEditForm({ amount: payment.amount, month: payment.month, status: payment.status, paidOn: payment.paidOn ? new Date(payment.paidOn).toISOString().split('T')[0] : '' }) }}
                        className="text-xs border border-gray-200 text-gray-500 px-2 py-1 rounded-lg">Edit</button>
                      <button onClick={() => setConfirmPayDelete(payment._id)}
                        className="text-xs border border-red-200 text-red-400 px-2 py-1 rounded-lg">Del</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Member */}
      <div className="mx-4 mb-4">
        <button onClick={() => setConfirmDelete(true)}
          className="w-full border border-red-100 text-red-400 py-3 rounded-2xl text-sm font-medium hover:bg-red-50 transition">
          🗑 Delete Member
        </button>
      </div>

      {/* Bottom Sheet Modals */}

      {/* Add Due */}
      {showAddDue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h2 className="text-base font-bold text-gray-900 mb-4">Add Due — {member.name}</h2>
            <form onSubmit={addDue} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Amount (₹)</label>
                <input required type="number" value={dueForm.amount} onChange={e => setDueForm({...dueForm, amount: e.target.value})}
                  placeholder="Enter amount"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Note (optional)</label>
                <input value={dueForm.note} onChange={e => setDueForm({...dueForm, note: e.target.value})}
                  placeholder="e.g. Monthly fee, half payment"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddDue(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm font-medium">Cancel</button>
                <button type="submit"
                  className="flex-1 bg-red-500 text-white py-3 rounded-2xl text-sm font-bold">Add Due</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Due */}
      {showPayDue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Record Payment</h2>
            <p className="text-xs text-gray-400 mb-4">Remaining: ₹{showPayDue.amount - showPayDue.paidAmount}</p>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Amount Received (₹)</label>
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                placeholder="Enter amount" max={showPayDue.amount - showPayDue.paidAmount}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-4" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPayDue(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm font-medium">Cancel</button>
              <button onClick={() => payDue(showPayDue._id)}
                className="flex-1 bg-green-500 text-white py-3 rounded-2xl text-sm font-bold">Mark Paid</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member */}
      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 pt-4 pb-3 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3"></div>
              <h2 className="text-lg font-bold text-gray-900">Edit Member</h2>
            </div>
            <div className="px-6 py-4">
              <EditMemberForm member={member}
                onSave={async (form) => {
                  await axios.put(`${API}/members/${id}`, form)
                  toast.success('Updated!'); setShowEdit(false); fetchData()
                }}
                onCancel={() => setShowEdit(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Renew */}
      {showRenew && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Renew — {member.name}</h2>
            <form onSubmit={handleRenew} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Membership Type</label>
                <select value={renewForm.membershipType}
                  onChange={e => setRenewForm(p => ({...p, membershipType: e.target.value, expiryDate: calculateExpiry(p.joiningDate, e.target.value)}))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Monthly">Monthly</option>
                  <option value="3 Months">3 Months</option>
                  <option value="6 Months">6 Months</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Renewal Fee (₹)</label>
                <input required type="number" value={renewForm.membershipFee}
                  onChange={e => setRenewForm({...renewForm, membershipFee: e.target.value})}
                  placeholder="e.g. 1000"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Start Date</label>
                <input required type="date" value={renewForm.joiningDate}
                  onChange={e => setRenewForm(p => ({...p, joiningDate: e.target.value, expiryDate: calculateExpiry(e.target.value, p.membershipType)}))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">New Expiry <span className="text-blue-400 normal-case">(auto)</span></label>
                <input type="date" value={renewForm.expiryDate} readOnly
                  className="w-full bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-sm text-blue-700 font-semibold" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRenew(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm font-medium">Cancel</button>
                <button type="submit"
                  className="flex-1 text-white py-3 rounded-2xl text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)' }}>Renew Membership</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}