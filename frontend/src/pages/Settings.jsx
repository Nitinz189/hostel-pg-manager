import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL

export default function Settings() {
  const { currentUser } = useAuth()
  const [profile, setProfile] = useState({
    name: '',
    mobile: '',
    propertyName: '',
    qrCodeUrl: ''
  })
  const [qrFile, setQrFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await axios.get(`${API}/owner/${currentUser.uid}`)
        setProfile(res.data)
      } catch (err) {
        console.log(err)
      }
    }
    if (currentUser) fetchProfile()
  }, [currentUser])

  async function handleSaveProfile(e) {
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

  async function handleQrUpload() {
    if (!qrFile) return toast.error('Please select a QR code image')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('qr', qrFile)
      formData.append('firebaseUid', currentUser.uid)
      const res = await axios.post(`${API}/owner/upload-qr`, formData)
      setProfile({ ...profile, qrCodeUrl: res.data.qrCodeUrl })
      toast.success('QR code uploaded!')
    } catch (err) {
      toast.error('Failed to upload QR code')
    }
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your profile and payment QR code</p>
      </div>

      {/* Profile Form */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Owner Profile</h2>
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Your Name</label>
            <input
              value={profile.name}
              onChange={e => setProfile({...profile, name: e.target.value})}
              placeholder="Your full name"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Mobile Number</label>
            <input
              value={profile.mobile}
              onChange={e => setProfile({...profile, mobile: e.target.value})}
              placeholder="Your mobile number"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Property Name</label>
            <input
              value={profile.propertyName}
              onChange={e => setProfile({...profile, propertyName: e.target.value})}
              placeholder="e.g. Sharma PG, Green Hostel"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* QR Code Upload */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
        <h2 className="text-base font-semibold text-gray-700 mb-1">UPI QR Code</h2>
        <p className="text-xs text-gray-400 mb-4">
          Upload your UPI QR code so tenants can scan and pay rent
        </p>

        {profile.qrCodeUrl && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Current QR Code:</p>
            <img
              src={profile.qrCodeUrl}
              alt="UPI QR Code"
              className="w-40 h-40 object-contain border border-gray-100 rounded-xl p-2"
            />
          </div>
        )}

        <div className="space-y-3">
          <input
            type="file"
            accept="image/*"
            onChange={e => setQrFile(e.target.files[0])}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={handleQrUpload}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
          >
            {loading ? 'Uploading...' : 'Upload QR Code'}
          </button>
        </div>
      </div>

      {/* Reminder Preview */}
      {profile.qrCodeUrl && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-1">
            Reminder Message Preview
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            This is how your rent reminder will look
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 space-y-2">
            <p>🏠 <strong>Rent Reminder</strong></p>
            <p>Dear Tenant,</p>
            <p>Your rent of <strong>₹[Amount]</strong> is due on <strong>[Due Date]</strong>.</p>
            <p>Please pay to <strong>{profile.name || 'Owner'}</strong> — <strong>{profile.propertyName || 'Property'}</strong></p>
            <p>Scan the QR code below to pay:</p>
            <img
              src={profile.qrCodeUrl}
              alt="QR"
              className="w-32 h-32 object-contain mt-2"
            />
            <p className="text-xs text-gray-400">Thank you for your payment!</p>
          </div>
        </div>
      )}
    </div>
  )
}