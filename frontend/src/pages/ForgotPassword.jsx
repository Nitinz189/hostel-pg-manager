import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { resetPassword } = useAuth()

  async function handleReset(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
      toast.success('Reset email sent!')
    } catch (err) {
      toast.error('No account found with this email')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Check your email!</h1>
            <p className="text-gray-500 text-sm mb-6">
              We sent a password reset link to <strong>{email}</strong>
            </p>
            <Link to="/login" className="text-blue-600 text-sm hover:underline">
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Reset Password</h1>
            <p className="text-gray-500 text-sm mb-6">
              Enter your email and we'll send you a reset link
            </p>
            <form onSubmit={handleReset} className="space-y-4">
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
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-500">
              Remember your password?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}