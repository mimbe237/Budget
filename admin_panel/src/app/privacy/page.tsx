export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-500 mt-2">Budget Pro - Last updated: December 9, 2025</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Data Collection</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Budget Pro collects only the information necessary for the application to function:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Email and password (Firebase authentication)</li>
              <li>WhatsApp number (optional, for support)</li>
              <li>Financial data (transactions, budgets, goals)</li>
              <li>Preferences (language, currency, theme)</li>
            </ul>
            <p className="text-gray-700 mt-4">
              All your financial data is securely stored on Firebase Cloud Firestore.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Data Usage</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your data is used exclusively for:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Providing application features</li>
              <li>Generating personalized reports and analytics</li>
              <li>Synchronizing your data between devices</li>
              <li>Improving user experience</li>
            </ul>
            <p className="text-gray-700 mt-4 font-semibold">
              We never sell your data to third parties.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Budget Pro uses Firebase Authentication and Cloud Firestore to ensure data security:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Secure authentication via Firebase</li>
              <li>Strict Firestore security rules</li>
              <li>Limited access to data (your account only)</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Sharing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your personal data is only shared with:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Firebase (Google Cloud Platform) - secure hosting</li>
              <li>No commercial or advertising third parties</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Budget Pro contains no ads and does not monetize your data.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              In accordance with GDPR, you have the following rights:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Right of access to your data</li>
              <li>Right to rectification</li>
              <li>Right to deletion (from Settings)</li>
              <li>Right to data portability (CSV/PDF export)</li>
              <li>Right to object</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, contact us through the application.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies & Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Budget Pro does not use advertising tracking cookies. The only cookies used are:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Firebase session cookies (authentication)</li>
              <li>Local preferences (language, theme)</li>
            </ul>
            <p className="text-gray-700 mt-4">
              No third-party analytics tracking is implemented.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For any questions about this privacy policy:
            </p>
            <ul className="list-none text-gray-700 space-y-2">
              <li>📧 Email: support@budgetpro.app</li>
              <li>💬 WhatsApp: Available in the app</li>
              <li>🌐 Website: https://www.beonweb.cm</li>
            </ul>
          </section>

          {/* Footer */}
          <div className="border-t pt-8 text-center text-gray-500 text-sm">
            <p>© 2025 BEONWEB. All rights reserved.</p>
            <p className="mt-2">Budget Pro - Intelligent Budget Management</p>
          </div>
        </div>
      </main>
    </div>
  );
}
