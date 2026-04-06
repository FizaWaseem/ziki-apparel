import Layout from '@/components/Layout'
import Head from 'next/head'

export default function PrivacyPolicyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Ziki Apparel</title>
        <meta name="description" content="Read Ziki Apparel's Privacy Policy. Learn how we collect, use, and protect your personal information and data." />
        <meta name="keywords" content="privacy policy, data protection, personal information" />
      </Head>
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="text-sm text-gray-500 mb-6">
                  Last updated: October 9, 2025
                </p>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
                  <p className="mb-4">
                    We collect information you provide directly to us, such as when you create an account,
                    make a purchase, or contact us for support.
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-2">
                    <li>Personal information (name, email address, phone number)</li>
                    <li>Billing and shipping addresses</li>
                    <li>Payment information (processed securely through our payment providers)</li>
                    <li>Order history and preferences</li>
                    <li>Communications with our customer service team</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
                  <p className="mb-4">
                    We use the information we collect to:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-2">
                    <li>Process and fulfill your orders</li>
                    <li>Send order confirmations and shipping updates</li>
                    <li>Provide customer support</li>
                    <li>Improve our products and services</li>
                    <li>Send promotional communications (with your consent)</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
                  <p className="mb-4">
                    We do not sell, trade, or otherwise transfer your personal information to third parties
                    except in the following circumstances:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-2">
                    <li>With service providers who assist us in operating our website and business</li>
                    <li>With payment processors to handle transactions securely</li>
                    <li>With shipping companies to deliver your orders</li>
                    <li>When required by law or to protect our rights</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
                  <p className="mb-4">
                    We implement appropriate security measures to protect your personal information against
                    unauthorized access, alteration, disclosure, or destruction. This includes:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-2">
                    <li>SSL encryption for data transmission</li>
                    <li>Secure payment processing</li>
                    <li>Regular security audits</li>
                    <li>Access controls and authentication</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cookies and Tracking</h2>
                  <p className="mb-4">
                    We use cookies and similar tracking technologies to enhance your browsing experience,
                    analyze site traffic, and personalize content. You can control cookie settings through
                    your browser preferences.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
                  <p className="mb-4">
                    You have the right to:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-2">
                    <li>Access and update your personal information</li>
                    <li>Request deletion of your personal information</li>
                    <li>Opt out of promotional communications</li>
                    <li>Request a copy of your data</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Children&apos;s Privacy</h2>
                  <p className="mb-4">
                    Our service is not directed to children under 13 years of age. We do not knowingly
                    collect personal information from children under 13.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Changes to This Policy</h2>
                  <p className="mb-4">
                    We may update this privacy policy from time to time. We will notify you of any changes
                    by posting the new policy on this page with an updated effective date.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Us</h2>
                  <p className="mb-4">
                    If you have any questions about this privacy policy or our data practices, please contact us:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="mb-2"><strong>Email:</strong> privacy@zikiapparel.com</p>
                    <p className="mb-2"><strong>Phone:</strong> +1 (555) 123-4567</p>
                    <p><strong>Address:</strong> 123 Fashion Street, Style City, SC 12345</p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}