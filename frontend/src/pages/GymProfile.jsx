import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  const index = name.charCodeAt(0) % avatarGradients.length
  return avatarGradients[index]
}

function getStatusInfo(status) {
  const map = {
    active:   { label: 'Active',   dot: 'bg-green-400',  text: 'text-green-600'  },
    due_soon: { label: 'Expiring', dot: 'bg-yellow-400', text: 'text-yellow-600' },
    expired:  { label: 'Expired',  dot: 'bg-red-400',    text: 'text-red-500'    },
    inactive: { label: 'Inactive', dot: 'bg-gray-300',   text: 'text-gray-400'   },
  }
  return map[status] || map.inactive
}

function getDaysInfo(member) {
  if (!member.expiryDate) return null
  const days = Math.ceil((new Date(member.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
  if (member.status === 'expired') return { text: `Expired ${Math.abs(days)}d ago`, color: 'text-red-500' }
  if (days <= 7) return { text: `${days}d left`, color: 'text-yellow-600' }
  return { text: `${days} days left`, color: 'text-gray-400' }
}

export default function GymProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [owner, setOwner] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [ownersRes, membersRes] = await Promise.all([
          axios.get(`${API}/admin/owners`),
          axios.get(`${API}/members?ownerId=${id}`)
        ])
        const found = ownersRes.data.owners.find(o => o.firebaseUid === id)
        setOwner(found)
        setMembers(membersRes.data)
      } catch (err) {
        console.log(err)
      }
      setLoading(false)
    }
    fetchData()
  }, [id])

  const daysLeft = owner?.planEndDate
    ? Math.ceil((new Date(owner.planEndDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  const activeCount = members.filter(m => m.status === 'active' || m.status === 'due_soon').length
  const inactiveCount = members.filter(m => m.status === 'inactive').length

  const filtered = members.filter(m => {
    const matchSearch =
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      m.mobile?.includes(search)
    const matchStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? (m.status === 'active' || m.status === 'due_soon') :
      statusFilter === 'inactive' ? m.status === 'inactive' : true
    return matchSearch && matchStatus
  })

  if (loading) {
    return (
      <div className="p-4 pb-32">
        <div className="h-40 bg-gray-100 rounded-3xl animate-pulse mb-4"></div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>)}
        </div>
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="bg-gray-100 rounded-2xl h-16 animate-pulse"></div>)}
        </div>
      </div>
    )
  }

  if (!owner) {
    return (
      <div className="p-6 text-center">
        <p className="text-4xl mb-3">🏋️</p>
        <p className="text-sm text-gray-500">Gym not found</p>
        <button onClick={() => navigate('/admin')} className="mt-4 text-blue-600 text-sm">← Back to Admin</button>
      </div>
    )
  }

  return (
    <div className="pb-32 md:pb-8">

      {/* Back Button */}
      <div className="px-4 pt-4 mb-2">
        <button onClick={() => navigate('/admin')}
          className="flex items-center gap-1.5 text-sm text-blue-600 font-medium">
          ← Back to Admin
        </button>
      </div>

      {/* Hero Card */}
      <div className="mx-4 mt-2 mb-4 rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 40%, #7c3aed 100%)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(20%, -20%)' }}></div>

        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-blue-200 mb-1 font-medium">Gym Profile</p>
            <h1 className="text-2xl font-bold">{owner.propertyName || owner.name}</h1>
            {owner.gymmitraId && (
              <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full font-mono mt-1 inline-block">
                {owner.gymmitraId}
              </span>
            )}
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold mt-1 ${
            !owner.isApproved ? 'bg-yellow-400 text-yellow-900' :
            daysLeft !== null && daysLeft < 0 ? 'bg-red-400 text-white' :
            daysLeft !== null && daysLeft <= 7 ? 'bg-orange-400 text-white' :
            'bg-green-400 text-white'
          }`}>
            {!owner.isApproved ? 'Pending' :
             daysLeft !== null && daysLeft < 0 ? 'Expired' :
             daysLeft !== null ? `${daysLeft}d left` : 'No plan'}
          </span>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-300"></div>
            <span className="text-xs text-blue-100">{owner.email}</span>
          </div>
          {owner.mobile && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-300"></div>
              <span className="text-xs text-blue-100">{owner.mobile}</span>
            </div>
          )}
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-3 gap-3 mx-4 mb-4">
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-blue-600">{members.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total</p>
          <p className="text-xs text-gray-400">Members</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-green-500">{activeCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Active</p>
          <p className="text-xs text-gray-400">Members</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-purple-500">{owner.memberLimit || 10}</p>
          <p className="text-xs text-gray-500 mt-0.5">Limit</p>
          <p className="text-xs text-gray-400">{owner.plan || 'free'} plan</p>
        </div>
      </div>

      {/* Gym Details Card */}
      <div className="mx-4 mb-4 bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-blue-400 rounded-full"></div>
          <h2 className="text-sm font-bold text-gray-800">Gym Details</h2>
        </div>
        <div className="space-y-2.5">
          {[
            { label: 'Owner Name', value: owner.name },
            { label: 'Email', value: owner.email },
            { label: 'Mobile', value: owner.mobile || '—' },
            { label: 'City', value: owner.address?.city || '—' },
            { label: 'State', value: owner.address?.state || '—' },
            { label: 'Plan', value: owner.plan ? owner.plan.charAt(0).toUpperCase() + owner.plan.slice(1) : 'Free' },
            { label: 'Plan Expires', value: owner.planEndDate ? new Date(owner.planEndDate).toLocaleDateString('en-IN') : '—' },
            { label: 'Member Limit', value: `${owner.memberCount || 0} / ${owner.memberLimit || 10}` },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-xs font-semibold text-gray-700">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Members Section */}
      <div className="mx-4 mb-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-purple-400 rounded-full"></div>
          <h2 className="text-sm font-bold text-gray-800">Members ({members.length})</h2>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search name, reg number, mobile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {[
            { value: 'all', label: `All (${members.length})` },
            { value: 'active', label: `Active (${activeCount})` },
            { value: 'inactive', label: `Inactive (${inactiveCount})` },
          ].map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                statusFilter === f.value
                  ? 'text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-500'
              }`}
              style={statusFilter === f.value ? { background: 'linear-gradient(135deg, #1e40af, #7c3aed)' } : {}}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="text-sm">No members found</p>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {filtered.map(member => {
            const statusInfo = getStatusInfo(member.status)
            const daysInfo = getDaysInfo(member)
            return (
              <div key={member._id}
                onClick={() => navigate(`/member/${member._id}`)}
                className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer active:scale-98 transition-transform shadow-sm border border-gray-100">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                  style={{ background: getGradient(member.name) }}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900 capitalize truncate">{member.name}</p>
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusInfo.dot}`}></div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-gray-400">#{member.registrationNumber}</p>
                    <span className="text-gray-200">•</span>
                    <p className="text-xs text-gray-400">{member.membershipType}</p>
                    {daysInfo && (
                      <>
                        <span className="text-gray-200">•</span>
                        <p className={`text-xs font-medium ${daysInfo.color}`}>{daysInfo.text}</p>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-gray-300 text-sm flex-shrink-0">›</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}