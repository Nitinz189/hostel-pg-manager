import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL

export default function Settings() {
  const { currentUser } = useAuth()
  const [profile, setProfile] = useState({ name: '', mobile: '', propertyName: '', upiId: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await axios.get(`${API}/owner/${currentUser.uid}`)
        setProfile({
          name: res.data.name || '',
          mobile: res.data.mobile || '',
          propertyName: res.data.propertyName || '',
          upiId: res.data.upiId || ''
        })
      } catch (err) {
        console.log(err)
      }
    }
    if (currentUser) fetchProfile()
  }, [currentUser])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.put(`${API}/owner/${currentUser.uid}`, profile)
      toast.success('Profile saved!')
    } catch (err) {
      toast.error('Failed to save profile')
    }
    setSaving(false)
  }

  return (
    <div className="p-4 md:p-6 max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your gym profile</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Gym Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Owner Name</label>
            <input
              value={profile.name}
              onChange={e => setProfile({...profile, name: e.target.value})}
              placeholder="Your full name"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Gym Name</label>
            <input
              value={profile.propertyName}
              onChange={e => setProfile({...profile, propertyName: e.target.value})}
              placeholder="e.g. Power Fitness Gym"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Mobile Number</label>
            <input
              value={profile.mobile}
              onChange={e => setProfile({...profile, mobile: e.target.value})}
              placeholder="Your mobile number"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">UPI ID</label>
            <input
              value={profile.upiId}
              onChange={e => setProfile({...profile, upiId: e.target.value})}
              placeholder="yourname@upi"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 mt-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Account Info</h2>
        <p className="text-sm text-gray-500">Email: {currentUser?.email}</p>
        <p className="text-xs text-gray-400 mt-1">To change your password use the forgot password option on the login page.</p>
      </div>
    </div>
  )
}