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
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [rangeFilter, setRangeFilter] = useState('3')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [useCustom, setUseCustom] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/payments?ownerId=${currentUser.uid}`)
      setPayments(res.data)
    } catch (err) {
      toast.error('Failed to load revenue')
    }
    setLoading(false)
  }, [currentUser])

  useEffect(() => {
    if (currentUser) fetchData()
  }, [fetchData])

  async function deletePayment(id) {
    try {
      await axios.delete(`${API}/payments/${id}`)
      toast.success('Payment deleted!')
      setConfirmDelete(null)
      fetchData()
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  function getFilteredPayments() {
    const paid = payments.filter(p => p.status === 'paid')
    if (useCustom && customFrom && customTo) {
      const from = new Date(customFrom)
      const to = new Date(customTo)
      to.setHours(23, 59, 59)
      return paid.filter(p => {
        const d = new Date(p.paidOn || p.createdAt)
        return d >= from && d <= to
      })
    }
    const months = parseInt(rangeFilter)
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - months)
    return paid.filter(p => new Date(p.paidOn || p.createdAt) >= cutoff)
  }

  const filteredPayments = getFilteredPayments()
  const thisMonthRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)

  const chartData = filteredPayments.reduce((acc, p) => {
    const month = new Date(p.paidOn || p.createdAt).toLocaleString('default', { month: 'short' })
    const existing = acc.find(a => a.month === month)
    if (existing) existing.amount += p.amount
    else acc.push({ month, amount: p.amount })
    return acc
  }, [])

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

      {/* Filter Controls */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Quick Filter</label>
            <select
              value={rangeFilter}
              onChange={e => { setRangeFilter(e.target.value); setUseCustom(false) }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="3">Last 3 months</option>
              <option value="6">Last 6 months</option>
              <option value="12">Last 12 months</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={e => { setCustomFrom(e.target.value); setUseCustom(true) }}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">To</label>
              <input
                type="date"
                value={customTo}
                onChange={e => { setCustomTo(e.target.value); setUseCustom(true) }}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {useCustom && (
              <button
                onClick={() => { setUseCustom(false); setCustomFrom(''); setCustomTo('') }}
                className="mt-5 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-2 rounded-lg"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Selected Period</p>
          <p className="text-2xl font-bold text-green-600">₹{thisMonthRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{filteredPayments.length} payments</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total All Time</p>
          <p className="text-2xl font-bold text-blue-600">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Payments</p>
          <p className="text-2xl font-bold text-purple-600">{payments.filter(p => p.status === 'paid').length}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Revenue Chart</h2>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 flex-col gap-2">
            <span className="text-3xl">📊</span>
            <p className="text-sm">No data for selected period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={v => [`₹${v}`, 'Revenue']} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Payment History ({filteredPayments.length} records)
        </h2>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse h-12 bg-gray-50 rounded-xl"></div>)}</div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-sm">No payments in selected period</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPayments.map(payment => (
              <div key={payment._id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{payment.tenantName}</p>
                  <p className="text-xs text-gray-400">
                    {payment.roomNumber} • {payment.month}
                    {payment.paidOn ? ` • ${new Date(payment.paidOn).toLocaleDateString('en-IN')}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-green-600">₹{payment.amount}</p>
                  <button onClick={() => setConfirmDelete(payment._id)} className="text-red-400 text-xs border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50">Del</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}