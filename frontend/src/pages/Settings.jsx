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
  const { currentUser } = useAuth()
  const [profile, setProfile] = useState({
    name: '', mobile: '', propertyName: '', upiId: '',
    address: { state: '', city: '', pincode: '' }
  })
  const [subscription, setSubscription] = useState(null)
  const [saving, setSaving] = useState(false)

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
          const today = new Date()
          const endDate = new Date(data.planEndDate)
          const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
          setSubscription({
            gymmitraId: data.gymmitraId,
            plan: data.plan || 'free',
            memberLimit: data.memberLimit || 10,
            planStartDate: data.planStartDate,
            planEndDate: data.planEndDate,
            daysLeft
          })
        } else {
          setSubscription({
            gymmitraId: data.gymmitraId,
            plan: data.plan || 'free',
            memberLimit: data.memberLimit || 10,
            planStartDate: null,
            planEndDate: null,
            daysLeft: null
          })
        }
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
      toast.error('Failed to save')
    }
    setSaving(false)
  }

  const planColors = {
    free: 'text-gray-600 bg-gray-100',
    basic: 'text-blue-600 bg-blue-100',
    pro: 'text-purple-600 bg-purple-100'
  }

  const daysColor = subscription?.daysLeft === null ? 'text-gray-500' :
    subscription?.daysLeft < 0 ? 'text-red-600' :
    subscription?.daysLeft <= 3 ? 'text-red-600' :
    subscription?.daysLeft <= 7 ? 'text-yellow-600' :
    'text-green-600'

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your gym profile and subscription</p>
      </div>

      {/* Subscription Card */}
      {subscription && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Your GYMmitra Subscription</h2>

          {subscription.gymmitraId && (
            <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">GYMmitra ID</p>
                <p className="text-lg font-bold text-gray-700 tracking-wider font-mono">{subscription.gymmitraId}</p>
              </div>
              <p className="text-xs text-gray-400">Share with admin when calling</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Plan</p>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${planColors[subscription.plan]}`}>
                {subscription.plan}
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Member Limit</p>
              <p className="text-sm font-semibold text-gray-700">
                {subscription.memberLimit >= 999 ? 'Unlimited' : subscription.memberLimit}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <p className={`text-sm font-semibold ${daysColor}`}>
                {subscription.daysLeft === null ? 'No plan set' :
                 subscription.daysLeft < 0 ? 'Expired' :
                 `${subscription.daysLeft} days left`}
              </p>
            </div>
            {subscription.planStartDate && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Started</p>
                <p className="text-sm font-medium text-gray-700">
                  {new Date(subscription.planStartDate).toLocaleDateString('en-IN')}
                </p>
              </div>
            )}
            {subscription.planEndDate && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Expires</p>
                <p className={`text-sm font-medium ${daysColor}`}>
                  {new Date(subscription.planEndDate).toLocaleDateString('en-IN')}
                </p>
              </div>
            )}
          </div>

          {subscription.daysLeft !== null && subscription.daysLeft <= 7 && (
            <div className={`mt-3 rounded-xl p-3 ${subscription.daysLeft < 0 ? 'bg-red-50' : 'bg-yellow-50'}`}>
              <p className={`text-xs font-medium ${subscription.daysLeft < 0 ? 'text-red-600' : 'text-yellow-700'}`}>
                {subscription.daysLeft < 0
                  ? 'Your plan has expired. Contact admin to renew.'
                  : `Your plan expires in ${subscription.daysLeft} days. Contact admin to renew.`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Gym Profile</h2>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Owner Name</label>
            <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="Your full name" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Gym Name</label>
            <input value={profile.propertyName} onChange={e => setProfile({...profile, propertyName: e.target.value})} placeholder="e.g. Power Fitness Gym" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Mobile Number</label>
            <input value={profile.mobile} onChange={e => setProfile({...profile, mobile: e.target.value})} placeholder="Your mobile number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">UPI ID</label>
            <input value={profile.upiId} onChange={e => setProfile({...profile, upiId: e.target.value})} placeholder="yourname@upi" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Address */}
          <div className="pt-2 border-t border-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-3">Gym Address</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Country</label>
                <input value="India" readOnly className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">State</label>
                <select
                  value={profile.address.state}
                  onChange={e => setProfile({...profile, address: {...profile.address, state: e.target.value}})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {profile.address.state && (
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">City</label>
                  <input
                    value={profile.address.city}
                    onChange={e => setProfile({...profile, address: {...profile.address, city: e.target.value}})}
                    placeholder="Enter your city"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              {profile.address.city && (
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Pincode</label>
                  <input
                    value={profile.address.pincode}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '').substring(0, 6)
                      setProfile({...profile, address: {...profile.address, pincode: val}})
                    }}
                    placeholder="6 digit pincode"
                    maxLength={6}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Account Info</h2>
        <p className="text-sm text-gray-500">Email: {currentUser?.email}</p>
        <p className="text-xs text-gray-400 mt-1">To change your password use the forgot password option on the login page.</p>
      </div>
    </div>
  )
}