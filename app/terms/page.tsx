import { Header } from "@/components/header";
import Footer from "@/components/footer";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service - Low Noise",
  description: "Terms of service for Low Noise newsletter platform",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white border border-slate-200 rounded-lg p-8 md:p-12 shadow-sm">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Terms of Service</h1>
          <p className="text-slate-600 mb-8">Last updated: January 27, 2026</p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                By accessing and using Low Noise (&quot;the Service&quot;), you accept and agree to be bound by these 
                Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                The Service is provided by Low Noise, available at{" "}
                <Link href="/" className="text-blue-400 hover:underline">lownoise.thisisrohit.dev</Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Description of Service</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Low Noise is a newsletter platform that allows users to:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Subscribe to and receive curated AI and technology news</li>
                <li>Create accounts using Google or GitHub authentication</li>
                <li>Read published newsletters and articles</li>
                <li>Manage subscription preferences</li>
                <li>Access archived newsletter content</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mb-4">
                Authorized administrators can create, edit, and publish newsletter content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. User Accounts</h2>
              
              <h3 className="text-xl font-semibold text-slate-900 mb-3">3.1 Account Creation</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                To access certain features, you must create an account by authenticating through:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Google OAuth authentication, or</li>
                <li>GitHub OAuth authentication</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3">3.2 Account Security</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Maintaining the security of your authentication credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3">3.3 Account Termination</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                We reserve the right to suspend or terminate your account if:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>You violate these Terms</li>
                <li>Your account is inactive for more than 2 years</li>
                <li>We detect fraudulent, abusive, or illegal activity</li>
                <li>We discontinue the Service (with reasonable notice)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Newsletter Subscriptions</h2>
              
              <h3 className="text-xl font-semibold text-slate-900 mb-3">4.1 Subscription</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                By subscribing to our newsletter, you consent to receive:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Regular newsletter updates with curated content</li>
                <li>Welcome emails upon subscription</li>
                <li>Important service announcements</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3">4.2 Unsubscribing</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                You may unsubscribe at any time by:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Clicking the unsubscribe link in any newsletter email</li>
                <li>Managing your subscription preferences in your account settings</li>
                <li>Contacting us directly at <a href="mailto:rohitkhatri.dev@gmail.com" className="text-blue-400 hover:underline">rohitkhatri.dev@gmail.com</a></li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Acceptable Use</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                You agree NOT to:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                <li>Attempt to gain unauthorized access to our systems or user accounts</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated systems (bots, scrapers) without permission</li>
                <li>Transmit spam, viruses, malware, or harmful code</li>
                <li>Impersonate another person or entity</li>
                <li>Collect or harvest personal information from other users</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Use the Service to send unsolicited commercial communications</li>
                <li>Abuse rate limits or attempt to overload our infrastructure</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold text-slate-900 mb-3">6.1 Our Content</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                All content, features, and functionality of the Service, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Text, graphics, logos, and images</li>
                <li>Software, code, and design</li>
                <li>Newsletter content and articles</li>
                <li>Trademarks and branding</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mb-4">
                are owned by Low Noise and protected by copyright, trademark, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 mb-3">6.2 User Content</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                By providing content to the Service (e.g., comments, feedback), you grant us a non-exclusive, 
                worldwide, royalty-free license to use, modify, and display such content in connection with 
                operating the Service.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 mb-3">6.3 Third-Party Content</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Newsletter content may include curated information and summaries from third-party sources. 
                We respect intellectual property rights and provide attribution where applicable.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Privacy</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Your privacy is important to us. Please review our{" "}
                <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link> to 
                understand how we collect, use, and protect your personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Disclaimers</h2>
              
              <h3 className="text-xl font-semibold text-slate-900 mb-3">8.1 &quot;As Is&quot; Basis</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, 
                either express or implied, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Warranties of merchantability or fitness for a particular purpose</li>
                <li>Warranties that the Service will be uninterrupted or error-free</li>
                <li>Warranties regarding the accuracy or reliability of content</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3">8.2 Content Accuracy</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                While we strive to provide accurate and up-to-date information, we do not guarantee the 
                accuracy, completeness, or timeliness of any content. Newsletter content is for informational 
                purposes only and should not be considered professional advice.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 mb-3">8.3 Third-Party Services</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                We use third-party services (Firebase, GitHub, Google, Cloudflare) for authentication, hosting, 
                and delivery. We are not responsible for the availability, security, or performance of these 
                third-party services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOW NOISE AND ITS AFFILIATES SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, data, or goodwill</li>
                <li>Service interruptions or delays</li>
                <li>Unauthorized access to or alteration of your data</li>
                <li>Actions of third parties</li>
                <li>Any other damages relating to your use of the Service</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mb-4">
                Our total liability shall not exceed the amount you paid to us (if any) in the past 12 months.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Indemnification</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                You agree to indemnify, defend, and hold harmless Low Noise and its officers, directors, 
                employees, and agents from any claims, liabilities, damages, losses, and expenses (including 
                legal fees) arising out of or related to:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Your use or misuse of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Your content or conduct</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Changes to Service</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We reserve the right to:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Modify or discontinue the Service (or any part) at any time</li>
                <li>Change features, functionality, or availability</li>
                <li>Update or change these Terms with or without notice</li>
                <li>Impose usage limits or restrictions</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mb-4">
                We will make reasonable efforts to notify users of significant changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Changes to Terms</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We may revise these Terms at any time. The most current version will always be available on 
                this page with the &quot;Last updated&quot; date. Material changes will be communicated via:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Email notification to subscribers</li>
                <li>Prominent notice on the website</li>
                <li>In-app notification (if applicable)</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mb-4">
                Your continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">13. Governing Law</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of India, 
                without regard to conflict of law principles. Any disputes arising from these Terms or 
                your use of the Service shall be subject to the exclusive jurisdiction of the courts 
                located in India.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">14. Dispute Resolution</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Before filing a formal claim, you agree to contact us to attempt to resolve any dispute 
                informally by emailing <a href="mailto:rohitkhatri.dev@gmail.com" className="text-blue-400 hover:underline">rohitkhatri.dev@gmail.com</a>. 
                We will work in good faith to resolve the matter.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">15. Severability</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                If any provision of these Terms is found to be invalid or unenforceable, the remaining 
                provisions will continue in full force and effect. The invalid provision will be modified 
                to the minimum extent necessary to make it valid and enforceable.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">16. Entire Agreement</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                These Terms, along with our Privacy Policy, constitute the entire agreement between you 
                and Low Noise regarding the Service and supersede any prior agreements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">17. Contact Information</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                <p className="text-slate-600"><strong>Email:</strong> <a href="mailto:rohitkhatri.dev@gmail.com" className="text-blue-400 hover:underline">rohitkhatri.dev@gmail.com</a></p>
                <p className="text-slate-600"><strong>Website:</strong> <a href="https://lownoise.thisisrohit.dev" className="text-blue-400 hover:underline">https://lownoise.thisisrohit.dev</a></p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">18. Acknowledgment</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                BY USING LOW NOISE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND 
                BY THESE TERMS OF SERVICE.
              </p>
            </section>

            <div className="border-t border-slate-200 pt-8 mt-8">
              <p className="text-slate-600 text-sm">
                Thank you for using Low Noise. We&apos;re committed to providing you with a great newsletter experience.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
