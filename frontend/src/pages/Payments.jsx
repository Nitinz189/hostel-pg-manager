import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL

export default function Payments() {
  const { currentUser } = useAuth()
  const [tenants, setTenants] = useState([])
  const [payments, setPayments] = useState([])
  const [owner, setOwner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReminder, setShowReminder] = useState(null)

  const currentMonth = new Date().toLocaleString('default', {
    month: 'long', year: 'numeric'
  })

  async function fetchData() {
    try {
      const [tenantsRes, paymentsRes, ownerRes] = await Promise.all([
        axios.get(`${API}/tenants?ownerId=${currentUser.uid}`),
        axios.get(`${API}/payments?ownerId=${currentUser.uid}`),
        axios.get(`${API}/owner/${currentUser.uid}`)
      ])
      setTenants(tenantsRes.data)
      setPayments(paymentsRes.data)
      setOwner(ownerRes.data)
    } catch (err) {
      toast.error('Failed to load payments')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (currentUser) fetchData()
  }, [currentUser])

  function isPaidThisMonth(tenantId) {
    return payments.some(p =>
      p.tenantId === tenantId &&
      p.month === currentMonth &&
      p.status === 'paid'
    )
  }

  async function markPaid(tenant) {
    try {
      await axios.post(`${API}/payments/mark-paid`, {
        tenantId: tenant._id,
        ownerId: currentUser.uid,
        month: currentMonth,
        amount: tenant.rentAmount,
        tenantName: tenant.name,
        roomNumber: tenant.roomNumber
      })
      toast.success(`${tenant.name} marked as paid!`)
      fetchData()
    } catch (err) {
      toast.error('Something went wrong')
    }
  }

  async function markUnpaid(tenant) {
    try {
      await axios.post(`${API}/payments/mark-unpaid`, {
        tenantId: tenant._id,
        month: currentMonth
      })
      toast.success(`${tenant.name} marked as unpaid`)
      fetchData()
    } catch (err) {
      toast.error('Something went wrong')
    }
  }

  function sendWhatsAppReminder(tenant) {
    const ownerName = owner?.name || 'Your Landlord'
    const propertyName = owner?.propertyName || 'PG/Hostel'
    const qrLink = owner?.qrCodeUrl || ''

    const message = `🏠 *Rent Reminder*

Dear *${tenant.name}*,

Your rent for *${propertyName}* is due.

📋 *Details:*
- Room Number: ${tenant.roomNumber}
- Rent Amount: ₹${tenant.rentAmount}
- Due Date: ${tenant.rentDueDate}th of every month
- Month: ${currentMonth}

💳 *Payment Request:*
Please pay your rent at the earliest to avoid any late fees.

${qrLink ? `📱 *Scan QR to Pay:*\n${qrLink}` : ''}

Thank you!
*${ownerName}*
${propertyName}`

    const encodedMessage = encodeURIComponent(message)
    const phone = tenant.mobile.replace(/[^0-9]/g, '')
    const indiaPhone = phone.startsWith('91') ? phone : `91${phone}`
    const whatsappURL = `https://wa.me/${indiaPhone}?text=${encodedMessage}`

    window.open(whatsappURL, '_blank')
    setShowReminder(null)
  }

  const totalCollected = tenants
    .filter(t => isPaidThisMonth(t._id))
    .reduce((sum, t) => sum + t.rentAmount, 0)

  const totalPending = tenants
    .filter(t => !isPaidThisMonth(t._id))
    .reduce((sum, t) => sum + t.rentAmount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading payments...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Payments</h1>
        <p className="text-gray-500 text-sm">Track membership payments for {currentMonth}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Collected</p>
          <p className="text-xl font-semibold text-green-600">₹{totalCollected.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Pending</p>
          <p className="text-xl font-semibold text-red-500">₹{totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Tenants</p>
          <p className="text-xl font-semibold text-blue-600">{tenants.length}</p>
        </div>
      </div>

      {/* Payments Table */}
      {tenants.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-sm">No tenants yet. Add tenants first.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Tenant</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Room</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Rent</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Due Date</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant, i) => {
                  const paid = isPaidThisMonth(tenant._id)
                  return (
                    <tr key={tenant._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                            {tenant.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-700">{tenant.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">Room {tenant.roomNumber}</td>
                      <td className="px-4 py-3 text-gray-600">₹{tenant.rentAmount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600">{tenant.rentDueDate}th</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          paid ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {paid ? '✅ Paid' : '⏳ Unpaid'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {paid ? (
                            <button
                              onClick={() => markUnpaid(tenant)}
                              className="text-red-500 text-xs border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 transition"
                            >
                              Mark Unpaid
                            </button>
                          ) : (
                            <button
                              onClick={() => markPaid(tenant)}
                              className="text-green-600 text-xs border border-green-200 px-2 py-1 rounded-lg hover:bg-green-50 transition"
                            >
                              Mark Paid
                            </button>
                          )}
                          {!paid && (
                            <button
                              onClick={() => setShowReminder(tenant)}
                              className="text-green-600 text-xs border border-green-200 px-2 py-1 rounded-lg hover:bg-green-50 transition flex items-center gap-1"
                            >
                              📱 WhatsApp
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3 mb-6">
            {tenants.map(tenant => {
              const paid = isPaidThisMonth(tenant._id)
              return (
                <div key={tenant._id} className="bg-white border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                        {tenant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{tenant.name}</p>
                        <p className="text-xs text-gray-400">Room {tenant.roomNumber} • ₹{tenant.rentAmount}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      paid ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {paid ? '✅ Paid' : '⏳ Unpaid'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {paid ? (
                      <button
                        onClick={() => markUnpaid(tenant)}
                        className="flex-1 text-red-500 text-xs border border-red-200 py-2 rounded-xl hover:bg-red-50 transition"
                      >
                        Mark Unpaid
                      </button>
                    ) : (
                      <button
                        onClick={() => markPaid(tenant)}
                        className="flex-1 text-green-600 text-xs border border-green-200 py-2 rounded-xl hover:bg-green-50 transition"
                      >
                        Mark Paid
                      </button>
                    )}
                    {!paid && (
                      <button
                        onClick={() => setShowReminder(tenant)}
                        className="flex-1 bg-green-500 text-white text-xs py-2 rounded-xl hover:bg-green-600 transition"
                      >
                        📱 Send WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Payment History</h2>
          <div className="space-y-2">
            {payments.filter(p => p.status === 'paid').slice(0, 10).map(p => (
              <div key={p._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{p.tenantName}</p>
                  <p className="text-xs text-gray-400">Room {p.roomNumber} • {p.month}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">₹{p.amount}</p>
                  <p className="text-xs text-gray-400">
                    {p.paidOn ? new Date(p.paidOn).toLocaleDateString('en-IN') : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Reminder Modal */}
      {showReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              Send WhatsApp Reminder
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              This will open WhatsApp with a pre-filled message for {showReminder.name}
            </p>

            {/* Preview */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm text-gray-700 space-y-1 max-h-60 overflow-y-auto">
              <p>🏠 <strong>Rent Reminder</strong></p>
              <p>Dear <strong>{showReminder.name}</strong>,</p>
              <p>Your rent for <strong>{owner?.propertyName || 'PG/Hostel'}</strong> is due.</p>
              <p>📋 <strong>Details:</strong></p>
              <p>• Room: {showReminder.roomNumber}</p>
              <p>• Amount: ₹{showReminder.rentAmount}</p>
              <p>• Due Date: {showReminder.rentDueDate}th</p>
              <p>• Month: {currentMonth}</p>
              {owner?.qrCodeUrl && (
                <div className="mt-2">
                  <p>📱 <strong>Scan QR to Pay:</strong></p>
                  <img src={owner.qrCodeUrl} alt="QR" className="w-24 h-24 mt-1 rounded-lg" />
                </div>
              )}
              <p className="mt-2">Thank you! — <strong>{owner?.name || 'Owner'}</strong></p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowReminder(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => sendWhatsAppReminder(showReminder)}
                className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition flex items-center justify-center gap-2"
              >
                📱 Open WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}