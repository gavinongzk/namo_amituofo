import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | 隐私政策 | Namo Amituofo",
  description: "Our simplified privacy policy on how we collect, use, and protect your personal data under Singapore's PDPA. 我们简化的隐私政策，说明我们如何根据新加坡PDPA收集、使用和保护您的个人数据。",
}

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Chinese Version */}
      <section className="mb-16">
        <h1 className="text-3xl font-bold mb-8">隐私政策</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. 简介</h2>
            <p>
            净土宗弥陀寺(新加坡)（“我们”）致力于保护您的个人数据。本政策概述了我们如何根据新加坡2012年《个人数据保护法》（PDPA）收集、使用和保护您的信息。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. 我们收集的数据</h2>
            <p>我们可能收集您的：</p>
            <ul className="list-disc pl-6 mt-2">
              <li>姓名和联系方式（如电话号码， 邮区编号）。</li>
              <li>活动报名信息。</li>
              <li>您提供的任何其他信息（如咨询或反馈）。</li>
              <li>技术和使用数据（如IP地址、浏览活动）。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. 为何收集您的数据</h2>
            <p>我们使用您的数据以便：</p>
            <ul className="list-disc pl-6 mt-2">
              <li>提供和管理我们的服务及活动</li>
              <li>与您沟通，回应您的请求</li>
              <li>改进我们的服务</li>
              <li>遵守法律义务</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. 同意</h2>
            <p>
              使用我们的服务即表示您同意本政策。您可以随时联系我们的数据保护官撤回同意，但这可能影响我们提供服务。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. 数据保护与保留</h2>
            <p>
              我们采取合理的安全措施保护您的数据。我们仅在为实现收集目的或法律要求所需的时间内保留您的数据。
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-3">6. 数据转移</h2>
            <p>
              我们可能会将您的数据转移到新加坡境外，并确保数据受到与PDPA相当标准的保护。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. 您的权利</h2>
            <p>您有权访问、更正您的个人数据，或撤回同意。请联系我们的数据保护官以行使您的权利。</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Cookies</h2>
            <p>
              我们使用cookies来改善网站体验。您可以通过浏览器设置管理cookies。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. 联系我们 / 数据保护官</h2>
            <p>
              如有任何疑问，请联系我们的数据保护官：<br />
              电邮：namo.amituofo.org@gmail.com<br />
              地址：No. 27, Lor 27, Geylang, Singapore 388163
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. 政策更新</h2>
            <p>
              我们可能会更新本政策。任何重大变更将通过我们的网站通知。
            </p>
          </section>

          <section>
            <div className="text-sm text-gray-600 mt-6">
              <p>最后更新日期：2025年5月12日</p>
            </div>
          </section>
        </div>
      </section>

      {/* Page Break */}
      <hr className="border-t-2 border-gray-300 my-16" />

      {/* English Version */}
      <section>
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
            <p>
              Namo Amituofo Organization Ltd. (&quot;we&quot;, &quot;us&quot;) is committed to protecting your personal data. This policy outlines how we collect, use, and safeguard your information in accordance with Singapore&apos;s Personal Data Protection Act 2012 (PDPA).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Data We Collect</h2>
            <p>We may collect your:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Name and contact details (e.g., phone number, postal code).</li>
              <li>Event registration information.</li>
              <li>Any other information you provide (e.g., inquiries or feedback).</li>
              <li>Technical and usage data (e.g., IP address, browsing activity).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Why We Collect Your Data</h2>
            <p>We use your data to:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Provide and manage our services and events.</li>
              <li>Communicate with you and respond to your requests.</li>
              <li>Improve our services.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Consent</h2>
            <p>
              By using our services, you agree to this policy. You can withdraw consent anytime by contacting our Data Protection Officer, though this may affect service provision.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Data Protection & Retention</h2>
            <p>
              We take reasonable security measures to protect your data. We retain your data only as long as necessary for the purposes it was collected or as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Data Transfer</h2>
            <p>
              We may transfer your data outside Singapore, ensuring it is protected to a standard comparable to the PDPA.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Your Rights</h2>
            <p>You have the right to access, correct your personal data, or withdraw consent. Contact our Data Protection Officer to exercise your rights.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Cookies</h2>
            <p>
              We use cookies to improve website experience. You can manage cookies via your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Contact Us / Data Protection Officer</h2>
            <p>
              For any queries, please contact our Data Protection Officer:<br />
              Email: namo.amituofo.org@gmail.com<br />
              Address: No. 27, Lor 27, Geylang, Singapore 388163
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Policy Updates</h2>
            <p>
              We may update this policy. Material changes will be notified via our website.
            </p>
          </section>

          <section>
            <div className="text-sm text-gray-600 mt-6">
              <p>Last updated: May 12, 2025</p>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}