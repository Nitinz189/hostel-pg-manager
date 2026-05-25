import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import MemberStatusCard from '../components/MemberStatusCard'

const API = import.meta.env.VITE_API_URL

export default function FilteredMembers() {
  const { currentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [members, setMembers] = useState([])
  const [dueData, setDueData] = useState([])
  const [loading, setLoading] = useState(true)

  const page = location.pathname.replace('/', '')

  const config = {
    'expiring-members': {
      title: 'Expiring Members',
      type: 'expiring'
    },
    'expired-members': {
      title: 'Expired Members',
      type: 'expired'
    },
    'due-members': {
      title: 'Due Payments',
      type: 'due'
    }
  }

  const current = config[page]

  useEffect(() => {
    fetchData()
  }, [currentUser])

  async function fetchData() {
    if (!currentUser) return

    setLoading(true)

    try {
      if (page === 'due-members') {
        const res = await axios.get(`${API}/dues/summary/${currentUser.uid}`)
        setDueData(res.data.dues || [])
      } else {
        const res = await axios.get(`${API}/dashboard?ownerId=${currentUser.uid}`)

        if (page === 'expiring-members') {
          setMembers(res.data.expiringThisWeek || [])
        }

        if (page === 'expired-members') {
          setMembers(res.data.expiredList || [])
        }
      }
    } catch (err) {
      console.log(err)
    }

    setLoading(false)
  }

  function sendWhatsApp(phone) {
    const cleaned = phone.replace(/[^0-9]/g, '')
    const indiaPhone = cleaned.startsWith('91') ? cleaned : `91${cleaned}`

    window.open(`https://wa.me/${indiaPhone}`, '_blank')
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">

      <button
        onClick={() => navigate('/dashboard')}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        ← Back to Dashboard
      </button>

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            {current.title}
          </h1>

          <p className="text-sm text-gray-400">
            {page === 'due-members'
              ? `${dueData.length} pending payments`
              : `${members.length} members`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">

          {page === 'due-members'
            ? dueData.map(due => (
                <MemberStatusCard
                  key={due._id}
                  due={due}
                  type="due"
                  onWhatsApp={() => sendWhatsApp(due.mobile)}
                  onPay={() => navigate(`/member/${due.memberId}`)}
                />
              ))
            : members.map(member => (
                <MemberStatusCard
                  key={member._id}
                  member={member}
                  type={current.type}
                  onWhatsApp={() => sendWhatsApp(member.mobile)}
                />
              ))}

        </div>
      )}
    </div>
  )
}