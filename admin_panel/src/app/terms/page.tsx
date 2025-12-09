export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-gray-500 mt-2">Budget Pro - Last updated: December 9, 2025</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By using Budget Pro, you accept these terms of service. If you do not agree with these terms, please do not use the application.
            </p>
            <p className="text-gray-700 mt-4">
              Budget Pro is developed and maintained by BEONWEB.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Budget Pro is a personal financial management application offering:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Transaction and account tracking</li>
              <li>Monthly budget management</li>
              <li>Savings goals and progress tracking</li>
              <li>Debt and credit management</li>
              <li>Reports and AI-powered analysis</li>
              <li>Cloud synchronization (Firebase)</li>
            </ul>
            <p className="text-gray-700 mt-4">
              The service is provided "as is" without guarantee of continuous availability.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Creation</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To use Budget Pro, you must:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Be at least 16 years old</li>
              <li>Provide accurate information</li>
              <li>Maintain password confidentiality</li>
              <li>Be responsible for all account activity</li>
            </ul>
            <p className="text-gray-700 mt-4">
              You can also test the application in Demo mode without creating an account.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree NOT to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Use the application for illegal purposes</li>
              <li>Attempt to hack or compromise security</li>
              <li>Create multiple accounts to abuse the system</li>
              <li>Extract or copy content automatically</li>
              <li>Use the application for money laundering</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Any violation may result in account suspension.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Budget Pro and all its content (code, design, logos, texts) are owned by BEONWEB.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Source code is proprietary</li>
              <li>Trademarks and logos are protected</li>
              <li>Unauthorized reproduction is prohibited</li>
            </ul>
            <p className="text-gray-700 mt-4 font-semibold">
              Your financial data belongs to you and remains your property.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              BEONWEB cannot be held responsible for:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Financial losses resulting from application use</li>
              <li>Errors in calculations or projections</li>
              <li>Data loss due to technical issues</li>
              <li>Service interruptions</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Budget Pro is a management tool, not professional financial advice.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You can delete your account at any time from Settings.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              BEONWEB reserves the right to suspend or delete your account in case of:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Violation of these terms</li>
              <li>Illegal activity</li>
              <li>Prolonged inactivity (90+ days)</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              BEONWEB may modify these terms at any time. Changes become effective upon notification. 
              Your continued use of Budget Pro indicates acceptance of the new terms.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed">
              Budget Pro is provided "as is" without warranties. BEONWEB does not guarantee 
              uninterrupted service, error-free operation, or specific results.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For questions about these terms:
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
