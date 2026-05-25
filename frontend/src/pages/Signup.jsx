import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [gymName, setGymName] = useState('')
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const userCred = await signup(email, password)
      const uid = userCred.user.uid

      // Create owner profile with isApproved = false
      await axios.put(`${API}/owner/${uid}`, {
        firebaseUid: uid,
        email,
        mobile,
        propertyName: gymName,
        name: gymName,
        isApproved: false,
        memberLimit: 10
      })

      setSubmitted(true)
    } catch (err) {
      setError('Could not create account. Try a stronger password.')
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Request Submitted!</h1>
          <p className="text-gray-500 text-sm mb-4">
            Your account is pending approval. The admin will review and approve your account shortly.
          </p>
          <p className="text-xs text-gray-400">
            Once approved you will be able to login with your email and password.
          </p>
          <Link to="/login" className="mt-6 block text-blue-600 text-sm hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💪</div>
          <h1 className="text-2xl font-bold text-blue-600">GYMmitra</h1>
          <p className="text-gray-400 text-sm mt-1">Request access for your gym</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Gym Name</label>
            <input
              type="text"
              value={gymName}
              onChange={e => setGymName(e.target.value)}
              placeholder="e.g. Power Fitness Gym"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Mobile Number</label>
            <input
              type="text"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              placeholder="10 digit mobile number"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            {loading ? 'Submitting...' : 'Request Access'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have access?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
  <p className="text-xs text-gray-400">
    By using GYMmitra you agree to our{' '}
    <Link to="/terms" className="text-blue-500 hover:underline">Terms of Service</Link>
    {' '}and{' '}
    <Link to="/privacy" className="text-blue-500 hover:underline">Privacy Policy</Link>
  </p>
</div>
      </div>
      
        
    </div>
  )
}