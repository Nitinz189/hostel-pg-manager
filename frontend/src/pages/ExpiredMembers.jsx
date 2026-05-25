import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function ExpiredMembers() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/members?ownerId=${currentUser.uid}`)
      setMembers(res.data.filter(m => m.status === 'expired'))
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
  }, [currentUser])

  useEffect(() => { fetchData() }, [fetchData])

  function sendWhatsApp(member) {
    const message = `Hi ${member.name},\n\nYour gym membership expired on ${new Date(member.expiryDate).toLocaleDateString('en-IN')}.\n\nReg No: ${member.registrationNumber}\nMembership: ${member.membershipType}\nRenewal Fee: Rs.${member.membershipFee}\n\nPlease renew to continue!\n\nThank you!`
    const phone = member.mobile.replace(/[^0-9]/g, '')
    const indiaPhone = phone.startsWith('91') ? phone : `91${phone}`
    window.open(`https://wa.me/${indiaPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const daysExpired = (expiryDate) => {
    return Math.abs(Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24)))
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Expired Members</h1>
          <p className="text-xs text-gray-400">{members.length} members need renewal</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-gray-100"></div>)}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-sm">No expired memberships</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map(member => (
            <div key={member._id} className="bg-white border-2 border-red-100 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <Link to={`/member/${member._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-sm font-bold text-red-600 flex-shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{member.name}</p>
                    <p className="text-xs text-gray-400">#{member.registrationNumber} • {member.membershipType}</p>
                    <p className="text-xs text-red-400">Expired {daysExpired(member.expiryDate)} days ago • {new Date(member.expiryDate).toLocaleDateString('en-IN')}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <button onClick={() => sendWhatsApp(member)} className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-600">
                    WA
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}