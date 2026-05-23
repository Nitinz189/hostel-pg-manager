import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function Dashboard() {
  const { currentUser } = useAuth()
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    expiredMembers: 0,
    dueSoonMembers: 0,
    expiringThisWeek: [],
    expiredList: [],
    dueSoonList: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchStats = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    setError(false)
    try {
      const res = await axios.get(`${API}/dashboard?ownerId=${currentUser.uid}`)
      setStats(res.data)
    } catch (err) {
      setError(true)
    }
    setLoading(false)
  }, [currentUser])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3"></div>
              <div className="h-7 bg-gray-100 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome to GYMmitra</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 flex items-center justify-between">
          <p className="text-sm text-red-600">Failed to load. Backend may be waking up (~50 sec).</p>
          <button onClick={fetchStats} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg ml-3">Retry</button>
        </div>
      )}

      {/* Top 3 cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 card-hover animate-fadeInUp" style={{animationDelay:'0s',opacity:0}}>
          <p className="text-xs text-gray-500 mb-1">Total Members</p>
          <p className="text-3xl font-bold text-blue-600">{stats.totalMembers}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 card-hover animate-fadeInUp" style={{animationDelay:'0.1s',opacity:0}}>
          <p className="text-xs text-gray-500 mb-1">Active Members</p>
          <p className="text-3xl font-bold text-green-600">{stats.activeMembers}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 card-hover animate-fadeInUp" style={{animationDelay:'0.2s',opacity:0}}>
          <p className="text-xs text-gray-500 mb-1">Inactive Members</p>
          <p className="text-3xl font-bold text-gray-500">{stats.inactiveMembers}</p>
        </div>
      </div>

      {/* Expiring This Week — highlighted card */}
      <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5 mb-4 animate-fadeInUp" style={{animationDelay:'0.3s',opacity:0}}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-orange-700">Expiring This Week</h2>
            <p className="text-xs text-orange-500">Members whose membership ends in 7 days</p>
          </div>
          <span className="text-2xl font-bold text-orange-600 bg-orange-100 px-4 py-1 rounded-full">
            {stats.expiringThisWeek.length}
          </span>
        </div>
        {stats.expiringThisWeek.length === 0 ? (
          <p className="text-sm text-orange-400">No memberships expiring this week</p>
        ) : (
          <div className="space-y-2">
            {stats.expiringThisWeek.map(member => {
              const daysLeft = Math.ceil((new Date(member.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
              return (
                <Link key={member._id} to={`/member/${member._id}`} className="flex items-center justify-between bg-white rounded-xl p-3 hover:bg-orange-50 transition">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{member.name}</p>
                      <p className="text-xs text-gray-400">Reg: {member.registrationNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-orange-600">
                      {daysLeft === 0 ? 'Expires today!' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(member.expiryDate).toLocaleDateString('en-IN')}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Two big cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeInUp" style={{animationDelay:'0.4s',opacity:0}}>
        {/* Expiring Soon */}
        <div className="bg-white border border-yellow-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-yellow-700">Expiring Soon</h2>
            <span className="text-lg font-bold text-yellow-600 bg-yellow-50 px-3 py-0.5 rounded-full">
              {stats.dueSoonMembers}
            </span>
          </div>
          {stats.dueSoonList.length === 0 ? (
            <p className="text-sm text-gray-400">No memberships expiring soon</p>
          ) : (
            <div className="space-y-2">
              {stats.dueSoonList.map(member => (
                <Link key={member._id} to={`/member/${member._id}`} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-yellow-50 rounded-lg px-2 transition">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs font-bold text-yellow-600">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm text-gray-700">{member.name}</p>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(member.expiryDate).toLocaleDateString('en-IN')}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Expired */}
        <div className="bg-white border border-red-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-red-700">Expired Members</h2>
            <span className="text-lg font-bold text-red-600 bg-red-50 px-3 py-0.5 rounded-full">
              {stats.expiredMembers}
            </span>
          </div>
          {stats.expiredList.length === 0 ? (
            <p className="text-sm text-gray-400">No expired memberships</p>
          ) : (
            <div className="space-y-2">
              {stats.expiredList.map(member => (
                <Link key={member._id} to={`/member/${member._id}`} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-red-50 rounded-lg px-2 transition">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs font-bold text-red-600">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm text-gray-700">{member.name}</p>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(member.expiryDate).toLocaleDateString('en-IN')}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}