import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useState, useEffect } from 'react'
import axios from 'axios'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Revenue from './pages/Revenue'
import Settings from './pages/Settings'
import ForgotPassword from './pages/ForgotPassword'
import MemberProfile from './pages/MemberProfile'
import AdminPanel from './pages/AdminPanel'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import PlanBanner from './components/PlanBanner'
import ExpiredWall from './components/ExpiredWall'
import { usePlanStatus } from './hooks/usePlanStatus'
import { Toaster } from 'react-hot-toast'
import ExpiringMembers from './pages/ExpiringMembers'
import ExpiredMembers from './pages/ExpiredMembers'
import DueMembers from './pages/DueMembers'


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

function PlanGuard({ children }) {
  const { isExpired, loading } = usePlanStatus()
  if (loading) return null
  if (isExpired) return <ExpiredWall />
  return children
}

function DesktopSidebar() {
  const { currentUser, logout } = useAuth()
  const location = useLocation()
  const isAdmin = currentUser?.email === 'vnitin398@gmail.com'
  const [gymName, setGymName] = useState('GYMmitra')

  useEffect(() => {
    async function fetchGymName() {
      if (!currentUser) return
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/owner/${currentUser.uid}`)
        if (res.data.propertyName) setGymName(res.data.propertyName)
      } catch (err) {
        console.log(err)
      }
    }
    fetchGymName()
  }, [currentUser])

  const links = [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/members', icon: '💪', label: 'Members' },
    { to: '/revenue', icon: '💰', label: 'Revenue' },
    { to: '/settings', icon: '⚙️', label: 'Settings' },
    ...(isAdmin ? [{ to: '/admin', icon: '🛡️', label: 'Admin' }] : []),
  ]

  return (
    <div className="hidden md:flex fixed top-0 left-0 h-full w-60 flex-col z-50"
      style={{ background: 'linear-gradient(180deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%)' }}>
      <div className="p-5 border-b border-blue-400 border-opacity-30">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💪</span>
          <div>
            <h1 className="text-sm font-bold text-white truncate max-w-36">{gymName}</h1>
            <p className="text-xs text-blue-200 truncate max-w-36">{currentUser?.email}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              location.pathname === link.to
                ? 'bg-white bg-opacity-20 text-white'
                : 'text-blue-100 hover:bg-white hover:bg-opacity-10 hover:text-white'
            }`}
          >
            <span className="text-base">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-blue-400 border-opacity-30">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-200 hover:bg-white hover:bg-opacity-10 hover:text-white transition"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  )
}

function MobileBottomNav() {
  const { currentUser } = useAuth()
  const location = useLocation()
  const isAdmin = currentUser?.email === 'vnitin398@gmail.com'

  const tabs = [
    { to: '/dashboard', icon: '📊', label: 'Home' },
    { to: '/members', icon: '💪', label: 'Members' },
    { to: '/revenue', icon: '💰', label: 'Revenue' },
    { to: '/settings', icon: '⚙️', label: 'Settings' },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around px-1 py-1">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.to
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all min-w-0 flex-1 ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <span className={`text-xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </span>
              <span className={`text-xs font-medium truncate ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {isActive && <div className="w-1 h-1 bg-blue-600 rounded-full"></div>}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function MobileTopBar() {
  const { currentUser } = useAuth()
  const location = useLocation()
  const [gymName, setGymName] = useState('GYMmitra')

  useEffect(() => {
    async function fetchGymName() {
      if (!currentUser) return
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/owner/${currentUser.uid}`)
        if (res.data.propertyName) setGymName(res.data.propertyName)
      } catch (err) {
        console.log(err)
      }
    }
    fetchGymName()
  }, [currentUser])

  const titles = {
    '/dashboard': 'Dashboard',
    '/members': 'Members',
    '/revenue': 'Revenue',
    '/settings': 'Settings',
    '/admin': 'Admin Panel',
  }

  const title = titles[location.pathname] || gymName

  return (
    <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <span className="text-lg">💪</span>
        <span className="text-sm font-bold text-blue-600">{title}</span>
      </div>
      <p className="text-xs text-gray-400 truncate max-w-32">{gymName}</p>
    </div>
  )
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <MobileTopBar />
      <DesktopSidebar />
      <MobileBottomNav />
      <div className="md:ml-60 min-h-screen">
        <PlanBanner />
        {children}
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" />
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/dashboard" element={<ProtectedRoute><PlanGuard><Layout><Dashboard /></Layout></PlanGuard></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><PlanGuard><Layout><Members /></Layout></PlanGuard></ProtectedRoute>} />
          <Route path="/member/:id" element={<ProtectedRoute><PlanGuard><Layout><MemberProfile /></Layout></PlanGuard></ProtectedRoute>} />
          <Route path="/revenue" element={<ProtectedRoute><PlanGuard><Layout><Revenue /></Layout></PlanGuard></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><PlanGuard><Layout><Settings /></Layout></PlanGuard></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Layout><AdminPanel /></Layout></ProtectedRoute>} />
          <Route path="/expiring-members" element={<ProtectedRoute><PlanGuard><Layout><ExpiringMembers /></Layout></PlanGuard></ProtectedRoute>} />
          <Route path="/expired-members" element={<ProtectedRoute><PlanGuard><Layout><ExpiredMembers /></Layout></PlanGuard></ProtectedRoute>} />
          <Route path="/due-members" element={<ProtectedRoute><PlanGuard><Layout><DueMembers /></Layout></PlanGuard></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App