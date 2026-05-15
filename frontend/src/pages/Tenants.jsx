import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL

const empty = {
  name: '', mobile: '', roomNumber: '',
  rentAmount: '', rentDueDate: '', joiningDate: '', notes: ''
}

export default function Tenants() {
  const { currentUser } = useAuth()
  const [tenants, setTenants] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(true)

  async function fetchTenants() {
    try {
      const res = await axios.get(`${API}/tenants?ownerId=${currentUser.uid}`)
      setTenants(res.data)
    } catch (err) {
      toast.error('Failed to load tenants')
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
      rentDueDate: tenant.rentDueDate,
      joiningDate: tenant.joiningDate?.split('T')[0],
      notes: tenant.notes
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
          ...form,
          ownerId: currentUser.uid,
          paymentStatus: 'unpaid'
        })
        toast.success('Tenant added!')
      }
      setShowModal(false)
      fetchTenants()
    } catch (err) {
      toast.error('Something went wrong')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this tenant?')) return
    try {
      await axios.delete(`${API}/tenants/${id}`)
      toast.success('Tenant deleted!')
      fetchTenants()
    } catch (err) {
      toast.error('Failed to delete tenant')
    }
  }

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.roomNumber.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Tenants</h1>
          <p className="text-gray-500 text-sm">Manage all your tenants</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Add Tenant
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or room number..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Table */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading tenants...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-sm">No tenants yet. Click + Add Tenant to get started.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
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
                <tr key={tenant._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium text-gray-700">{tenant.name}</td>
                  <td className="px-4 py-3 text-gray-600">Room {tenant.roomNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{tenant.mobile}</td>
                  <td className="px-4 py-3 text-gray-600">₹{tenant.rentAmount}</td>
                  <td className="px-4 py-3 text-gray-600">{tenant.rentDueDate}th</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tenant.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-500'
                    }`}>
                      {tenant.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => openEdit(tenant)}
                      className="text-blue-500 hover:text-blue-700 text-xs border border-blue-200 px-2 py-1 rounded-lg"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tenant._id)}
                      className="text-red-500 hover:text-red-700 text-xs border border-red-200 px-2 py-1 rounded-lg"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editing ? 'Edit Tenant' : 'Add New Tenant'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Full Name</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Tenant full name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Mobile Number</label>
                <input
                  required
                  value={form.mobile}
                  onChange={e => setForm({...form, mobile: e.target.value})}
                  placeholder="10 digit mobile number"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Room Number</label>
                <input
                  required
                  value={form.roomNumber}
                  onChange={e => setForm({...form, roomNumber: e.target.value})}
                  placeholder="e.g. 101"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Rent Amount (₹)</label>
                <input
                  required
                  type="number"
                  value={form.rentAmount}
                  onChange={e => setForm({...form, rentAmount: e.target.value})}
                  placeholder="e.g. 5000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Rent Due Date (day of month)</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="31"
                  value={form.rentDueDate}
                  onChange={e => setForm({...form, rentDueDate: e.target.value})}
                  placeholder="e.g. 5 means every 5th of month"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Joining Date</label>
                <input
                  required
                  type="date"
                  value={form.joiningDate}
                  onChange={e => setForm({...form, joiningDate: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                  placeholder="Any extra notes about this tenant"
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  {editing ? 'Save Changes' : 'Add Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}