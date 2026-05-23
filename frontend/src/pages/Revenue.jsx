import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const API = import.meta.env.VITE_API_URL

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

export default function Revenue() {
  const { currentUser } = useAuth()
  const [payments, setPayments] = useState([])
  const [analytics, setAnalytics] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  const fetchData = useCallback(async () => {
    try {
      const [paymentsRes, analyticsRes] = await Promise.all([
        axios.get(`${API}/payments?ownerId=${currentUser.uid}`),
        axios.get(`${API}/payments/analytics?ownerId=${currentUser.uid}`)
      ])
      setPayments(paymentsRes.data)
      const chartData = Object.entries(analyticsRes.data)
        .map(([month, amount]) => ({
          month: month.split(' ')[0].substring(0, 3),
          amount
        }))
        .slice(-6)
      setAnalytics(chartData)
    } catch (err) {
      toast.error('Failed to load revenue data')
    }
    setLoading(false)
  }, [currentUser])

  useEffect(() => {
    if (currentUser) fetchData()
  }, [fetchData])

  async function deletePayment(paymentId) {
    try {
      await axios.delete(`${API}/payments/${paymentId}`)
      toast.success('Payment deleted!')
      setConfirmDelete(null)
      fetchData()
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  const thisMonthPayments = payments.filter(p => p.month === currentMonth && p.status === 'paid')
  const thisMonthRevenue = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="p-4 md:p-6">
      {confirmDelete && (
        <ConfirmModal
          message="Delete this payment record? This cannot be undone."
          onConfirm={() => deletePayment(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Revenue</h1>
        <p className="text-gray-500 text-sm">Track all membership payments</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">This Month</p>
          <p className="text-2xl font-bold text-green-600">₹{thisMonthRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{thisMonthPayments.length} payments</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-blue-600">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">All time</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Payments</p>
          <p className="text-2xl font-bold text-purple-600">{payments.filter(p => p.status === 'paid').length}</p>
          <p className="text-xs text-gray-400 mt-1">Recorded</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Last 6 Months Revenue</h2>
        {analytics.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 flex-col gap-2">
            <span className="text-3xl">📊</span>
            <p className="text-sm">No payment data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Payment History ({payments.length} records)
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse h-12 bg-gray-50 rounded-xl"></div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-sm">No payments recorded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map(payment => (
              <div key={payment._id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{payment.tenantName}</p>
                  <p className="text-xs text-gray-400">
                    Reg: {payment.roomNumber} • {payment.month}
                    {payment.paidOn ? ` • ${new Date(payment.paidOn).toLocaleDateString('en-IN')}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-green-600">₹{payment.amount}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${payment.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {payment.status}
                  </span>
                  <button
                    onClick={() => setConfirmDelete(payment._id)}
                    className="text-red-500 text-xs border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50"
                  >
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}