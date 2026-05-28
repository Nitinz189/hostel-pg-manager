import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

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

export default function DueMembers() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [dueData, setDueData] = useState({ dues: [], totalDue: 0 })
  const [loading, setLoading] = useState(true)
  const [payingDue, setPayingDue] = useState(null)
  const [payAmount, setPayAmount] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/dues/summary/${currentUser.uid}`)
      setDueData(res.data)
    } catch (err) { console.log(err) }
    setLoading(false)
  }, [currentUser])

  useEffect(() => { fetchData() }, [fetchData])

  async function payDue(dueId) {
    try {
      await axios.put(`${API}/dues/${dueId}/pay`, { payAmount: parseInt(payAmount) })
      setPayingDue(null); setPayAmount(''); fetchData()
    } catch (err) { console.log(err) }
  }

  function sendWhatsApp(due) {
    const message = `Hi ${due.memberName},\n\nYou have a pending due of Rs.${due.amount - due.paidAmount} at our gym.\n${due.note ? `Note: ${due.note}\n` : ''}\nPlease clear your dues at the earliest.\n\nThank you!`
    const phone = due.mobile.replace(/[^0-9]/g, '')
    const indiaPhone = phone.startsWith('91') ? phone : `91${phone}`
    window.open(`https://wa.me/${indiaPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <div className="pb-32 md:pb-8 max-w-2xl mx-auto">

      {/* Hero */}
      <div className="mx-4 mt-4 mb-4 rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 40%, #7c3aed 100%)' }}>
        <button onClick={() => navigate('/dashboard')}
          className="text-blue-300 text-sm mb-3 flex items-center gap-1 hover:text-white transition">
          ← Back
        </button>
        <p className="text-xs text-blue-200 font-medium mb-1">Pending Collections</p>
        <p className="text-3xl font-bold mb-1">₹{dueData.totalDue.toLocaleString()}</p>
        <p className="text-blue-200 text-sm">{dueData.dues.length} members with dues</p>
      </div>

      {loading ? (
        <div className="px-4 space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse"></div>)}
        </div>
      ) : dueData.dues.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-sm font-medium">No pending dues</p>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {dueData.dues.map(due => (
            <div key={due._id} className="bg-white rounded-2xl shadow-sm border border-gray-100">
              {payingDue === due._id ? (
                <div className="p-4">
                  <p className="text-xs text-gray-600 mb-3 font-semibold">
                    {due.memberName} — Remaining: ₹{due.amount - due.paidAmount}
                  </p>
                  <div className="flex gap-2">
                    <input type="number" value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      placeholder="Amount received"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                    <button onClick={() => payDue(due._id)}
                      className="bg-green-500 text-white text-xs px-4 py-2 rounded-2xl font-semibold">Save</button>
                    <button onClick={() => setPayingDue(null)}
                      className="border border-gray-200 text-gray-500 text-xs px-3 py-2 rounded-2xl">✕</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4">
                  <Link to={`/member/${due.memberId}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: getGradient(due.memberName) }}>
                      {due.memberName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 capitalize">{due.memberName}</p>
                      {due.note && <p className="text-xs text-gray-400">{due.note}</p>}
                      {due.status === 'partial' && (
                        <p className="text-xs text-orange-500">Partial — ₹{due.paidAmount} paid</p>
                      )}
                      <p className="text-xs text-gray-400">{new Date(due.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <p className="text-sm font-bold text-red-500">₹{(due.amount - due.paidAmount).toLocaleString()}</p>
                    <button onClick={() => sendWhatsApp(due)}
                      className="w-8 h-8 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-sm hover:bg-green-100 transition"
                      title="WhatsApp">💬</button>
                    <button onClick={() => { setPayingDue(due._id); setPayAmount(String(due.amount - due.paidAmount)) }}
                      className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-sm font-bold hover:bg-blue-100 transition"
                      title="Mark Paid">✓</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pay Modal */}
      {payingDue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h2 className="text-base font-bold text-gray-900 mb-4">Record Payment</h2>
            <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
              placeholder="Amount received"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setPayingDue(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm font-medium">Cancel</button>
              <button onClick={() => payDue(payingDue)}
                className="flex-1 bg-green-500 text-white py-3 rounded-2xl text-sm font-bold">Save Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}