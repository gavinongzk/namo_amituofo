import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | 隐私政策 | Namo Amituofo",
  description: "Our privacy policy explains how we collect, use, and protect your personal data in accordance with Singapore's Personal Data Protection Act (PDPA). 我们的隐私政策解释了我们如何根据新加坡的个人数据保护法收集、使用和保护您的个人数据。",
}

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy <span className="text-gray-500">|</span> 隐私政策</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction <span className="text-gray-500">|</span> 引言</h2>
          <div className="space-y-4">
            <p>
              This Privacy Policy explains how Namo Amituofo ("we", "our", or "us") collects, uses, discloses, and protects your personal data in accordance with the Singapore Personal Data Protection Act 2012 (PDPA). We are committed to ensuring the privacy and security of your personal information while providing you with the best possible service.
            </p>
            <p className="text-gray-700">
              本隐私政策解释了南无阿弥陀佛（以下简称"我们"）如何根据2012年新加坡个人数据保护法（PDPA）收集、使用、披露和保护您的个人数据。我们致力于确保您的个人信息的隐私和安全，同时为您提供最佳服务。
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Personal Data We Collect <span className="text-gray-500">|</span> 我们收集的个人数据</h2>
          <div className="space-y-4">
            <p>We may collect the following types of personal data:</p>
            <p className="text-gray-700">我们可能收集以下类型的个人数据：</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="list-disc pl-6">
                <li>Name and contact information (email address, phone number)</li>
                <li>Profile information for your account</li>
                <li>Event registration details</li>
                <li>Information you provide when contacting us</li>
                <li>Technical data (IP address, browser type, device information)</li>
                <li>Usage data about how you interact with our services</li>
              </ul>
              <ul className="list-disc pl-6 text-gray-700">
                <li>姓名和联系信息（电子邮件地址、电话号码）</li>
                <li>您的账户资料信息</li>
                <li>活动报名详情</li>
                <li>您联系我们时提供的信息</li>
                <li>技术数据（IP地址、浏览器类型、设备信息）</li>
                <li>关于您如何使用我们服务的使用数据</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. How We Collect Personal Data <span className="text-gray-500">|</span> 我们如何收集个人数据</h2>
          <div className="space-y-4">
            <p>We collect personal data through:</p>
            <p className="text-gray-700">我们通过以下方式收集个人数据：</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="list-disc pl-6">
                <li>Direct interactions when you create an account or register for events</li>
                <li>Automated technologies or interactions (cookies and similar technologies)</li>
                <li>Third parties or publicly available sources</li>
              </ul>
              <ul className="list-disc pl-6 text-gray-700">
                <li>当您创建账户或注册活动时的直接互动</li>
                <li>自动化技术或互动（cookies和类似技术）</li>
                <li>第三方或公开可用的来源</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Purpose of Collection, Use and Disclosure <span className="text-gray-500">|</span> 收集、使用和披露的目的</h2>
          <div className="space-y-4">
            <p>We collect, use and disclose your personal data for the following purposes:</p>
            <p className="text-gray-700">我们收集、使用和披露您的个人数据用于以下目的：</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="list-disc pl-6">
                <li>To provide and maintain our services</li>
                <li>To process and manage event registrations</li>
                <li>To communicate with you about our services</li>
                <li>To improve our services and user experience</li>
                <li>To comply with legal obligations</li>
                <li>To detect and prevent fraud or abuse</li>
              </ul>
              <ul className="list-disc pl-6 text-gray-700">
                <li>提供和维护我们的服务</li>
                <li>处理和管理活动报名</li>
                <li>就我们的服务与您沟通</li>
                <li>改进我们的服务和用户体验</li>
                <li>遵守法律义务</li>
                <li>检测和防止欺诈或滥用</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Consent <span className="text-gray-500">|</span> 同意</h2>
          <div className="space-y-4">
            <p>
              By using our services, you consent to the collection, use, and disclosure of your personal data for the purposes set out in this Privacy Policy. You may withdraw your consent at any time by contacting our Data Protection Officer. However, please note that this may affect our ability to provide you with certain services.
            </p>
            <p className="text-gray-700">
              使用我们的服务即表示您同意我们按照本隐私政策所述目的收集、使用和披露您的个人数据。您可以随时通过联系我们的数据保护官撤回您的同意。但请注意，这可能会影响我们为您提供某些服务的能力。
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Protection of Personal Data <span className="text-gray-500">|</span> 个人数据的保护</h2>
          <div className="space-y-4">
            <p>
              We implement appropriate security measures to protect your personal data against unauthorized access, collection, use, disclosure, copying, modification, disposal, or similar risks. These measures include:
            </p>
            <p className="text-gray-700">
              我们采取适当的安全措施来保护您的个人数据，防止未经授权的访问、收集、使用、披露、复制、修改、处置或类似风险。这些措施包括：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="list-disc pl-6">
                <li>Encryption of data in transit and at rest</li>
                <li>Access controls and authentication measures</li>
                <li>Regular security assessments and updates</li>
                <li>Staff training on data protection</li>
              </ul>
              <ul className="list-disc pl-6 text-gray-700">
                <li>传输中和静止状态的数据加密</li>
                <li>访问控制和身份验证措施</li>
                <li>定期安全评估和更新</li>
                <li>员工数据保护培训</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Retention of Personal Data <span className="text-gray-500">|</span> 个人数据的保留</h2>
          <div className="space-y-4">
            <p>
              We retain personal data only for as long as necessary to fulfill the purposes for which it was collected, or as required by law. When personal data is no longer needed, it will be securely deleted or anonymized.
            </p>
            <p className="text-gray-700">
              我们仅在必要时间内保留个人数据，以实现收集数据的目的，或按法律要求保留。当不再需要个人数据时，我们会安全删除或匿名化处理这些数据。
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Transfer of Personal Data Outside Singapore <span className="text-gray-500">|</span> 个人数据向新加坡境外的转移</h2>
          <div className="space-y-4">
            <p>
              We may transfer your personal data to countries outside Singapore. When we do so, we ensure that the receiving organization provides a standard of protection comparable to the PDPA through appropriate safeguards and contractual obligations.
            </p>
            <p className="text-gray-700">
              我们可能会将您的个人数据转移到新加坡境外的国家。在这种情况下，我们会通过适当的保护措施和合同义务确保接收组织提供与PDPA相当的保护标准。
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Your Rights <span className="text-gray-500">|</span> 您的权利</h2>
          <div className="space-y-4">
            <p>Under the PDPA, you have the right to:</p>
            <p className="text-gray-700">根据PDPA，您有权：</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="list-disc pl-6">
                <li>Access your personal data in our possession or control</li>
                <li>Request correction of any error or omission in your personal data</li>
                <li>Withdraw your consent for the collection, use, or disclosure of your personal data</li>
                <li>Request information about our personal data protection policies and practices</li>
              </ul>
              <ul className="list-disc pl-6 text-gray-700">
                <li>访问我们持有或控制的您的个人数据</li>
                <li>要求更正您个人数据中的任何错误或遗漏</li>
                <li>撤回您对收集、使用或披露您个人数据的同意</li>
                <li>要求了解我们的个人数据保护政策和做法</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Cookies and Similar Technologies <span className="text-gray-500">|</span> Cookies和类似技术</h2>
          <div className="space-y-4">
            <p>
              We use cookies and similar technologies to enhance your experience on our website. You can control cookie settings through your browser preferences. Please note that disabling certain cookies may affect the functionality of our services.
            </p>
            <p className="text-gray-700">
              我们使用cookies和类似技术来提升您在我们网站上的体验。您可以通过浏览器首选项控制cookie设置。请注意，禁用某些cookies可能会影响我们服务的功能。
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Data Protection Officer <span className="text-gray-500">|</span> 数据保护官</h2>
          <div className="space-y-4">
            <p>
              If you have any questions, concerns, or requests regarding your personal data or this Privacy Policy, please contact our Data Protection Officer at:
            </p>
            <p className="text-gray-700">
              如果您对您的个人数据或本隐私政策有任何疑问、疑虑或请求，请联系我们的数据保护官：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p>
                  Email: namoamituofo@gmail.com<br />
                  Address: 288 Boon Lay Way, Singapore 649565
                </p>
              </div>
              <div className="text-gray-700">
                <p>
                  电子邮件：namoamituofo@gmail.com<br />
                  地址：288 Boon Lay Way, Singapore 649565
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Updates to Privacy Policy <span className="text-gray-500">|</span> 隐私政策更新</h2>
          <div className="space-y-4">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes through our website or other appropriate channels.
            </p>
            <p className="text-gray-700">
              我们可能会不时更新本隐私政策，以反映我们的做法或法律要求的变化。我们将通过我们的网站或其他适当渠道通知您任何重大变更。
            </p>
          </div>
        </section>

        <section>
          <div className="text-sm text-gray-600 mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <p>Last updated: April 29, 2025</p>
            <p className="text-gray-700">最后更新日期：2025年4月29日</p>
          </div>
        </section>
      </div>
    </div>
  )
} 