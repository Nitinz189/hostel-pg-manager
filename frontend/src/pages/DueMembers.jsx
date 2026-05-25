import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

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
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
  }, [currentUser])

  useEffect(() => { fetchData() }, [fetchData])

  async function payDue(dueId) {
    try {
      await axios.put(`${API}/dues/${dueId}/pay`, { payAmount: parseInt(payAmount) })
      setPayingDue(null)
      setPayAmount('')
      fetchData()
    } catch (err) {
      console.log(err)
    }
  }

  function sendWhatsApp(due) {
    const message = `Hi ${due.memberName},\n\nYou have a pending due of Rs.${due.amount - due.paidAmount} at our gym.\n${due.note ? `Note: ${due.note}\n` : ''}\nPlease clear your dues at the earliest.\n\nThank you!`
    const phone = due.mobile.replace(/[^0-9]/g, '')
    const indiaPhone = phone.startsWith('91') ? phone : `91${phone}`
    window.open(`https://wa.me/${indiaPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Due Payments</h1>
          <p className="text-xs text-gray-400">Total pending: ₹{dueData.totalDue.toLocaleString()}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-gray-100"></div>)}
        </div>
      ) : dueData.dues.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-sm">No pending dues</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dueData.dues.map(due => (
            <div key={due._id} className="bg-white border-2 border-red-100 rounded-2xl p-4">
              {payingDue === due._id ? (
                <div>
                  <p className="text-xs text-gray-600 mb-2 font-medium">
                    Pay for {due.memberName} — Remaining: ₹{due.amount - due.paidAmount}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      placeholder="Amount received"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    <button onClick={() => payDue(due._id)} className="bg-green-500 text-white text-xs px-4 py-2 rounded-xl hover:bg-green-600 font-medium">Save</button>
                    <button onClick={() => setPayingDue(null)} className="border border-gray-200 text-gray-500 text-xs px-3 py-2 rounded-xl">✕</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <Link to={`/member/${due.memberId}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-sm font-bold text-red-600 flex-shrink-0">
                      {due.memberName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{due.memberName}</p>
                      {due.note && <p className="text-xs text-gray-400">{due.note}</p>}
                      {due.status === 'partial' && <p className="text-xs text-orange-500">Partial — ₹{due.paidAmount} paid</p>}
                      <p className="text-xs text-gray-400">{new Date(due.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <p className="text-sm font-bold text-red-600">₹{(due.amount - due.paidAmount).toLocaleString()}</p>
                    <button onClick={() => sendWhatsApp(due)} className="bg-green-500 text-white text-xs px-2 py-1.5 rounded-lg hover:bg-green-600">WA</button>
                    <button onClick={() => { setPayingDue(due._id); setPayAmount(String(due.amount - due.paidAmount)) }} className="bg-blue-600 text-white text-xs px-2 py-1.5 rounded-lg hover:bg-blue-700">Paid</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}