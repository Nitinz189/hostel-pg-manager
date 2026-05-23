import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL

export default function TenantProfile() {
  const { id } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPayment, setEditingPayment] = useState(null)
  const [editForm, setEditForm] = useState({ amount: '', month: '', status: '', paidOn: '' })

  async function fetchData() {
    try {
      const [memberRes, paymentsRes] = await Promise.all([
        axios.get(`${API}/tenants/${id}`),
        axios.get(`${API}/payments?ownerId=${currentUser.uid}`)
      ])
      setMember(memberRes.data)
      setPayments(paymentsRes.data.filter(p => p.tenantId === id))
    } catch (err) {
      toast.error('Failed to load member profile')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (currentUser) fetchData()
  }, [currentUser, id])

  function getDaysLeft(expiryDate) {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
    return days
  }

  function getMembershipDuration(joiningDate) {
    const today = new Date()
    const joining = new Date(joiningDate)
    const months = Math.floor((today - joining) / (1000 * 60 * 60 * 24 * 30))
    const days = Math.floor((today - joining) / (1000 * 60 * 60 * 24))
    if (months >= 12) return `${Math.floor(months/12)} year${Math.floor(months/12) > 1 ? 's' : ''} ${months%12} months`
    if (months > 0) return `${months} month${months > 1 ? 's' : ''}`
    return `${days} day${days > 1 ? 's' : ''}`
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
    if (!window.confirm('Delete this payment record?')) return
    try {
      await axios.delete(`${API}/payments/${paymentId}`)
      toast.success('Payment deleted!')
      fetchData()
    } catch (err) {
      toast.error('Failed to delete payment')
    }
  }

  function sendWhatsApp() {
    if (!member) return
    const daysLeft = getDaysLeft(member.expiryDate)
    const expiryStr = new Date(member.expiryDate).toLocaleDateString('en-IN')

    const message = daysLeft < 0
      ? `Hi ${member.name},

Your GYMmitra membership has expired on ${expiryStr}.

Registration No: ${member.registrationNumber}
Membership: ${member.membershipType}
Renewal Fee: Rs.${member.membershipFee}

Please renew your membership to continue your fitness journey!

Thank you!`
      : `Hi ${member.name},

Your GYMmitra membership is expiring in ${daysLeft} days on ${expiryStr}.

Registration No: ${member.registrationNumber}
Membership: ${member.membershipType}
Renewal Fee: Rs.${member.membershipFee}

Please renew on time to avoid any break in your fitness routine!

Thank you!`

    const phone = member.mobile.replace(/[^0-9]/g, '')
    const indiaPhone = phone.startsWith('91') ? phone : `91${phone}`
    window.open(`https://wa.me/${indiaPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0)

  const statusColor = {
    active: 'bg-green-100 text-green-700',
    due_soon: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700'
  }

  const statusLabel = {
    active: 'Active',
    due_soon: 'Expiring Soon',
    expired: 'Expired'
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-48"></div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="h-16 w-16 bg-gray-100 rounded-full mb-4"></div>
            <div className="h-5 bg-gray-100 rounded w-32 mb-2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!member) return (
    <div className="p-6 text-center text-gray-400">
      <p className="text-4xl mb-2">💪</p>
      <p>Member not found</p>
      <button onClick={() => navigate('/tenants')} className="mt-4 text-blue-600 text-sm">Back to Members</button>
    </div>
  )

  const daysLeft = getDaysLeft(member.expiryDate)

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate('/tenants')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        ← Back to Members
      </button>

      {/* Member Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4 animate-fadeInUp">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">{member.name}</h1>
              <p className="text-gray-500 text-sm">Reg: {member.registrationNumber}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${statusColor[member.status]}`}>
                {statusLabel[member.status]}
              </span>
            </div>
          </div>
          <button
            onClick={sendWhatsApp}
            className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition flex items-center gap-2"
          >
            Send Reminder
          </button>
        </div>

        {/* Membership countdown */}
        <div className={`mt-4 rounded-xl p-4 ${
          daysLeft < 0 ? 'bg-red-50 border border-red-100' :
          daysLeft <= 7 ? 'bg-yellow-50 border border-yellow-100' :
          'bg-green-50 border border-green-100'
        }`}>
          <p className={`text-sm font-semibold ${
            daysLeft < 0 ? 'text-red-600' :
            daysLeft <= 7 ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {daysLeft < 0
              ? `Membership expired ${Math.abs(daysLeft)} days ago`
              : daysLeft === 0
              ? 'Membership expires TODAY'
              : `${daysLeft} days left in membership`
            }
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Expiry: {new Date(member.expiryDate).toLocaleDateString('en-IN')}
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {[
            { label: 'Mobile', value: member.mobile, icon: 'Mobile' },
            { label: 'Membership', value: member.membershipType, icon: 'Type' },
            { label: 'Fee', value: `Rs.${member.membershipFee?.toLocaleString()}`, icon: 'Fee' },
            { label: 'Joined', value: new Date(member.joiningDate).toLocaleDateString('en-IN'), icon: 'Joined' },
            { label: 'Member For', value: getMembershipDuration(member.joiningDate), icon: 'Duration' },
            { label: 'Total Paid', value: `Rs.${totalPaid.toLocaleString()}`, icon: 'Paid' },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">{item.label}</p>
              <p className="text-sm font-medium text-gray-700">{item.value}</p>
            </div>
          ))}
        </div>

        {member.notes && (
          <div className="mt-4 bg-yellow-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{member.notes}</p>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 animate-fadeInUp">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Payment History ({payments.length} records)
        </h2>

        {payments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-sm">No payment records yet</p>
          </div>
        ) : (
          <div className="space-y-3">
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
                        {payment.paidOn ? `Paid on ${new Date(payment.paidOn).toLocaleDateString('en-IN')}` : 'Not paid'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-gray-700">Rs.{payment.amount}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        payment.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {payment.status}
                      </span>
                      <button onClick={() => openEditPayment(payment)} className="text-blue-500 text-xs border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50">Edit</button>
                      <button onClick={() => deletePayment(payment._id)} className="text-red-500 text-xs border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50">Del</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}