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

  async function deleteOwner(ownerId, ownerName) {
    if (!window.confirm(`Delete ${ownerName} and all their data? This cannot be undone.`)) return
    try {
      await axios.delete(`${API}/admin/owners/${ownerId}`)
      toast.success(`${ownerName} deleted!`)
      fetchOwners()
    } catch (err) {
      toast.error('Failed to delete owner')
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

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Admin Panel</h1>
        <p className="text-gray-500 text-sm">Manage all app users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Owners</p>
          <p className="text-2xl font-semibold text-blue-600">{stats.totalOwners}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Tenants</p>
          <p className="text-2xl font-semibold text-green-600">{stats.totalTenants}</p>
        </div>
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
      ) : owners.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-sm">No owners yet</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Owner</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Property</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Tenants</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Joined</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {owners.map((owner, i) => (
                <tr key={owner._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                        {(owner.name || 'O').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-700">{owner.name || 'No name'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{owner.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{owner.propertyName || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                      {owner.tenantCount || 0} tenants
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(owner.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    {owner.email !== ADMIN_EMAIL && (
                      <button
                        onClick={() => deleteOwner(owner.firebaseUid, owner.name)}
                        className="text-red-500 text-xs border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 transition"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}