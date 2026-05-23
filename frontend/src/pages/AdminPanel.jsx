import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL
const ADMIN_EMAIL = 'vnitin398@gmail.com'

export default function AdminPanel() {
  const { currentUser } = useAuth()
  const [owners, setOwners] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalOwners: 0, totalTenants: 0 })
  const [editingLimit, setEditingLimit] = useState(null)
  const [newLimit, setNewLimit] = useState('')
  const [filter, setFilter] = useState('all')

  const isAdmin = currentUser?.email === ADMIN_EMAIL

  async function fetchOwners() {
    try {
      const res = await axios.get(`${API}/admin/owners`)
      setOwners(res.data.owners)
      setStats(res.data.stats)
    } catch (err) {
      toast.error('Failed to load owners')
    }
    setLoading(false)
  }

  async function approveOwner(firebaseUid, name) {
    try {
      await axios.put(`${API}/admin/owners/${firebaseUid}`, { isApproved: true })
      toast.success(`${name} approved!`)
      fetchOwners()
    } catch (err) {
      toast.error('Failed to approve')
    }
  }

  async function revokeOwner(firebaseUid, name) {
    if (!window.confirm(`Revoke access for ${name}?`)) return
    try {
      await axios.put(`${API}/admin/owners/${firebaseUid}`, { isApproved: false })
      toast.success(`${name} access revoked!`)
      fetchOwners()
    } catch (err) {
      toast.error('Failed to revoke')
    }
  }

  async function updateLimit(firebaseUid, name) {
    try {
      await axios.put(`${API}/admin/owners/${firebaseUid}`, {
        memberLimit: parseInt(newLimit)
      })
      toast.success(`${name} limit updated to ${newLimit}!`)
      setEditingLimit(null)
      setNewLimit('')
      fetchOwners()
    } catch (err) {
      toast.error('Failed to update limit')
    }
  }

  async function deleteOwner(firebaseUid, name) {
    if (!window.confirm(`Delete ${name} and ALL their data? This cannot be undone.`)) return
    try {
      await axios.delete(`${API}/admin/owners/${firebaseUid}`)
      toast.success(`${name} deleted!`)
      fetchOwners()
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  async function setPlan(firebaseUid, plan, name) {
    const limits = { free: 10, basic: 100, pro: 999 }
    try {
      await axios.put(`${API}/admin/owners/${firebaseUid}`, {
        plan,
        memberLimit: limits[plan]
      })
      toast.success(`${name} set to ${plan} plan!`)
      fetchOwners()
    } catch (err) {
      toast.error('Failed to update plan')
    }
  }

  useEffect(() => {
    if (currentUser && isAdmin) fetchOwners()
  }, [currentUser])

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h1>
        <p className="text-gray-500 text-sm">You don't have permission to view this page.</p>
      </div>
    )
  }

  const filteredOwners = owners.filter(o => {
    if (filter === 'pending') return !o.isApproved
    if (filter === 'approved') return o.isApproved
    return true
  })

  const pendingCount = owners.filter(o => !o.isApproved).length

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Admin Panel</h1>
        <p className="text-gray-500 text-sm">Manage all GYMmitra users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Gyms</p>
          <p className="text-2xl font-semibold text-blue-600">{stats.totalOwners}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Members</p>
          <p className="text-2xl font-semibold text-green-600">{stats.totalTenants}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Pending Approval</p>
          <p className="text-2xl font-semibold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Approved Gyms</p>
          <p className="text-2xl font-semibold text-purple-600">{stats.totalOwners - pendingCount}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { value: 'all', label: 'All' },
          { value: 'pending', label: `Pending (${pendingCount})` },
          { value: 'approved', label: 'Approved' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition ${
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Owners List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : filteredOwners.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-sm">No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOwners.map(owner => (
            <div key={owner._id} className={`bg-white border rounded-2xl p-4 ${
              !owner.isApproved ? 'border-yellow-200' : 'border-gray-100'
            }`}>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                    {(owner.name || 'G').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{owner.propertyName || owner.name || 'No name'}</p>
                    <p className="text-xs text-gray-400">{owner.email}</p>
                    <p className="text-xs text-gray-400">{owner.mobile}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Approval status */}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    owner.isApproved
                      ? 'bg-green-100 text-green-600'
                      : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {owner.isApproved ? 'Approved' : 'Pending'}
                  </span>

                  {/* Plan badge */}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    owner.plan === 'pro' ? 'bg-purple-100 text-purple-600' :
                    owner.plan === 'basic' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {owner.plan || 'free'} plan
                  </span>

                  {/* Member count */}
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {owner.tenantCount || 0}/{owner.memberLimit || 10} members
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                {/* Approve/Revoke */}
                {!owner.isApproved ? (
                  <button
                    onClick={() => approveOwner(owner.firebaseUid, owner.name)}
                    className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-600 transition"
                  >
                    Approve Access
                  </button>
                ) : (
                  <button
                    onClick={() => revokeOwner(owner.firebaseUid, owner.name)}
                    className="bg-yellow-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-yellow-600 transition"
                  >
                    Revoke Access
                  </button>
                )}

                {/* Plan buttons */}
                {owner.email !== ADMIN_EMAIL && (
                  <>
                    <button
                      onClick={() => setPlan(owner.firebaseUid, 'free', owner.name)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                        owner.plan === 'free'
                          ? 'bg-gray-600 text-white border-gray-600'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Free (10)
                    </button>
                    <button
                      onClick={() => setPlan(owner.firebaseUid, 'basic', owner.name)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                        owner.plan === 'basic'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      Basic (100)
                    </button>
                    <button
                      onClick={() => setPlan(owner.firebaseUid, 'pro', owner.name)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                        owner.plan === 'pro'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      Pro (unlimited)
                    </button>
                  </>
                )}

                {/* Custom limit */}
                {editingLimit === owner.firebaseUid ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={newLimit}
                      onChange={e => setNewLimit(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => updateLimit(owner.firebaseUid, owner.name)}
                      className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingLimit(null)}
                      className="text-gray-500 text-xs px-2 py-1.5 rounded-lg hover:bg-gray-50 border border-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingLimit(owner.firebaseUid); setNewLimit(owner.memberLimit || 10) }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Custom limit
                  </button>
                )}

                {/* Delete */}
                {owner.email !== ADMIN_EMAIL && (
                  <button
                    onClick={() => deleteOwner(owner.firebaseUid, owner.name)}
                    className="text-red-500 text-xs border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition ml-auto"
                  >
                    Delete
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Joined: {new Date(owner.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}