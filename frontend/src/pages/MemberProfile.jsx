import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL

function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = 'Delete', danger = true }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
        <p className="text-sm text-gray-700 mb-5 text-center">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{confirmLabel}</button>
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
    name: member.name,
    mobile: member.mobile,
    registrationNumber: member.registrationNumber,
    membershipType: member.membershipType || 'Monthly',
    membershipFee: member.membershipFee,
    joiningDate: member.joiningDate?.split('T')[0],
    expiryDate: member.expiryDate?.split('T')[0],
    notes: member.notes || ''
  })

  function calculateExpiry(joiningDate, membershipType) {
    if (!joiningDate) return ''
    const date = new Date(joiningDate)
    if (membershipType === 'Monthly') date.setMonth(date.getMonth() + 1)
    else if (membershipType === '3 Months') date.setMonth(date.getMonth() + 3)
    else if (membershipType === '6 Months') date.setMonth(date.getMonth() + 6)
    else if (membershipType === 'Yearly') date.setFullYear(date.getFullYear() + 1)
    return date.toISOString().split('T')[0]
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-3">
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Full Name</label>
        <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Mobile</label>
        <input required value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value.replace(/\D/g,'').substring(0,10)})} maxLength={10} inputMode="numeric" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Registration Number</label>
        <input required value={form.registrationNumber} onChange={e => setForm({...form, registrationNumber: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Membership Type</label>
        <select value={form.membershipType} onChange={e => {
          const expiry = calculateExpiry(form.joiningDate, e.target.value)
          setForm({...form, membershipType: e.target.value, expiryDate: expiry})
        }} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="Monthly">Monthly</option>
          <option value="3 Months">3 Months</option>
          <option value="6 Months">6 Months</option>
          <option value="Yearly">Yearly</option>
        </select>
      </div>
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Fee (₹)</label>
        <input required type="number" value={form.membershipFee} onChange={e => setForm({...form, membershipFee: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Joining Date</label>
        <input type="date" value={form.joiningDate} onChange={e => {
          const expiry = calculateExpiry(e.target.value, form.membershipType)
          setForm({...form, joiningDate: e.target.value, expiryDate: expiry})
        }} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Expiry Date</label>
        <input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Notes</label>
        <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancel</button>
        <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium">Save Changes</button>
      </div>
    </form>
  )
}
export default function MemberProfile() {
  const [showEdit, setShowEdit] = useState(false)
  const { id } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [dues, setDues] = useState([])
  const [showAddDue, setShowAddDue] = useState(false)
  const [showPayDue, setShowPayDue] = useState(null)
  const [dueForm, setDueForm] = useState({ amount: '', note: '' })
  const [payAmount, setPayAmount] = useState('')
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPayment, setEditingPayment] = useState(null)
  const [editForm, setEditForm] = useState({ amount: '', month: '', status: '', paidOn: '' })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmPayDelete, setConfirmPayDelete] = useState(null)
  const [showRenew, setShowRenew] = useState(false)
  const [renewForm, setRenewForm] = useState({ membershipType: 'Monthly', membershipFee: '', joiningDate: new Date().toISOString().split('T')[0], expiryDate: '' })

  async function fetchData() {
    try {
      const [memberRes, paymentsRes] = await Promise.all([
        axios.get(`${API}/members/${id}`),
        axios.get(`${API}/payments?ownerId=${currentUser.uid}`),
        axios.get(`${API}/dues/member/${id}`)
      ])
      setMember(memberRes.data)
      setPayments(paymentsRes.data.filter(p => p.tenantId === id))
      setDues(duesRes.data)
    } catch (err) {
      toast.error('Failed to load member')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (currentUser) fetchData()
  }, [currentUser, id])

  function getDaysLeft(expiryDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(expiryDate)
    expiry.setHours(0, 0, 0, 0)
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
  }

  function getMemberDuration(joiningDate) {
    const today = new Date()
    const joining = new Date(joiningDate)
    const months = Math.floor((today - joining) / (1000 * 60 * 60 * 24 * 30))
    const days = Math.floor((today - joining) / (1000 * 60 * 60 * 24))
    if (months >= 12) return `${Math.floor(months/12)} yr ${months%12} mo`
    if (months > 0) return `${months} month${months > 1 ? 's' : ''}`
    return `${days} day${days !== 1 ? 's' : ''}`
  }

  async function toggleStatus() {
    const newStatus = member.status === 'inactive' ? 'active' : 'inactive'
    try {
      await axios.put(`${API}/members/${id}`, { status: newStatus })
      toast.success(`Member marked as ${newStatus}`)
      fetchData()
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  async function deleteMember() {
    try {
      await axios.delete(`${API}/members/${id}`)
      toast.success('Member deleted!')
      navigate('/members')
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  function openEditPayment(payment) {
    setEditingPayment(payment._id)
    setEditForm({
      amount: payment.amount,
      month: payment.month,
      status: payment.status,
      paidOn: payment.paidOn ? new Date(payment.paidOn).toISOString().split('T')[0] : ''
    })
  }

  async function savePaymentEdit() {
    try {
      await axios.put(`${API}/payments/${editingPayment}`, editForm)
      toast.success('Payment updated!')
      setEditingPayment(null)
      fetchData()
    } catch (err) {
      toast.error('Failed to update payment')
    }
  }

  async function deletePayment(paymentId) {
    try {
      await axios.delete(`${API}/payments/${paymentId}`)
      toast.success('Payment deleted!')
      setConfirmPayDelete(null)
      fetchData()
    } catch (err) {
      toast.error('Failed to delete payment')
    }
  }

  function handleRenewTypeChange(type) {
    const expiry = calculateExpiry(renewForm.joiningDate, type)
    setRenewForm({ ...renewForm, membershipType: type, expiryDate: expiry })
  }

  function handleRenewDateChange(date) {
    const expiry = calculateExpiry(date, renewForm.membershipType)
    setRenewForm({ ...renewForm, joiningDate: date, expiryDate: expiry })
  }

  async function handleRenew(e) {
    e.preventDefault()
    try {
      const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
      await Promise.all([
        axios.put(`${API}/members/${id}`, {
          membershipType: renewForm.membershipType,
          membershipFee: renewForm.membershipFee,
          joiningDate: renewForm.joiningDate,
          expiryDate: renewForm.expiryDate,
          status: 'active'
        }),
        axios.post(`${API}/payments/mark-paid`, {
          memberId: id,
          ownerId: currentUser.uid,
          month: currentMonth,
          amount: renewForm.membershipFee,
          memberName: member.name,
          registrationNumber: member.registrationNumber
        })
      ])
      toast.success('Membership renewed!')
      setShowRenew(false)
      fetchData()
    } catch (err) {
      toast.error('Failed to renew')
    }
  }

  function sendWhatsApp() {
    if (!member) return
    const daysLeft = getDaysLeft(member.expiryDate)
    const expiryStr = new Date(member.expiryDate).toLocaleDateString('en-IN')
    const message = daysLeft < 0
      ? `Hi ${member.name},\n\nYour GYMmitra membership expired on ${expiryStr}.\n\nReg No: ${member.registrationNumber}\nMembership: ${member.membershipType}\nRenewal Fee: Rs.${member.membershipFee}\n\nPlease renew to continue your fitness journey!\n\nThank you!`
      : `Hi ${member.name},\n\nYour GYMmitra membership expires in ${daysLeft} days on ${expiryStr}.\n\nReg No: ${member.registrationNumber}\nMembership: ${member.membershipType}\nRenewal Fee: Rs.${member.membershipFee}\n\nPlease renew on time!\n\nThank you!`
    const phone = member.mobile.replace(/[^0-9]/g, '')
    const indiaPhone = phone.startsWith('91') ? phone : `91${phone}`
    window.open(`https://wa.me/${indiaPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-48 mb-4"></div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 h-48"></div>
      </div>
    )
  }

  if (!member) return (
    <div className="p-6 text-center text-gray-400">
      <p className="text-4xl mb-2">💪</p>
      <p>Member not found</p>
      <button onClick={() => navigate('/members')} className="mt-4 text-blue-600 text-sm">Back to Members</button>
    </div>
  )

  const daysLeft = getDaysLeft(member.expiryDate)
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)

  const statusBadge = {
    active: 'bg-green-100 text-green-700',
    due_soon: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700',
    inactive: 'bg-gray-100 text-gray-500'
  }

  const statusLabel = { active: 'Active', due_soon: 'Expiring Soon', expired: 'Expired', inactive: 'Inactive' }

  // due model lines
  async function addDue(e) {
  e.preventDefault()
  try {
    await axios.post(`${API}/dues`, {
      ownerId: currentUser.uid,
      memberId: id,
      memberName: member.name,
      mobile: member.mobile,
      amount: parseInt(dueForm.amount),
      note: dueForm.note
    })
    toast.success('Due added!')
    setShowAddDue(false)
    setDueForm({ amount: '', note: '' })
    fetchData()
  } catch (err) {
    toast.error('Failed to add due')
  }
}

async function payDue(dueId) {
  try {
    await axios.put(`${API}/dues/${dueId}/pay`, {
      payAmount: parseInt(payAmount)
    })
    toast.success('Payment recorded!')
    setShowPayDue(null)
    setPayAmount('')
    fetchData()
  } catch (err) {
    toast.error('Failed to record payment')
  }
}

async function deleteDue(dueId) {
  try {
    await axios.delete(`${API}/dues/${dueId}`)
    toast.success('Due deleted!')
    fetchData()
  } catch (err) {
    toast.error('Failed to delete due')
  }
}
  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-3xl mx-auto">
      {confirmDelete && (
        <ConfirmModal
          message={`Delete ${member.name}? All their data including payment history will be permanently deleted.`}
          onConfirm={deleteMember}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {confirmPayDelete && (
        <ConfirmModal
          message="Delete this payment record? This cannot be undone."
          onConfirm={() => deletePayment(confirmPayDelete)}
          onCancel={() => setConfirmPayDelete(null)}
        />
      )}

      <button onClick={() => navigate('/members')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        ← Back to Members
      </button>

      {/* Member Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-xl font-bold text-blue-600">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">{member.name}</h1>
              <p className="text-gray-500 text-sm">Reg: {member.registrationNumber}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${statusBadge[member.status]}`}>
                {statusLabel[member.status]}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => {setShowEdit(true)}}className="border border-blue-200 text-blue-600 px-3 py-2 rounded-xl text-xs font-medium hover:bg-blue-50 transition">Edit</button>
            <button onClick={sendWhatsApp} className="bg-green-500 text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-green-600 transition">
              WhatsApp
            </button>
            <button
              onClick={toggleStatus}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition border ${
                member.status === 'inactive'
                  ? 'border-green-200 text-green-600 hover:bg-green-50'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {member.status === 'inactive' ? 'Mark Active' : 'Mark Inactive'}
            </button>
            <button onClick={() => setShowRenew(true)} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-blue-700 transition">
              Renew
            </button>
            <button onClick={() => setConfirmDelete(true)} className="border border-red-200 text-red-500 px-3 py-2 rounded-xl text-xs font-medium hover:bg-red-50 transition">
              Delete
            </button>
          </div>
        </div>

        {/* Expiry countdown */}
        <div className={`rounded-xl p-4 mb-4 ${
          member.status === 'inactive' ? 'bg-gray-50 border border-gray-100' :
          daysLeft < 0 ? 'bg-red-50 border border-red-100' :
          daysLeft <= 7 ? 'bg-yellow-50 border border-yellow-100' :
          'bg-green-50 border border-green-100'
        }`}>
          <p className={`text-sm font-semibold ${
            member.status === 'inactive' ? 'text-gray-500' :
            daysLeft < 0 ? 'text-red-600' :
            daysLeft <= 7 ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {member.status === 'inactive' ? 'Member is inactive' :
             daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} days ago` :
             daysLeft === 0 ? 'Expires today!' :
             `${daysLeft} days left in membership`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Expires: {new Date(member.expiryDate).toLocaleDateString('en-IN')}
          </p>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Mobile', value: member.mobile },
            { label: 'Membership', value: member.membershipType },
            { label: 'Fee', value: `₹${member.membershipFee?.toLocaleString()}` },
            { label: 'Joined', value: new Date(member.joiningDate).toLocaleDateString('en-IN') },
            { label: 'Member For', value: getMemberDuration(member.joiningDate) },
            { label: 'Total Paid', value: `₹${totalPaid.toLocaleString()}` },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">{item.label}</p>
              <p className="text-sm font-medium text-gray-700">{item.value}</p>
            </div>
          ))}
        </div>

        {member.notes && (
          <div className="mt-3 bg-yellow-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{member.notes}</p>
          </div>
        )}
      </div>

      {/* Due Section */}
<div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-sm font-bold text-gray-700">Due Payments</h2>
      <p className="text-xs text-gray-400">
        Total pending: ₹{dues.filter(d => d.status !== 'paid').reduce((sum, d) => sum + (d.amount - d.paidAmount), 0).toLocaleString()}
      </p>
    </div>
    <button
      onClick={() => setShowAddDue(true)}
      className="bg-red-500 text-white text-xs px-3 py-2 rounded-xl hover:bg-red-600 transition font-medium"
    >
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
        <div key={due._id} className={`rounded-xl p-3 border ${
          due.status === 'paid' ? 'bg-green-50 border-green-100' :
          due.status === 'partial' ? 'bg-orange-50 border-orange-100' :
          'bg-red-50 border-red-100'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-gray-800">
                  ₹{due.amount.toLocaleString()}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  due.status === 'paid' ? 'bg-green-100 text-green-700' :
                  due.status === 'partial' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {due.status === 'paid' ? 'Paid' : due.status === 'partial' ? 'Partial' : 'Pending'}
                </span>
              </div>
              {due.note && <p className="text-xs text-gray-500 mb-1">{due.note}</p>}
              {due.status === 'partial' && (
                <p className="text-xs text-orange-600">
                  Paid: ₹{due.paidAmount} — Remaining: ₹{due.amount - due.paidAmount}
                </p>
              )}
              <p className="text-xs text-gray-400">
                Added: {new Date(due.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {due.status !== 'paid' && (
                <button
                  onClick={() => { setShowPayDue(due); setPayAmount(String(due.amount - due.paidAmount)) }}
                  className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-600"
                >
                  Pay
                </button>
              )}
              <button
                onClick={() => deleteDue(due._id)}
                className="border border-red-200 text-red-500 text-xs px-2 py-1.5 rounded-lg hover:bg-red-50"
              >
                Del
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

{/* Add Due Modal */}
{showAddDue && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
      <h2 className="text-base font-semibold text-gray-800 mb-4">Add Due — {member.name}</h2>
      <form onSubmit={addDue} className="space-y-3">
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Due Amount (₹)</label>
          <input
            required
            type="number"
            value={dueForm.amount}
            onChange={e => setDueForm({...dueForm, amount: e.target.value})}
            placeholder="Enter amount"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Note (optional)</label>
          <input
            value={dueForm.note}
            onChange={e => setDueForm({...dueForm, note: e.target.value})}
            placeholder="e.g. Monthly fee, Half payment"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={() => setShowAddDue(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancel</button>
          <button type="submit" className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600">Add Due</button>
        </div>
      </form>
    </div>
  </div>
)}

{/* Pay Due Modal */}
{showPayDue && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
      <h2 className="text-base font-semibold text-gray-800 mb-1">Record Payment</h2>
      <p className="text-xs text-gray-400 mb-4">
        Total due: ₹{showPayDue.amount} — Remaining: ₹{showPayDue.amount - showPayDue.paidAmount}
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Amount Received (₹)</label>
          <input
            type="number"
            value={payAmount}
            onChange={e => setPayAmount(e.target.value)}
            placeholder="Enter received amount"
            max={showPayDue.amount - showPayDue.paidAmount}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={() => setShowPayDue(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancel</button>
          <button onClick={() => payDue(showPayDue._id)} className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-600">Mark Paid</button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Payment History */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Payment History ({payments.length} records)</h2>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-sm">No payment records yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map(payment => (
              <div key={payment._id}>
                {editingPayment === payment._id ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-blue-700">Edit Payment</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Amount</label>
                        <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Month</label>
                        <input type="text" value={editForm.month} onChange={e => setEditForm({...editForm, month: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Status</label>
                        <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="paid">Paid</option>
                          <option value="unpaid">Unpaid</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Paid On</label>
                        <input type="date" value={editForm.paidOn} onChange={e => setEditForm({...editForm, paidOn: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingPayment(null)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
                      <button onClick={savePaymentEdit} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">Save</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{payment.month}</p>
                      <p className="text-xs text-gray-400">
                        {payment.paidOn ? `Paid: ${new Date(payment.paidOn).toLocaleDateString('en-IN')}` : 'Not paid'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-700">₹{payment.amount}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${payment.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {payment.status}
                      </span>
                      <button onClick={() => openEditPayment(payment)} className="text-blue-500 text-xs border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50">Edit</button>
                      <button onClick={() => setConfirmPayDelete(payment._id)} className="text-red-500 text-xs border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50">Del</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Renew Modal */}
      {showRenew && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Renew Membership — {member.name}</h2>
            <form onSubmit={handleRenew} className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Membership Type</label>
                <select value={renewForm.membershipType} onChange={e => handleRenewTypeChange(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Monthly">Monthly</option>
                  <option value="3 Months">3 Months</option>
                  <option value="6 Months">6 Months</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Renewal Fee (₹)</label>
                <input required type="number" value={renewForm.membershipFee} onChange={e => setRenewForm({...renewForm, membershipFee: e.target.value})} placeholder="e.g. 1000" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Renewal Start Date</label>
                <input required type="date" value={renewForm.joiningDate} onChange={e => handleRenewDateChange(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">New Expiry Date <span className="text-xs text-blue-500">(auto calculated)</span></label>
                <input type="date" value={renewForm.expiryDate} readOnly className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-blue-50 text-blue-700 font-medium" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowRenew(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">Renew Membership</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEdit && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Member</h2>
      <EditMemberForm
        member={member}
        onSave={async (form) => {
          await axios.put(`${API}/members/${id}`, form)
          toast.success('Member updated!')
          setShowEdit(false)
          fetchData()
        }}
        onCancel={() => setShowEdit(false)}
      />
    </div>
  </div>
)}
    </div>
  )
}