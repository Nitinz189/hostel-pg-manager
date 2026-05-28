import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [gymName, setGymName] = useState('')
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { signup } = useAuth()

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const userCred = await signup(email, password)
      const uid = userCred.user.uid
      await axios.put(`${API}/owner/${uid}`, {
        firebaseUid: uid, email, mobile,
        propertyName: gymName, name: gymName,
        isApproved: false, memberLimit: 10
      })
      setSubmitted(true)
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password too weak. Use at least 6 characters.')
      } else {
        setError(err.message || 'Could not create account. Please try again.')
      }
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a5f 100%)' }}>
        <div className="w-full max-w-sm text-center">
          <div className="bg-white bg-opacity-5 border border-white border-opacity-10 rounded-3xl p-8">
            <div className="text-5xl mb-4">⏳</div>
            <h1 className="text-xl font-bold text-white mb-2">Request Submitted!</h1>
            <p className="text-blue-300 text-sm mb-4">
              Your account is pending admin approval. You'll be able to login once approved.
            </p>
            <p className="text-blue-400 text-xs mb-6">Usually approved within 24 hours</p>
            <Link to="/login"
              className="block w-full py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #7c3aed)' }}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a5f 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <img src="/gym.png" alt="logo" className="w-16 h-16 object-contain mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">Smart Gym Management</h1>
          <p className="text-blue-300 text-sm mt-1">Request access for your gym</p>
        </div>

        <div className="bg-white bg-opacity-5 border border-white border-opacity-10 rounded-3xl p-6">
          <h2 className="text-lg font-bold text-white mb-1">Create Account</h2>
          <p className="text-blue-300 text-sm mb-6">Fill in your gym details</p>

          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 text-red-300 text-sm p-3 rounded-2xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-1.5 block">Gym Name</label>
              <input type="text" value={gymName} onChange={e => setGymName(e.target.value)}
                placeholder="e.g. Power Fitness Gym" required
                className="w-full bg-white bg-opacity-10 border border-white border-opacity-10 rounded-2xl px-4 py-3 text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-1.5 block">Mobile Number</label>
              <input type="text" value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g,'').substring(0,10))}
                placeholder="10 digit mobile number" required maxLength={10} inputMode="numeric"
                className="w-full bg-white bg-opacity-10 border border-white border-opacity-10 rounded-2xl px-4 py-3 text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="w-full bg-white bg-opacity-10 border border-white border-opacity-10 rounded-2xl px-4 py-3 text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters" required
                  className="w-full bg-white bg-opacity-10 border border-white border-opacity-10 rounded-2xl px-4 py-3 pr-12 text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white text-lg transition">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-2xl text-sm font-bold text-white transition"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #7c3aed)' }}>
              {loading ? 'Submitting...' : 'Request Access →'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-blue-300">
            Already have access?{' '}
            <Link to="/login" className="text-white font-semibold hover:underline">Sign In</Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-blue-400">
          By using Smart Gym Management you agree to our{' '}
          <Link to="/terms" className="underline">Terms</Link> and{' '}
          <Link to="/privacy" className="underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}