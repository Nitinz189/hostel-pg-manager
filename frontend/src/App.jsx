import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useState } from 'react'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Tenants from './pages/Tenants'
import Payments from './pages/Payments'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import ForgotPassword from './pages/ForgotPassword'
import TenantProfile from './pages/TenantProfile'
import AdminPanel from './pages/AdminPanel'
import { Toaster } from 'react-hot-toast'

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  )
  return currentUser ? children : <Navigate to="/login" />
}

function Sidebar({ menuOpen, setMenuOpen }) {
  const { currentUser, logout } = useAuth()
  const location = useLocation()

  const isAdmin = currentUser?.email === 'vnitin398@gmail.com'

const links = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/tenants', icon: '👥', label: 'Tenants' },
  { to: '/payments', icon: '💳', label: 'Payments' },
  { to: '/notifications', icon: '🔔', label: 'Notifications' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
  ...(isAdmin ? [{ to: '/admin', icon: '🛡️', label: 'Admin' }] : []),
]

  return (
    <>
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className={`
        fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-100 z-50
        flex flex-col transition-transform duration-300
        ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <div>
              <h1 className="text-sm font-semibold text-blue-600">PG Manager</h1>
              <p className="text-xs text-gray-400 truncate max-w-36">{currentUser?.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                location.pathname === link.to
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  )
}

function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏠</span>
          <span className="text-sm font-semibold text-blue-600">PG Manager</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-600 text-xl p-1">
          ☰
        </button>
      </div>
      <Sidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="md:ml-60 min-h-screen">
        {children}
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/tenants" element={<ProtectedRoute><Layout><Tenants /></Layout></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><Layout><Payments /></Layout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />


          <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/tenant/:id" element={<ProtectedRoute><Layout><TenantProfile /></Layout></ProtectedRoute>} />
<Route path="/admin" element={<ProtectedRoute><Layout><AdminPanel /></Layout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App