import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL

const empty = {
  name: '', mobile: '', roomNumber: '', rentAmount: '',
  securityDeposit: '', rentDueDate: '', joiningDate: '', notes: ''
}

export default function Tenants() {
  const { currentUser } = useAuth()
  const [tenants, setTenants] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function fetchTenants() {
  setLoading(true)
  try {
    const res = await axios.get(
      `${API}/tenants?ownerId=${currentUser.uid}`,
      { timeout: 60000 }
    )
    setTenants(res.data)
  } catch (err) {
    console.log('Fetch tenants error:', err)
    toast.error('Backend is waking up... retrying in 5 seconds')
    setTimeout(fetchTenants, 5000)
  }
  setLoading(false)
}

  useEffect(() => {
    if (currentUser) fetchTenants()
  }, [currentUser])

  function openAdd() {
    setEditing(null)
    setForm(empty)
    setShowModal(true)
  }

  function openEdit(tenant) {
    setEditing(tenant._id)
    setForm({
      name: tenant.name,
      mobile: tenant.mobile,
      roomNumber: tenant.roomNumber,
      rentAmount: tenant.rentAmount,
      securityDeposit: tenant.securityDeposit || '',
      rentDueDate: tenant.rentDueDate,
      joiningDate: tenant.joiningDate?.split('T')[0],
      notes: tenant.notes || ''
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editing) {
        await axios.put(`${API}/tenants/${editing}`, form)
        toast.success('Tenant updated!')
      } else {
        await axios.post(`${API}/tenants`, {
          ...form, ownerId: currentUser.uid, paymentStatus: 'unpaid'
        })
        toast.success('Tenant added!')
      }
      setShowModal(false)
      fetchTenants()
    } catch (err) {
      toast.error('Something went wrong')
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return
    try {
      await axios.delete(`${API}/tenants/${id}`)
      toast.success('Tenant deleted!')
      fetchTenants()
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  const statusColor = {
    paid: 'bg-green-100 text-green-700',
    unpaid: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700'
  }

  const filtered = tenants.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.mobile.includes(search)
    const matchFilter = filter === 'all' || t.paymentStatus === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Tenants</h1>
          <p className="text-gray-500 text-sm">{tenants.length} total tenants</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1"
        >
          + Add Tenant
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name, room, mobile..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          {['all', 'paid', 'unpaid', 'overdue'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tenants List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-3">👥</p>
          <p className="text-sm font-medium">No tenants found</p>
          <p className="text-xs mt-1">Try a different search or add a new tenant</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Tenant</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Room</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Mobile</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Rent</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Due Date</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tenant, i) => (
                  <tr key={tenant._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                          {tenant.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-700">{tenant.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">Room {tenant.roomNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{tenant.mobile}</td>
                    <td className="px-4 py-3 text-gray-600">₹{tenant.rentAmount?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{tenant.rentDueDate}th</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor[tenant.paymentStatus]}`}>
                        {tenant.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => openEdit(tenant)} className="text-blue-500 text-xs border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50 transition">Edit</button>
                      <button onClick={() => handleDelete(tenant._id, tenant.name)} className="text-red-500 text-xs border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 transition">Delete</button>
                      <button onClick={() => navigate(`/tenant/${tenant._id}`)} className="text-purple-500 text-xs border border-purple-200 px-2 py-1 rounded-lg hover:bg-purple-50 transition">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(tenant => (
              <div key={tenant._id} className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                      {tenant.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{tenant.name}</p>
                      <p className="text-xs text-gray-400">Room {tenant.roomNumber}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor[tenant.paymentStatus]}`}>
                    {tenant.paymentStatus}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                  <span>📱 {tenant.mobile}</span>
                  <span>💰 ₹{tenant.rentAmount?.toLocaleString()}</span>
                  <span>📅 Due: {tenant.rentDueDate}th</span>
                  <span>🔐 Deposit: ₹{tenant.securityDeposit || 0}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(tenant)} className="flex-1 text-blue-600 text-xs border border-blue-200 py-1.5 rounded-lg hover:bg-blue-50 transition">Edit</button>
                  <button onClick={() => handleDelete(tenant._id, tenant.name)} className="flex-1 text-red-500 text-xs border border-red-200 py-1.5 rounded-lg hover:bg-red-50 transition">Delete</button>
                  <button onClick={() => navigate(`/tenant/${tenant._id}`)} className="flex-1 text-purple-600 text-xs border border-purple-200 py-1.5 rounded-lg hover:bg-purple-50 transition">View Profile</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editing ? 'Edit Tenant' : 'Add New Tenant'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Tenant full name', required: true },
                { label: 'Mobile Number', key: 'mobile', type: 'text', placeholder: '10 digit number', required: true },
                { label: 'Room Number', key: 'roomNumber', type: 'text', placeholder: 'e.g. 101', required: true },
                { label: 'Rent Amount (₹)', key: 'rentAmount', type: 'number', placeholder: 'e.g. 5000', required: true },
                { label: 'Security Deposit (₹)', key: 'securityDeposit', type: 'number', placeholder: 'e.g. 10000', required: false },
                { label: 'Rent Due Date (day)', key: 'rentDueDate', type: 'number', placeholder: 'e.g. 5', required: true },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-sm text-gray-600 mb-1 block">{field.label}</label>
                  <input
                    type={field.type}
                    required={field.required}
                    value={form[field.key]}
                    onChange={e => setForm({...form, [field.key]: e.target.value})}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Joining Date</label>
                <input
                  type="date"
                  required
                  value={form.joiningDate}
                  onChange={e => setForm({...form, joiningDate: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                  placeholder="Any extra notes"
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition">{editing ? 'Save Changes' : 'Add Tenant'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}