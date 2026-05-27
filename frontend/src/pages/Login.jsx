import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const userCred = await login(email, password)
      const uid = userCred.user.uid
      const res = await axios.get(`${API}/owner/${uid}`)
      if (!res.data.isApproved) {
        setError('Your account is pending approval. Please contact admin.')
        setLoading(false)
        return
      }
      navigate('/dashboard')
    } catch (err) {
      setError('Wrong email or password. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a5f 100%)' }}>
      {/* Left decorative side — hidden on mobile */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center p-12 text-white">
        <img src="/joomla.png" alt="logo" className="w-20 h-20 object-contain mx-auto mb-6" />
        <h1 className="text-4xl font-bold mb-3">Smart Gym Management</h1>
        <p className="text-blue-300 text-lg text-center max-w-xs">
          Smart gym management for local gym owners
        </p>
        <div className="mt-10 space-y-4 inline-flex flex-col items-start">
          {['Member tracking', 'Due payment alerts', 'WhatsApp reminders', 'Revenue insights'].map(f => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 bg-opacity-30 flex items-center justify-center text-xs text-blue-300">✓</div>
              <p className="text-blue-200 text-sm">{f}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="md:hidden text-center mb-8">
            <img src="/joomla.png" alt="logo" className="w-16 h-16 object-contain mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-white">Smart Gym Management</h1>
            <p className="text-blue-300 text-sm mt-1">Gym Management Made Simple</p>
          </div>

          <div className="bg-white bg-opacity-5 backdrop-blur-sm border border-white border-opacity-10 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-1">Welcome back</h2>
            <p className="text-blue-300 text-sm mb-6">Sign in to your account</p>

            {error && (
              <div className="bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 text-red-300 text-sm p-3 rounded-2xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-1.5 block">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  className="w-full bg-white bg-opacity-10 border border-white border-opacity-10 rounded-2xl px-4 py-3 text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-1.5 block">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full bg-white bg-opacity-10 border border-white border-opacity-10 rounded-2xl px-4 py-3 text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300">Forgot password?</Link>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-2xl text-sm font-bold text-white transition"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #7c3aed)' }}>
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-blue-300">
              No account?{' '}
              <Link to="/signup" className="text-white font-semibold hover:underline">Request Access</Link>
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-blue-400">
            By using Smart Gym Management you agree to our{' '}
            <Link to="/terms" className="underline">Terms</Link> and{' '}
            <Link to="/privacy" className="underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}