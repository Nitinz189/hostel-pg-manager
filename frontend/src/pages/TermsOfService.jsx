import { Link } from 'react-router-dom'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 p-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">💪</span>
          <h1 className="text-xl font-bold text-blue-600">Smart Gym Management</h1>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Terms of Service</h2>
        <p className="text-xs text-gray-400 mb-6">Last updated: May 2026</p>

        <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
          <section>
            <h3 className="font-semibold text-gray-800 mb-2">1. What is SGM</h3>
            <p>GYMmitra is a gym membership management software designed to help gym owners in India track their members, manage memberships, and communicate with members. By signing up and using GYMmitra, you agree to these terms.</p>
          </section>
          <section>
            <h3 className="font-semibold text-gray-800 mb-2">2. Your Account</h3>
            <p>Each gym owner gets one account. You are responsible for keeping your login credentials secure. You are responsible for all activity that happens under your account. GYMmitra reserves the right to suspend or terminate accounts that violate these terms.</p>
          </section>
          <section>
            <h3 className="font-semibold text-gray-800 mb-2">3. Subscription and Payment</h3>
            <p>SGM is a subscription-based service. Your subscription must be renewed before the expiry date to maintain full access. Payments are collected manually via UPI. Subscription fees are non-refundable once the plan is activated. GYMmitra reserves the right to change pricing with prior notice.</p>
          </section>
          <section>
            <h3 className="font-semibold text-gray-800 mb-2">4. Your Data</h3>
            <p>You own the data you enter into SGM — your gym member names, mobile numbers, and membership details. SGM stores this data to provide the service. We do not sell, share, or use your member data for any purpose other than running the app. You can request deletion of your account and all associated data at any time.</p>
          </section>
          <section>
            <h3 className="font-semibold text-gray-800 mb-2">5. WhatsApp Messages</h3>
            <p>SGM generates reminder message text that you send to your members using your own WhatsApp account. SGM does not send WhatsApp messages on your behalf. You are responsible for how you communicate with your members.</p>
          </section>
          <section>
            <h3 className="font-semibold text-gray-800 mb-2">6. Limitation of Liability</h3>
            <p>SGM is a tool to help you manage your gym. We are not responsible for any business decisions you make using information from this app. We are not liable for any loss of revenue, loss of data, or business disruption caused by technical issues. We will make reasonable efforts to keep the service running but cannot guarantee 100% uptime.</p>
          </section>
          <section>
            <h3 className="font-semibold text-gray-800 mb-2">7. Changes to Terms</h3>
            <p>We may update these terms from time to time. We will notify you of significant changes through the app. Continued use of Smart Gym Management after changes means you accept the updated terms.</p>
          </section>
          <section>
            <h3 className="font-semibold text-gray-800 mb-2">8. Contact</h3>
            <p>For any questions about these terms, contact us through the Smart Gym Management app or reach out to the admin directly.</p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
          <Link to="/login" className="text-sm text-blue-600 hover:underline">Back to Login</Link>
          <Link to="/privacy" className="text-sm text-blue-600 hover:underline">Privacy Policy</Link>
        </div>
      </div>
    </div>
  )
}