import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | Namo Amituofo",
  description: "Our privacy policy explains how we collect, use, and protect your personal data in accordance with Singapore's Personal Data Protection Act (PDPA).",
}

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="mb-4">
            This Privacy Policy explains how Namo Amituofo ("we", "our", or "us") collects, uses, discloses, and protects your personal data in accordance with the Singapore Personal Data Protection Act 2012 (PDPA). We are committed to ensuring the privacy and security of your personal information while providing you with the best possible service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Personal Data We Collect</h2>
          <p className="mb-4">We may collect the following types of personal data:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Name and contact information (email address, phone number)</li>
            <li>Profile information for your account</li>
            <li>Event registration details</li>
            <li>Information you provide when contacting us</li>
            <li>Technical data (IP address, browser type, device information)</li>
            <li>Usage data about how you interact with our services</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. How We Collect Personal Data</h2>
          <p className="mb-4">We collect personal data through:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Direct interactions when you create an account or register for events</li>
            <li>Automated technologies or interactions (cookies and similar technologies)</li>
            <li>Third parties or publicly available sources</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Purpose of Collection, Use and Disclosure</h2>
          <p className="mb-4">We collect, use and disclose your personal data for the following purposes:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>To provide and maintain our services</li>
            <li>To process and manage event registrations</li>
            <li>To communicate with you about our services</li>
            <li>To improve our services and user experience</li>
            <li>To comply with legal obligations</li>
            <li>To detect and prevent fraud or abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Consent</h2>
          <p className="mb-4">
            By using our services, you consent to the collection, use, and disclosure of your personal data for the purposes set out in this Privacy Policy. You may withdraw your consent at any time by contacting our Data Protection Officer. However, please note that this may affect our ability to provide you with certain services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Protection of Personal Data</h2>
          <p className="mb-4">
            We implement appropriate security measures to protect your personal data against unauthorized access, collection, use, disclosure, copying, modification, disposal, or similar risks. These measures include:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Encryption of data in transit and at rest</li>
            <li>Access controls and authentication measures</li>
            <li>Regular security assessments and updates</li>
            <li>Staff training on data protection</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Retention of Personal Data</h2>
          <p className="mb-4">
            We retain personal data only for as long as necessary to fulfill the purposes for which it was collected, or as required by law. When personal data is no longer needed, it will be securely deleted or anonymized.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Transfer of Personal Data Outside Singapore</h2>
          <p className="mb-4">
            We may transfer your personal data to countries outside Singapore. When we do so, we ensure that the receiving organization provides a standard of protection comparable to the PDPA through appropriate safeguards and contractual obligations.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Your Rights</h2>
          <p className="mb-4">Under the PDPA, you have the right to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Access your personal data in our possession or control</li>
            <li>Request correction of any error or omission in your personal data</li>
            <li>Withdraw your consent for the collection, use, or disclosure of your personal data</li>
            <li>Request information about our personal data protection policies and practices</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Cookies and Similar Technologies</h2>
          <p className="mb-4">
            We use cookies and similar technologies to enhance your experience on our website. You can control cookie settings through your browser preferences. Please note that disabling certain cookies may affect the functionality of our services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Data Protection Officer</h2>
          <p className="mb-4">
            If you have any questions, concerns, or requests regarding your personal data or this Privacy Policy, please contact our Data Protection Officer at:
          </p>
          <p className="mb-4">
            Email: namoamituofo@gmail.com<br />
            Address: 288 Boon Lay Way, Singapore 649565
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Updates to Privacy Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes through our website or other appropriate channels.
          </p>
        </section>

        <section>
          <p className="text-sm text-gray-600 mt-8">
            Last updated: April 29, 2025
          </p>
        </section>
      </div>
    </div>
  )
} 