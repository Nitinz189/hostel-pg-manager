import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useLocation } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function MemberStatusPage() {
  const { currentUser } = useAuth()
  const location = useLocation()

  const [members, setMembers] = useState([])
  const [dueData, setDueData] = useState([])
  const [loading, setLoading] = useState(true)

  const pageType = location.pathname.replace('/', '')

  const config = {
    'due-members': {
      title: 'Due Members',
      border: 'border-red-200',
      bg: 'bg-red-50',
      text: 'text-red-600'
    },
    'expiring-members': {
      title: 'Expiring Members',
      border: 'border-orange-200',
      bg: 'bg-orange-50',
      text: 'text-orange-600'
    },
    'expired-members': {
      title: 'Expired Members',
      border: 'border-red-200',
      bg: 'bg-red-50',
      text: 'text-red-600'
    }
  }

  const current = config[pageType]

  useEffect(() => {
    fetchData()
  }, [currentUser])

  async function fetchData() {
    if (!currentUser) return

    setLoading(true)

    try {
      if (pageType === 'due-members') {
        const res = await axios.get(`${API}/dues/summary/${currentUser.uid}`)
        setDueData(res.data.dues || [])
      } else {
        const res = await axios.get(`${API}/dashboard?ownerId=${currentUser.uid}`)

        if (pageType === 'expiring-members') {
          setMembers(res.data.expiringThisWeek || [])
        }

        if (pageType === 'expired-members') {
          setMembers(res.data.expiredList || [])
        }
      }
    } catch (err) {
      console.log(err)
    }

    setLoading(false)
  }

  function sendWhatsApp(member, isDue = false) {
    let message = ''

    if (isDue) {
      message = `Hi ${member.memberName},

You have pending dues of Rs.${member.amount - member.paidAmount}.

Please clear them soon.

Thank you!`
    } else {
      message = `Hi ${member.name},

Your gym membership is expiring soon.

Please renew your membership.

Thank you!`
    }

    const phone = (isDue ? member.mobile : member.mobile).replace(/[^0-9]/g, '')
    const indiaPhone = phone.startsWith('91') ? phone : `91${phone}`

    window.open(
      `https://wa.me/${indiaPhone}?text=${encodeURIComponent(message)}`,
      '_blank'
    )
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">
          {current.title}
        </h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : pageType === 'due-members' ? (
        dueData.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            No pending dues
          </div>
        ) : (
          <div className="space-y-3">
            {dueData.map(due => (
              <div
                key={due._id}
                className={`border-2 ${current.border} rounded-2xl p-4 bg-white`}
              >
                <div className="flex items-center justify-between gap-3">
                  <Link to={`/member/${due.memberId}`} className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {due.memberName}
                    </p>

                    <p className="text-sm text-gray-400 mt-1">
                      Due ₹{due.amount - due.paidAmount}
                    </p>
                  </Link>

                  <button
                    onClick={() => sendWhatsApp(due, true)}
                    className="bg-green-500 text-white px-3 py-2 rounded-xl text-sm"
                  >
                    WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        members.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            No members found
          </div>
        ) : (
          <div className="space-y-3">
            {members.map(member => (
              <div
                key={member._id}
                className={`border-2 ${current.border} rounded-2xl p-4 bg-white`}
              >
                <div className="flex items-center justify-between gap-3">
                  <Link to={`/member/${member._id}`} className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {member.name}
                    </p>

                    <p className="text-sm text-gray-400 mt-1">
                      Expiry:
                      {' '}
                      {new Date(member.expiryDate).toLocaleDateString('en-IN')}
                    </p>
                  </Link>

                  <button
                    onClick={() => sendWhatsApp(member)}
                    className="bg-green-500 text-white px-3 py-2 rounded-xl text-sm"
                  >
                    WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}