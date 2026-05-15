import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL

export default function Payments() {
  const { currentUser } = useAuth()
  const [tenants, setTenants] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const currentMonth = new Date().toLocaleString('default', {
    month: 'long', year: 'numeric'
  })

  async function fetchData() {
    try {
      const [tenantsRes, paymentsRes] = await Promise.all([
        axios.get(`${API}/tenants?ownerId=${currentUser.uid}`),
        axios.get(`${API}/payments?ownerId=${currentUser.uid}`)
      ])
      setTenants(tenantsRes.data)
      setPayments(paymentsRes.data)
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Payments</h1>
        <p className="text-gray-500 text-sm">Track rent payments for {currentMonth}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-2xl p-4">
          <p className="text-sm text-gray-500 mb-1">Collected</p>
          <p className="text-2xl font-semibold text-green-600">₹{totalCollected}</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4">
          <p className="text-sm text-gray-500 mb-1">Pending</p>
          <p className="text-2xl font-semibold text-red-500">₹{totalPending}</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4">
          <p className="text-sm text-gray-500 mb-1">Total Tenants</p>
          <p className="text-2xl font-semibold text-blue-600">{tenants.length}</p>
        </div>
      </div>

      {/* Payments Table */}
      {tenants.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-sm">No tenants yet. Add tenants first.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Tenant</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Room</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Rent</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Due Date</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant, i) => {
                const paid = isPaidThisMonth(tenant._id)
                return (
                  <tr key={tenant._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-medium text-gray-700">{tenant.name}</td>
                    <td className="px-4 py-3 text-gray-600">Room {tenant.roomNumber}</td>
                    <td className="px-4 py-3 text-gray-600">₹{tenant.rentAmount}</td>
                    <td className="px-4 py-3 text-gray-600">{tenant.rentDueDate}th</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        paid
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-500'
                      }`}>
                        {paid ? '✅ Paid' : '⏳ Unpaid'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {paid ? (
                        <button
                          onClick={() => markUnpaid(tenant)}
                          className="text-red-500 hover:text-red-700 text-xs border border-red-200 px-3 py-1 rounded-lg"
                        >
                          Mark Unpaid
                        </button>
                      ) : (
                        <button
                          onClick={() => markPaid(tenant)}
                          className="text-green-600 hover:text-green-700 text-xs border border-green-200 px-3 py-1 rounded-lg"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="mt-6 bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Payment History</h2>
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
                    {p.paidOn ? new Date(p.paidOn).toLocaleDateString() : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}