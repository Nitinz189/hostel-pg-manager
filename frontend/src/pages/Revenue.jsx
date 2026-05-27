import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const API = import.meta.env.VITE_API_URL

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <p className="text-sm text-gray-700 mb-5 text-center">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm font-medium">Cancel</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 text-white py-3 rounded-2xl text-sm font-bold">Delete</button>
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

  useEffect(() => { if (currentUser) fetchData() }, [fetchData])

  async function deletePayment(id) {
    try {
      await axios.delete(`${API}/payments/${id}`)
      toast.success('Deleted!'); setConfirmDelete(null); fetchData()
    } catch { toast.error('Failed to delete') }
  }

  function getFilteredPayments() {
    const paid = payments.filter(p => p.status === 'paid')
    if (useCustom && customFrom && customTo) {
      const from = new Date(customFrom)
      const to = new Date(customTo); to.setHours(23, 59, 59)
      return paid.filter(p => { const d = new Date(p.paidOn || p.createdAt); return d >= from && d <= to })
    }
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - parseInt(rangeFilter))
    return paid.filter(p => new Date(p.paidOn || p.createdAt) >= cutoff)
  }

  const filteredPayments = getFilteredPayments()
  const periodRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const totalCount = payments.filter(p => p.status === 'paid').length

  const chartData = filteredPayments.reduce((acc, p) => {
    const month = new Date(p.paidOn || p.createdAt).toLocaleString('default', { month: 'short' })
    const existing = acc.find(a => a.month === month)
    if (existing) existing.amount += p.amount
    else acc.push({ month, amount: p.amount })
    return acc
  }, [])

  return (
    <div className="pb-32 md:pb-8">
      {confirmDelete && (
        <ConfirmModal
          message="Delete this payment? This cannot be undone."
          onConfirm={() => deletePayment(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Hero */}
      <div className="mx-4 mt-4 mb-4 rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 40%, #7c3aed 100%)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff, transparent)', transform: 'translate(20%, -20%)' }}></div>
        <p className="text-xs text-blue-200 font-medium mb-1">Total Revenue</p>
        <p className="text-3xl font-bold mb-3">₹{totalRevenue.toLocaleString()}</p>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-xs text-blue-100">This period <span className="font-bold text-white">₹{periodRevenue.toLocaleString()}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
            <span className="text-xs text-blue-100">Payments <span className="font-bold text-white">{totalCount}</span></span>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mx-4 mb-4 bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Filter Period</p>
        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
          {[
            { value: '3', label: '3 Months' },
            { value: '6', label: '6 Months' },
            { value: '12', label: '12 Months' },
          ].map(f => (
            <button key={f.value}
              onClick={() => { setRangeFilter(f.value); setUseCustom(false) }}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
                rangeFilter === f.value && !useCustom
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
              style={rangeFilter === f.value && !useCustom ? { background: 'linear-gradient(135deg, #1e40af, #7c3aed)' } : {}}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">From</label>
            <input type="date" value={customFrom} placeholder="DD/MM/YYYY"
              onChange={e => { setCustomFrom(e.target.value); setUseCustom(true) }}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">To</label>
            <input type="date" value={customTo} placeholder="DD/MM/YYYY"
              onChange={e => { setCustomTo(e.target.value); setUseCustom(true) }}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {useCustom && (
            <button onClick={() => { setUseCustom(false); setCustomFrom(''); setCustomTo('') }}
              className="text-xs text-gray-400 border border-gray-200 px-3 py-2.5 rounded-2xl whitespace-nowrap hover:bg-gray-50">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="mx-4 mb-4 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-lg font-bold text-green-600">₹{periodRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">Period</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-lg font-bold text-blue-600">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">All Time</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-lg font-bold text-purple-600">{filteredPayments.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Payments</p>
        </div>
      </div>

      {/* Chart */}
      <div className="mx-4 mb-4 bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-blue-400 rounded-full"></div>
          <h2 className="text-sm font-bold text-gray-800">Revenue Chart</h2>
        </div>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 flex-col gap-2">
            <span className="text-3xl">📊</span>
            <p className="text-sm">No data for selected period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}
                fill="url(#barGradient)" />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Payment History */}
      <div className="mx-4 mb-4 bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-green-400 rounded-full"></div>
          <h2 className="text-sm font-bold text-gray-800">
            Payment History ({filteredPayments.length})
          </h2>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="animate-pulse h-14 bg-gray-50 rounded-2xl"></div>)}
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-sm">No payments in selected period</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredPayments.map(payment => (
              <div key={payment._id}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    ₹
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 capitalize">{payment.tenantName}</p>
                    <p className="text-xs text-gray-400">
                      {payment.roomNumber && `#${payment.roomNumber} · `}{payment.month}
                      {payment.paidOn ? ` · ${new Date(payment.paidOn).toLocaleDateString('en-IN')}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">₹{payment.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">paid</p>
                  </div>
                  <button onClick={() => setConfirmDelete(payment._id)}
                    className="w-8 h-8 border border-red-100 text-red-400 rounded-xl flex items-center justify-center text-sm hover:bg-red-50 transition">
                    ✕
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