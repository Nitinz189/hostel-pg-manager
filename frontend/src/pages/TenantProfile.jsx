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
  const [tenant, setTenant] = useState(null)
  const [payments, setPayments] = useState([])
  const [owner, setOwner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingPayment, setEditingPayment] = useState(null)
  const [editForm, setEditForm] = useState({ amount: '', month: '', status: '', paidOn: '' })

  async function fetchData() {
    try {
      const [tenantRes, paymentsRes, ownerRes] = await Promise.all([
        axios.get(`${API}/tenants/${id}`),
        axios.get(`${API}/payments?ownerId=${currentUser.uid}`),
        axios.get(`${API}/owner/${currentUser.uid}`)
      ])
      setTenant(tenantRes.data)
      setPayments(paymentsRes.data.filter(p => p.tenantId === id))
      setOwner(ownerRes.data)
    } catch (err) {
      toast.error('Failed to load tenant profile')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (currentUser) fetchData()
  }, [currentUser, id])

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
    if (!tenant) return
    const ownerName = owner?.name || 'Owner'
    const propertyName = owner?.propertyName || 'PG'
    const qrLink = owner?.qrCodeUrl || ''
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

    const message = `🏠 *Rent Reminder*

Dear *${tenant.name}*,

Your rent for *${propertyName}* is due.

📋 *Details:*
- Room: ${tenant.roomNumber}
- Amount: ₹${tenant.rentAmount}
- Due Date: ${tenant.rentDueDate}th
- Month: ${currentMonth}

${qrLink ? `📱 Scan QR to Pay:\n${qrLink}` : ''}

Thank you!
*${ownerName}*`

    const phone = tenant.mobile.replace(/[^0-9]/g, '')
    const indiaPhone = phone.startsWith('91') ? phone : `91${phone}`
    window.open(`https://wa.me/${indiaPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0)

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-48"></div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="h-16 w-16 bg-gray-100 rounded-full mb-4"></div>
            <div className="h-5 bg-gray-100 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-24"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!tenant) return (
    <div className="p-6 text-center text-gray-400">
      <p className="text-4xl mb-2">👤</p>
      <p>Tenant not found</p>
      <button onClick={() => navigate('/tenants')} className="mt-4 text-blue-600 text-sm">
        Back to Tenants
      </button>
    </div>
  )

  const statusColor = {
    paid: 'bg-green-100 text-green-700',
    unpaid: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700'
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/tenants')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition"
      >
        ← Back to Tenants
      </button>

      {/* Tenant Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4 animate-fadeInUp">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
              {tenant.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">{tenant.name}</h1>
              <p className="text-gray-500 text-sm">Room {tenant.roomNumber}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize mt-1 inline-block ${statusColor[tenant.paymentStatus]}`}>
                {tenant.paymentStatus}
              </span>
            </div>
          </div>
          <button
            onClick={sendWhatsApp}
            className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition flex items-center gap-2"
          >
            📱 Send Reminder
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {[
            { label: 'Mobile', value: tenant.mobile, icon: '📱' },
            { label: 'Rent Amount', value: `₹${tenant.rentAmount?.toLocaleString()}`, icon: '💰' },
            { label: 'Security Deposit', value: `₹${tenant.securityDeposit || 0}`, icon: '🔐' },
            { label: 'Due Date', value: `${tenant.rentDueDate}th of month`, icon: '📅' },
            { label: 'Joining Date', value: new Date(tenant.joiningDate).toLocaleDateString('en-IN'), icon: '🗓️' },
            { label: 'Total Paid', value: `₹${totalPaid.toLocaleString()}`, icon: '✅' },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">{item.icon} {item.label}</p>
              <p className="text-sm font-medium text-gray-700">{item.value}</p>
            </div>
          ))}
        </div>

        {tenant.notes && (
          <div className="mt-4 bg-yellow-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">📝 Notes</p>
            <p className="text-sm text-gray-700">{tenant.notes}</p>
          </div>
        )}
      </div>

      {/* QR Code */}
      {owner?.qrCodeUrl && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4 animate-fadeInUp">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Payment QR Code</h2>
          <div className="flex items-center gap-4">
            <img
              src={owner.qrCodeUrl}
              alt="UPI QR"
              className="w-28 h-28 object-contain border border-gray-100 rounded-xl p-1"
            />
            <div>
              <p className="text-sm text-gray-600">Scan to pay rent to</p>
              <p className="text-sm font-semibold text-gray-800">{owner.name}</p>
              <p className="text-xs text-gray-400">{owner.propertyName}</p>
            </div>
          </div>
        </div>
      )}

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
                  /* Edit Mode */
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-blue-700">Edit Payment</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Amount (₹)</label>
                        <input
                          type="number"
                          value={editForm.amount}
                          onChange={e => setEditForm({...editForm, amount: e.target.value})}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Month</label>
                        <input
                          type="text"
                          value={editForm.month}
                          onChange={e => setEditForm({...editForm, month: e.target.value})}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Status</label>
                        <select
                          value={editForm.status}
                          onChange={e => setEditForm({...editForm, status: e.target.value})}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="paid">Paid</option>
                          <option value="unpaid">Unpaid</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Paid On</label>
                        <input
                          type="date"
                          value={editForm.paidOn}
                          onChange={e => setEditForm({...editForm, paidOn: e.target.value})}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingPayment(null)}
                        className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={savePaymentEdit}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{payment.month}</p>
                      <p className="text-xs text-gray-400">
                        {payment.paidOn ? `Paid on ${new Date(payment.paidOn).toLocaleDateString('en-IN')}` : 'Not paid'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-gray-700">₹{payment.amount}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        payment.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {payment.status}
                      </span>
                      <button
                        onClick={() => openEditPayment(payment)}
                        className="text-blue-500 text-xs border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deletePayment(payment._id)}
                        className="text-red-500 text-xs border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50"
                      >
                        Delete
                      </button>
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