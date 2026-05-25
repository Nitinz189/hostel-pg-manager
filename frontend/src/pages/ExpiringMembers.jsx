import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function ExpiringMembers() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/dashboard?ownerId=${currentUser.uid}`)
      const expiring = [
        ...res.data.expiringThisWeek,
        ...res.data.dueSoonList
      ]
      const unique = expiring.filter((m, i, self) => self.findIndex(x => x._id === m._id) === i)
      setMembers(unique)
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
  }, [currentUser])

  useEffect(() => { fetchData() }, [fetchData])

  function sendWhatsApp(member) {
    const daysLeft = Math.ceil((new Date(member.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
    const message = `Hi ${member.name},\n\nYour gym membership expires in ${daysLeft} days on ${new Date(member.expiryDate).toLocaleDateString('en-IN')}.\n\nReg No: ${member.registrationNumber}\nMembership: ${member.membershipType}\nRenewal Fee: Rs.${member.membershipFee}\n\nPlease renew on time!\n\nThank you!`
    const phone = member.mobile.replace(/[^0-9]/g, '')
    const indiaPhone = phone.startsWith('91') ? phone : `91${phone}`
    window.open(`https://wa.me/${indiaPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Expiring Members</h1>
          <p className="text-xs text-gray-400">{members.length} members expiring soon</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-gray-100"></div>)}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-sm">No memberships expiring soon</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map(member => {
            const daysLeft = Math.ceil((new Date(member.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
            return (
              <div key={member._id} className="bg-white border-2 border-orange-100 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <Link to={`/member/${member._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-sm font-bold text-orange-600 flex-shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{member.name}</p>
                      <p className="text-xs text-gray-400">#{member.registrationNumber} • {member.membershipType}</p>
                      <p className="text-xs text-gray-400">₹{member.membershipFee} • Exp: {new Date(member.expiryDate).toLocaleDateString('en-IN')}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${daysLeft <= 3 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                      {daysLeft === 0 ? 'Today!' : `${daysLeft}d`}
                    </span>
                    <button onClick={() => sendWhatsApp(member)} className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-600">
                      WA
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}