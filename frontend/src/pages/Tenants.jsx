import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL

const empty = {
  name: '', mobile: '', registrationNumber: '',
  membershipType: 'Monthly', membershipFee: '',
  joiningDate: '', expiryDate: '', notes: ''
}

export default function Tenants() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(true)

  async function fetchMembers() {
    setLoading(true)
    try {
      const res = await axios.get(
        `${API}/tenants?ownerId=${currentUser.uid}`,
        { timeout: 60000 }
      )
      setMembers(res.data)
    } catch (err) {
      toast.error('Failed to load members')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (currentUser) fetchMembers()
  }, [currentUser])

  function openAdd() {
    setEditing(null)
    setForm(empty)
    setShowModal(true)
  }

  function openEdit(member) {
    setEditing(member._id)
    setForm({
      name: member.name,
      mobile: member.mobile,
      registrationNumber: member.registrationNumber,
      membershipType: member.membershipType || 'Monthly',
      membershipFee: member.membershipFee,
      joiningDate: member.joiningDate?.split('T')[0],
      expiryDate: member.expiryDate?.split('T')[0],
      notes: member.notes || ''
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
  e.preventDefault()
  try {
    if (editing) {
      await axios.put(`${API}/tenants/${editing}`, form)
      toast.success('Member updated!')
    } else {
      await axios.post(`${API}/tenants`, {
        ...form,
        ownerId: currentUser.uid,
        status: 'active'
      })
      toast.success('Member added!')
    }
    setShowModal(false)
    fetchMembers()
  } catch (err) {
    if (err.response?.status === 403) {
      toast.error(err.response.data.message)
    } else {
      toast.error('Something went wrong')
    }
  }
}

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return
    try {
      await axios.delete(`${API}/tenants/${id}`)
      toast.success('Member deleted!')
      fetchMembers()
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  function sendWhatsApp(member) {
    const message = `Hi ${member.name},

Your GYMmitra membership is expiring on ${new Date(member.expiryDate).toLocaleDateString('en-IN')}.

Registration No: ${member.registrationNumber}
Membership: ${member.membershipType}
Fee: Rs.${member.membershipFee}

Please renew your membership to continue your fitness journey!

Thank you!`

    const phone = member.mobile.replace(/[^0-9]/g, '')
    const indiaPhone = phone.startsWith('91') ? phone : `91${phone}`
    window.open(`https://wa.me/${indiaPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const statusColor = {
    active: 'bg-green-100 text-green-700',
    due_soon: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700'
  }

  const statusLabel = {
    active: 'Active',
    due_soon: 'Expiring Soon',
    expired: 'Expired'
  }

  const filtered = members.filter(m => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      m.mobile.includes(search)
    const matchFilter = filter === 'all' || m.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Members</h1>
          <p className="text-gray-500 text-sm">{members.length} total members</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
        >
          + Add Member
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name, reg number, mobile..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'due_soon', label: 'Expiring' },
            { value: 'expired', label: 'Expired' }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members List */}
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
          <p className="text-5xl mb-3">💪</p>
          <p className="text-sm font-medium">No members found</p>
          <p className="text-xs mt-1">Add your first gym member to get started</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Member</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Reg No</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Mobile</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Membership</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Expiry</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member, i) => (
                  <tr key={member._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-700">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{member.registrationNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{member.mobile}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {member.membershipType} — ₹{member.membershipFee?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(member.expiryDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[member.status]}`}>
                        {statusLabel[member.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => navigate(`/tenant/${member._id}`)} className="text-purple-500 text-xs border border-purple-200 px-2 py-1 rounded-lg hover:bg-purple-50">View</button>
                        <button onClick={() => openEdit(member)} className="text-blue-500 text-xs border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50">Edit</button>
                        <button onClick={() => sendWhatsApp(member)} className="text-green-600 text-xs border border-green-200 px-2 py-1 rounded-lg hover:bg-green-50">WA</button>
                        <button onClick={() => handleDelete(member._id, member.name)} className="text-red-500 text-xs border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(member => (
              <div key={member._id} className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{member.name}</p>
                      <p className="text-xs text-gray-400">Reg: {member.registrationNumber}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[member.status]}`}>
                    {statusLabel[member.status]}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                  <span>📱 {member.mobile}</span>
                  <span>💰 ₹{member.membershipFee?.toLocaleString()}</span>
                  <span>🏋️ {member.membershipType}</span>
                  <span>📅 Exp: {new Date(member.expiryDate).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/tenant/${member._id}`)} className="flex-1 text-purple-600 text-xs border border-purple-200 py-1.5 rounded-lg hover:bg-purple-50">View</button>
                  <button onClick={() => openEdit(member)} className="flex-1 text-blue-500 text-xs border border-blue-200 py-1.5 rounded-lg hover:bg-blue-50">Edit</button>
                  <button onClick={() => sendWhatsApp(member)} className="flex-1 bg-green-500 text-white text-xs py-1.5 rounded-lg hover:bg-green-600">WhatsApp</button>
                  <button onClick={() => handleDelete(member._id, member.name)} className="flex-1 text-red-500 text-xs border border-red-200 py-1.5 rounded-lg hover:bg-red-50">Delete</button>
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
              {editing ? 'Edit Member' : 'Add New Member'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Full Name</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Member full name" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Mobile Number</label>
                <input required value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} placeholder="10 digit number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Registration Number</label>
                <input required value={form.registrationNumber} onChange={e => setForm({...form, registrationNumber: e.target.value})} placeholder="e.g. GYM001" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Membership Type</label>
                <select value={form.membershipType} onChange={e => setForm({...form, membershipType: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly (3 months)</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Membership Fee (₹)</label>
                <input required type="number" value={form.membershipFee} onChange={e => setForm({...form, membershipFee: e.target.value})} placeholder="e.g. 1000" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Date of Joining</label>
                <input required type="date" value={form.joiningDate} onChange={e => setForm({...form, joiningDate: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Membership Expiry Date</label>
                <input required type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Notes (optional)</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any notes about this member" rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">{editing ? 'Save Changes' : 'Add Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}