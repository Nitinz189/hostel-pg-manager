import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir',
  'Ladakh','Lakshadweep','Puducherry'
]

export default function Settings() {
  const { currentUser, logout } = useAuth()
  const [profile, setProfile] = useState({
    name: '', mobile: '', propertyName: '', upiId: '',
    address: { state: '', city: '', pincode: '' }
  })
  const [subscription, setSubscription] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await axios.get(`${API}/owner/${currentUser.uid}`)
        const data = res.data
        setProfile({
          name: data.name || '',
          mobile: data.mobile || '',
          propertyName: data.propertyName || '',
          upiId: data.upiId || '',
          address: {
            state: data.address?.state || '',
            city: data.address?.city || '',
            pincode: data.address?.pincode || ''
          }
        })
        if (data.planEndDate) {
          const daysLeft = Math.ceil((new Date(data.planEndDate) - new Date()) / (1000 * 60 * 60 * 24))
          setSubscription({
            gymmitraId: data.gymmitraId, plan: data.plan || 'free',
            memberLimit: data.memberLimit || 10,
            planStartDate: data.planStartDate, planEndDate: data.planEndDate, daysLeft
          })
        } else {
          setSubscription({
            gymmitraId: data.gymmitraId, plan: data.plan || 'free',
            memberLimit: data.memberLimit || 10,
            planStartDate: null, planEndDate: null, daysLeft: null
          })
        }
      } catch (err) { console.log(err) }
    }
    if (currentUser) fetchProfile()
  }, [currentUser])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.put(`${API}/owner/${currentUser.uid}`, profile)
      toast.success('Profile saved!')
    } catch { toast.error('Failed to save') }
    setSaving(false)
  }

  const daysColor = subscription?.daysLeft === null ? 'text-gray-400' :
    subscription?.daysLeft < 0 ? 'text-red-500' :
    subscription?.daysLeft <= 3 ? 'text-red-500' :
    subscription?.daysLeft <= 7 ? 'text-yellow-500' :
    'text-green-500'

  const planGradient = {
    free: 'linear-gradient(135deg, #6b7280, #4b5563)',
    basic: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    pro: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  }

  return (
    <div className="pb-32 md:pb-8 max-w-2xl">

      {/* Hero */}
      {subscription && (
        <div className="mx-4 mt-4 mb-4 rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #7c3aed 100%)' }}>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-blue-200 font-medium mb-1">GYMmitra Subscription</p>
                {subscription.gymmitraId && (
                  <p className="text-2xl font-bold text-white font-mono tracking-wider">{subscription.gymmitraId}</p>
                )}
                <p className="text-xs text-blue-300 mt-0.5">Share with admin when calling</p>
              </div>
              <span className="text-white text-xs font-bold px-3 py-1.5 rounded-full capitalize"
                style={{ background: planGradient[subscription.plan] || planGradient.free }}>
                {subscription.plan}
              </span>
            </div>

            <div className="bg-white bg-opacity-10 rounded-2xl px-4 py-3 mb-3">
              <p className={`text-base font-bold text-white`}>
                {subscription.daysLeft === null ? 'No plan set' :
                 subscription.daysLeft < 0 ? 'Plan Expired' :
                 `${subscription.daysLeft} days left`}
              </p>
              <p className="text-blue-200 text-xs mt-0.5">
                {subscription.planEndDate
                  ? `Expires ${new Date(subscription.planEndDate).toLocaleDateString('en-IN')}`
                  : 'Contact admin to activate'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white bg-opacity-10 rounded-2xl px-3 py-2.5">
                <p className="text-xs text-blue-300 mb-0.5">Member Limit</p>
                <p className="text-sm font-bold text-white">
                  {subscription.memberLimit >= 999 ? 'Unlimited' : subscription.memberLimit}
                </p>
              </div>
              {subscription.planStartDate && (
                <div className="bg-white bg-opacity-10 rounded-2xl px-3 py-2.5">
                  <p className="text-xs text-blue-300 mb-0.5">Started</p>
                  <p className="text-sm font-bold text-white">
                    {new Date(subscription.planStartDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
              )}
            </div>

            {subscription.daysLeft !== null && subscription.daysLeft <= 7 && (
              <div className={`mt-3 rounded-2xl p-3 ${subscription.daysLeft < 0 ? 'bg-red-500 bg-opacity-30' : 'bg-yellow-500 bg-opacity-20'}`}>
                <p className="text-xs text-white font-medium">
                  {subscription.daysLeft < 0
                    ? '⚠️ Plan expired. Contact admin to renew.'
                    : `⚠️ Expires in ${subscription.daysLeft} days. Contact admin.`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div className="mx-4 mb-4 bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-blue-400 rounded-full"></div>
          <h2 className="text-sm font-bold text-gray-800">Gym Profile</h2>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          {[
            { label: 'Owner Name', key: 'name', placeholder: 'Your full name' },
            { label: 'Gym Name', key: 'propertyName', placeholder: 'e.g. Power Fitness Gym' },
            { label: 'UPI ID', key: 'upiId', placeholder: 'yourname@upi' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{f.label}</label>
              <input value={profile[f.key]}
                onChange={e => setProfile({...profile, [f.key]: e.target.value})}
                placeholder={f.placeholder}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Mobile Number</label>
            <input value={profile.mobile}
              onChange={e => setProfile({...profile, mobile: e.target.value.replace(/[^0-9]/g,'').substring(0,10)})}
              placeholder="10 digit mobile number" maxLength={10} inputMode="numeric"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Address */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Gym Address</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Country</label>
                <input value="India" readOnly
                  className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">State</label>
                <select value={profile.address.state}
                  onChange={e => setProfile({...profile, address: {...profile.address, state: e.target.value}})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select state</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {profile.address.state && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">City</label>
                  <input value={profile.address.city}
                    onChange={e => setProfile({...profile, address: {...profile.address, city: e.target.value}})}
                    placeholder="Enter your city"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              {profile.address.city && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Pincode</label>
                  <input value={profile.address.pincode}
                    onChange={e => setProfile({...profile, address: {...profile.address, pincode: e.target.value.replace(/[^0-9]/g,'').substring(0,6)}})}
                    placeholder="6 digit pincode" maxLength={6}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full text-white py-3 rounded-2xl text-sm font-bold transition"
            style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)' }}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="mx-4 mb-4 bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-gray-300 rounded-full"></div>
          <h2 className="text-sm font-bold text-gray-800">Account</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)' }}>
            {currentUser?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{currentUser?.email}</p>
            <p className="text-xs text-gray-400">Use forgot password on login to change password</p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="mx-4 mb-4">
        {!showLogoutConfirm ? (
          <button onClick={() => setShowLogoutConfirm(true)}
            className="w-full border border-red-100 text-red-400 py-3 rounded-2xl text-sm font-medium hover:bg-red-50 transition">
            🚪 Logout
          </button>
        ) : (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-4">
            <p className="text-sm text-red-700 font-semibold mb-3 text-center">Sure you want to logout?</p>
            <div className="flex gap-3">
              <button onClick={logout}
                className="flex-1 bg-red-500 text-white py-3 rounded-2xl text-sm font-bold">
                Yes, Logout
              </button>
              <button onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm font-medium">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}