import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

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

      // Check if account is approved
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💪</div>
          <h1 className="text-2xl font-bold text-blue-600">GYMmitra</h1>
          <p className="text-gray-400 text-sm mt-1">Gym Management Made Simple</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="••••••••"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline block">
            Forgot password?
          </Link>
          <p className="text-sm text-gray-500">
            No account?{' '}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Request Access
            </Link>
          </p>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
  <p className="text-xs text-gray-400">
    By using GYMmitra you agree to our{' '}
    <Link to="/terms" className="text-blue-500 hover:underline">Terms of Service</Link>
    {' '}and{' '}
    <Link to="/privacy" className="text-blue-500 hover:underline">Privacy Policy</Link>
  </p>
</div>
    </div>
  )
}