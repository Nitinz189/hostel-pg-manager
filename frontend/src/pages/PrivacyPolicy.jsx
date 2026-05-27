import { Link } from 'react-router-dom'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 p-8">
        <div className="flex items-center gap-2 mb-6">
          <img src="/gym.png" alt="logo" className="w-7 h-7 object-contain" />
          <h1 className="text-xl font-bold text-blue-600">GYMmitra</h1>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Privacy Policy</h2>
        <p className="text-xs text-gray-400 mb-6">Last updated: May 2026</p>

        <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
          <section>
            <h3 className="font-semibold text-gray-800 mb-2">1. What data we collect</h3>
            <p>When you sign up as a gym owner we collect your name, gym name, email address, mobile number, and city. When you add gym members we store their name, mobile number, registration number, membership type, and payment records. We do not collect payment card details or sensitive financial information.</p>
          </section>
          <section>
            <h3 className="font-semibold text-gray-800 mb-2">2. How we use your data</h3>
            <p>We use your data solely to provide the GYMmitra service — to show you your member list, track memberships, and generate reports. We do not use your data for advertising. We do not sell your data to third parties. We do not share your data with anyone except the services listed below that are required to run the app.</p>
          </section>
          <section>
            <h3 className="font-semibold text-gray-800 mb-2">3. Third party services we use</h3>
            <p>GYMmitra uses the following trusted services to operate. Firebase Authentication by Google handles your login security. MongoDB Atlas stores your data on secure servers. These services have their own privacy policies and security certifications. Your data is stored in India or Asia-Pacific region servers where available.</p>
          </section>
          <section>
            <h3 className="font-semibold text-gray-800 mb-2">4. WhatsApp and messaging</h3>
            <p>GYMmitra only generates message text for you to send. All WhatsApp messages are sent from your personal WhatsApp account. We do not have access to your WhatsApp contacts or messages. Your members' mobile numbers are only used within your GYMmitra account.</p>
          </section>
          <section>
            <h3 className="font-semibold text-gray-800 mb-2">5. Data security</h3>
            <p>We take reasonable measures to protect your data. All data is transmitted over HTTPS encrypted connections. Access to your data is protected by Firebase Authentication. We do not store your password — Firebase handles authentication securely. However no system is 100% secure and we cannot guarantee absolute security.</p>
          </section>
          <section>
            <h3 className="font-semibold text-gray-800 mb-2">6. Your rights</h3>
            <p>You can request deletion of your GYMmitra account and all associated data at any time by contacting the admin. You can export your member data using the Export CSV feature in the Members page. You can update your profile information at any time from the Settings page.</p>
          </section>
          <section>
            <h3 className="font-semibold text-gray-800 mb-2">7. Your gym members' data</h3>
            <p>As a gym owner using GYMmitra, you are responsible for having proper consent from your gym members to store their contact information. You should inform your members that their data is stored digitally for membership management purposes.</p>
          </section>
          <section>
            <h3 className="font-semibold text-gray-800 mb-2">8. Changes to this policy</h3>
            <p>We may update this privacy policy as the service evolves. We will notify you of significant changes through the app. The date at the top of this page shows when it was last updated.</p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
          <Link to="/login" className="text-sm text-blue-600 hover:underline">Back to Login</Link>
          <Link to="/terms" className="text-sm text-blue-600 hover:underline">Terms of Service</Link>
        </div>
      </div>
    </div>
  )
}