import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Tenants from './pages/Tenants'
import Payments from './pages/Payments'
import Settings from './pages/Settings'
import { Toaster } from 'react-hot-toast'

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth()
  return currentUser ? children : <Navigate to="/login" />
}

function Layout({ children }) {
  const { currentUser, logout } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-56 bg-white border-r border-gray-100 fixed h-full flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <h1 className="text-base font-semibold text-blue-600">🏠 PG Manager</h1>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{currentUser?.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition">
            📊 Dashboard
          </Link>
          <Link to="/tenants" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition">
            👥 Tenants
          </Link>
          <Link to="/payments" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition">
            💳 Payments
          </Link>
          <Link to="/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition">
            ⚙️ Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full text-sm text-red-500 hover:text-red-600 py-2 rounded-lg hover:bg-red-50 transition"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="ml-56 flex-1">
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
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/tenants" element={
  <ProtectedRoute>
    <Layout>
      <Tenants />
    </Layout>
  </ProtectedRoute>
} />
<Route path="/payments" element={
  <ProtectedRoute>
    <Layout>
      <Payments />
    </Layout>
  </ProtectedRoute>
} />
<Route path="/settings" element={
  <ProtectedRoute>
    <Layout>
      <Settings />
    </Layout>
  </ProtectedRoute>
} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App