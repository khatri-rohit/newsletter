import { Header } from "@/components/header";
import Footer from "@/components/footer";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - Low Noise",
  description: "Privacy policy for Low Noise newsletter platform",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white border border-slate-200 rounded-lg p-8 md:p-12 shadow-sm">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-slate-600 mb-8">Last updated: January 27, 2026</p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Introduction</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Welcome to Low Noise. We respect your privacy and are committed to protecting your personal data. 
                This privacy policy explains how we collect, use, and safeguard your information when you use our 
                newsletter platform at <Link href="/" className="text-blue-400 hover:underline">lownoise.thisisrohit.dev</Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-slate-900 mb-3">2.1 Account Information</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                When you sign up using Google or GitHub authentication, we collect:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Your name</li>
                <li>Email address</li>
                <li>Profile picture (if provided by your authentication provider)</li>
                <li>Unique user identifier</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3">2.2 Newsletter Subscription</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                When you subscribe to our newsletter, we collect:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Email address</li>
                <li>Subscription preferences</li>
                <li>Subscription status (active/inactive)</li>
                <li>Subscription and unsubscription timestamps</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3">2.3 Usage Data</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                We automatically collect certain information when you use our service:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Email delivery status (sent, delivered, opened, clicked, bounced)</li>
                <li>Newsletter reading timestamps</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>IP address (for security purposes)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We use your personal data for the following purposes:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>To provide and maintain our newsletter service</li>
                <li>To send you newsletters you&apos;ve subscribed to</li>
                <li>To notify you about important updates or changes to our service</li>
                <li>To respond to your inquiries and support requests</li>
                <li>To improve our service and user experience</li>
                <li>To detect, prevent, and address technical issues or fraud</li>
                <li>To analyze usage patterns and optimize content delivery</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Data Storage and Security</h2>
              
              <h3 className="text-xl font-semibold text-slate-900 mb-3">4.1 Storage</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Your data is securely stored using:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li><strong>Firebase Firestore:</strong> For user accounts and newsletter data</li>
                <li><strong>Firebase Authentication:</strong> For secure login credentials</li>
                <li><strong>Cloudflare R2:</strong> For uploaded images and media files</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3">4.2 Security Measures</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                We implement industry-standard security measures:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>HTTPS encryption for all data transmission</li>
                <li>OAuth 2.0 authentication via Google and GitHub</li>
                <li>Firebase Admin SDK for secure server-side operations</li>
                <li>Rate limiting to prevent abuse</li>
                <li>Regular security audits and updates</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Email Communications</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We will send you emails for:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Newsletter content (if you&apos;re subscribed)</li>
                <li>Welcome messages when you create an account</li>
                <li>Account security notifications</li>
                <li>Service updates and important announcements</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mb-4">
                You can unsubscribe from newsletters at any time by clicking the unsubscribe link in any email 
                or through your account settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Third-Party Services</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We use the following third-party services:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li><strong>Google Firebase:</strong> Authentication and database services</li>
                <li><strong>Google OAuth:</strong> Sign-in with Google</li>
                <li><strong>GitHub OAuth:</strong> Sign-in with GitHub</li>
                <li><strong>Cloudflare R2:</strong> File storage and CDN</li>
                <li><strong>Gmail SMTP:</strong> Email delivery service</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mb-4">
                These services have their own privacy policies governing their use of your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Your Rights</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct your personal information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                <li><strong>Data Portability:</strong> Request your data in a machine-readable format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from newsletters at any time</li>
                <li><strong>Objection:</strong> Object to processing of your personal data</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mb-4">
                To exercise these rights, please contact us at: <a href="mailto:rohitkhatri.dev@gmail.com" className="text-blue-400 hover:underline">rohitkhatri.dev@gmail.com</a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Data Retention</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We retain your personal data only for as long as necessary:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Account data: Until you delete your account</li>
                <li>Newsletter subscriptions: Until you unsubscribe</li>
                <li>Email delivery logs: 90 days for analytics and troubleshooting</li>
                <li>Inactive accounts: May be deleted after 2 years of inactivity</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Cookies and Tracking</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We use essential cookies and local storage to:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Maintain your login session</li>
                <li>Remember your authentication token</li>
                <li>Store your preferences</li>
                <li>Improve site performance and user experience</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mb-4">
                We do not use third-party tracking or advertising cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Children&apos;s Privacy</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Our service is not intended for users under the age of 13. We do not knowingly collect 
                personal information from children under 13. If you believe we have collected such information, 
                please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. International Data Transfers</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Your data may be transferred to and processed in countries other than your own. We ensure 
                appropriate safeguards are in place to protect your data in accordance with this privacy policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Changes to This Policy</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We may update this privacy policy from time to time. We will notify you of any significant 
                changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. 
                We encourage you to review this policy periodically.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">13. Contact Us</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                If you have any questions about this privacy policy or our data practices, please contact us:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                <p className="text-slate-600"><strong>Email:</strong> <a href="mailto:rohitkhatri.dev@gmail.com" className="text-blue-400 hover:underline">rohitkhatri.dev@gmail.com</a></p>
                <p className="text-slate-600"><strong>Website:</strong> <a href="https://lownoise.thisisrohit.dev" className="text-blue-400 hover:underline">https://lownoise.thisisrohit.dev</a></p>
              </div>
            </section>

            <div className="border-t border-slate-200 pt-8 mt-8">
              <p className="text-slate-600 text-sm">
                By using Low Noise, you acknowledge that you have read and understood this Privacy Policy 
                and agree to its terms.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
