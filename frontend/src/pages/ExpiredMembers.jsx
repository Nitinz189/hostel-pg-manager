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

export default function ExpiredMembers() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/members?ownerId=${currentUser.uid}`)
      setMembers(res.data.filter(m => m.status === 'expired'))
    } catch (err) { console.log(err) }
    setLoading(false)
  }, [currentUser])

  useEffect(() => { fetchData() }, [fetchData])

  function sendWhatsApp(member) {
    const message = `Hi ${member.name},\n\nYour gym membership expired on ${new Date(member.expiryDate).toLocaleDateString('en-IN')}.\n\nReg No: ${member.registrationNumber}\nMembership: ${member.membershipType}\nRenewal Fee: Rs.${member.membershipFee}\n\nPlease renew to continue!\n\nThank you!`
    const phone = member.mobile.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${phone.startsWith('91') ? phone : `91${phone}`}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const daysExpired = (expiryDate) =>
    Math.abs(Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="pb-32 md:pb-8 max-w-2xl mx-auto">

      {/* Hero */}
      <div className="mx-4 mt-4 mb-4 rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #ef4444 100%)' }}>
        <button onClick={() => navigate('/dashboard')}
          className="text-red-200 text-sm mb-3 flex items-center gap-1 hover:text-white transition">
          ← Back
        </button>
        <p className="text-xs text-red-200 font-medium mb-1">Need Renewal</p>
        <p className="text-3xl font-bold mb-1">{members.length} Members</p>
        <p className="text-red-200 text-sm">Memberships have expired</p>
      </div>

      {loading ? (
        <div className="px-4 space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse"></div>)}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-sm font-medium">No expired memberships</p>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {members.map(member => (
            <div key={member._id} className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between p-4">
                <Link to={`/member/${member._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: getGradient(member.name) }}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 capitalize">{member.name}</p>
                    <p className="text-xs text-gray-400">#{member.registrationNumber} · {member.membershipType}</p>
                    <p className="text-xs text-red-500 font-medium">
                      Expired {daysExpired(member.expiryDate)}d ago · {new Date(member.expiryDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </Link>
                <button onClick={() => sendWhatsApp(member)}
                  className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-base hover:bg-green-100 transition flex-shrink-0 ml-3"
                  title="Send WhatsApp">
                  💬
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}