export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900">About Budget Pro</h1>
          <p className="text-gray-500 mt-2">Intelligent Budget Management</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">

          {/* Mission */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              Budget Pro empowers individuals to take control of their finances through intelligent, 
              intuitive budget management. We believe everyone deserves access to powerful financial tools 
              that make managing money simple, transparent, and stress-free.
            </p>
          </section>

          {/* Features */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">💳 Account Management</h3>
                <p className="text-gray-700">Track multiple accounts and monitor real-time balances.</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">🎯 Smart Budgeting</h3>
                <p className="text-gray-700">Create and manage monthly budgets with automatic tracking.</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">📊 AI Analytics</h3>
                <p className="text-gray-700">Get intelligent insights and spending recommendations.</p>
              </div>
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">🏆 Goals Tracking</h3>
                <p className="text-gray-700">Set and track savings goals with visual progress indicators.</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">💰 Debt Management</h3>
                <p className="text-gray-700">Track debts and credits with flexible management options.</p>
              </div>
              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">☁️ Cloud Sync</h3>
                <p className="text-gray-700">Seamlessly sync data across all your devices securely.</p>
              </div>
            </div>
          </section>

          {/* Technology */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Built with Modern Technology</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Budget Pro leverages the latest technologies to provide a secure, fast, and reliable experience:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Flutter:</strong> Cross-platform mobile app (iOS, Android, Web)</li>
              <li><strong>Firebase:</strong> Secure cloud infrastructure with real-time database</li>
              <li><strong>Machine Learning:</strong> AI-powered spending analysis and predictions</li>
              <li><strong>Next.js:</strong> Modern web administration panel</li>
            </ul>
          </section>

          {/* Security & Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Security & Privacy First</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your financial data is sensitive, and we treat it with the utmost care:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>End-to-end encryption for all sensitive data</li>
              <li>Firebase Authentication with industry-standard security</li>
              <li>GDPR compliant with full data privacy controls</li>
              <li>No ads, no tracking, no data selling</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          {/* Development Team */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About BEONWEB</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Budget Pro is developed by <strong>BEONWEB</strong>, a forward-thinking software development company 
              committed to creating innovative, user-centric solutions for personal finance management.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We combine cutting-edge technology with thoughtful design to deliver applications that 
              empower users to make better financial decisions.
            </p>
          </section>

          {/* Supported Languages */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Global Reach</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Budget Pro is available in multiple languages:
            </p>
            <div className="flex gap-4 flex-wrap">
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium">🇫🇷 Français</span>
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium">🇬🇧 English</span>
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium">🌍 More coming</span>
            </div>
          </section>

          {/* Support */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Support & Feedback</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We're here to help! Have questions or suggestions? Reach out to us:
            </p>
            <ul className="list-none text-gray-700 space-y-2">
              <li>📧 <strong>Email:</strong> support@budgetpro.app</li>
              <li>💬 <strong>WhatsApp:</strong> Available in the app</li>
              <li>🌐 <strong>Website:</strong> https://www.beonweb.cm</li>
            </ul>
          </section>

          {/* Version & Update */}
          <section className="bg-blue-50 p-6 rounded-lg">
            <p className="text-gray-700">
              <strong>Current Version:</strong> 1.0.0 (Release)<br />
              <strong>Last Updated:</strong> December 9, 2025<br />
              <strong>Platform Support:</strong> iOS, Android, Web
            </p>
          </section>

          {/* Footer */}
          <div className="border-t pt-8 text-center text-gray-500 text-sm">
            <p>© 2025 BEONWEB. All rights reserved.</p>
            <p className="mt-2">Budget Pro - Intelligent Budget Management</p>
            <div className="mt-4 space-x-4">
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy</a>
              <span>•</span>
              <a href="/terms" className="text-blue-600 hover:underline">Terms</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
