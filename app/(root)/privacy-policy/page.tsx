import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | 隐私政策 | Namo Amituofo",
  description: "Our privacy policy explains how we collect, use, and protect your personal data in accordance with Singapore's Personal Data Protection Act (PDPA). 我们的隐私政策解释了我们如何根据新加坡的个人数据保护法收集、使用和保护您的个人数据。",
}

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Chinese Version */}
      <section className="mb-16">
        <h1 className="text-3xl font-bold mb-8">隐私政策</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. 引言</h2>
            <p>
              本隐私政策解释了南无阿弥陀佛（以下简称"我们"）如何根据2012年新加坡个人数据保护法（PDPA）收集、使用、披露和保护您的个人数据。我们致力于确保您的个人信息的隐私和安全，同时为您提供最佳服务。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. 我们收集的个人数据</h2>
            <p>我们可能收集以下类型的个人数据：</p>
            <ul className="list-disc pl-6">
              <li>姓名和联系信息（例如：电子邮件地址、电话号码、邮寄地址）</li>
              <li>活动报名详情（例如：所选活动、参与者信息）</li>
              <li>您通过我们服务上传或提供的内容（例如：通过文件上传功能提交的文档或图片）</li>
              <li>您联系我们时提供的信息（例如：咨询、反馈）</li>
              <li>技术数据（例如：IP地址、浏览器类型、操作系统、设备信息、访问时间）</li>
              <li>关于您如何使用我们服务的使用数据（例如：浏览页面、点击链接、搜索查询、用户标签或分类信息）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. 我们如何收集个人数据</h2>
            <p>我们通过以下方式收集个人数据：</p>
            <ul className="list-disc pl-6">
              <li>当您注册活动或与我们服务互动时的直接互动。</li>
              <li>自动化技术或互动，例如cookies、日志文件和分析工具，用于收集技术和使用数据。</li>
              <li>第三方服务提供商，例如：
                <ul className="list-circle pl-6">
                  <li>用于文件上传服务的Uploadthing。</li>
                </ul>
              </li>
              <li>来自公开可用的来源（在适用法律允许的情况下）。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. 收集、使用和披露的目的</h2>
            <p>我们收集、使用和披露您的个人数据用于以下目的：</p>
            <ul className="list-disc pl-6">
              <li>提供、运营和维护我们的网站和服务，包括活动注册。</li>
              <li>处理和管理活动报名和相关通讯。</li>
              <li>通过电子邮件或其他方式就我们的服务、活动、更新和促销信息与您沟通（在您同意的情况下）。</li>
              <li>个性化和改进我们的服务和用户体验，包括基于用户标签或偏好的内容。</li>
              <li>处理您的咨询、反馈和请求。</li>
              <li>分析使用趋势和模式，以改进我们的服务、开发新功能并进行业务分析。</li>
              <li>遵守法律和监管义务。</li>
              <li>检测、预防和解决欺诈、安全漏洞或技术问题。</li>
              <li>向协助我们运营的第三方服务提供商（如Uploadthing）披露必要信息，以提供服务。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. 同意</h2>
            <p>
              使用我们的服务即表示您同意我们按照本隐私政策所述目的收集、使用和披露您的个人数据。您可以随时通过联系我们的数据保护官撤回您的同意。但请注意，这可能会影响我们为您提供某些服务的能力。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. 个人数据的保护</h2>
            <p>
              我们采取适当的安全措施来保护您的个人数据，防止未经授权的访问、收集、使用、披露、复制、修改、处置或类似风险。这些措施包括：
            </p>
            <ul className="list-disc pl-6">
              <li>传输中和静止状态的数据加密</li>
              <li>访问控制和身份验证措施</li>
              <li>定期安全评估和更新</li>
              <li>员工数据保护培训</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. 个人数据的保留</h2>
            <p>
              我们仅在必要时间内保留个人数据，以实现收集数据的目的，或按法律要求保留。当不再需要个人数据时，我们会安全删除或匿名化处理这些数据。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. 个人数据向新加坡境外的转移</h2>
            <p>
              我们可能会将您的个人数据转移到新加坡境外的国家。在这种情况下，我们会通过适当的保护措施和合同义务确保接收组织提供与PDPA相当的保护标准。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. 您的权利</h2>
            <p>根据PDPA，您有权：</p>
            <ul className="list-disc pl-6">
              <li>访问我们持有或控制的您的个人数据</li>
              <li>要求更正您个人数据中的任何错误或遗漏</li>
              <li>撤回您对收集、使用或披露您个人数据的同意</li>
              <li>要求了解我们的个人数据保护政策和做法</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Cookies和类似技术</h2>
            <p>
              我们使用cookies和类似技术来提升您在我们网站上的体验。您可以通过浏览器首选项控制cookie设置。请注意，禁用某些cookies可能会影响我们服务的功能。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. 数据保护官</h2>
            <p>
              如果您对您的个人数据或本隐私政策有任何疑问、疑虑或请求，请联系我们的数据保护官：
            </p>
            <p>
              电子邮件：namo.amituofo.org@gmail.com<br />
              地址：No. 27, Lor 27, Geylang, Singapore 388163
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. 隐私政策更新</h2>
            <p>
              我们可能会不时更新本隐私政策，以反映我们的做法或法律要求的变化。我们将通过我们的网站或其他适当渠道通知您任何重大变更。
            </p>
          </section>

          <section>
            <div className="text-sm text-gray-600 mt-8">
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
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              This Privacy Policy explains how Namo Amituofo ("we", "our", or "us") collects, uses, discloses, and protects your personal data in accordance with the Singapore Personal Data Protection Act 2012 (PDPA). We are committed to ensuring the privacy and security of your personal information while providing you with the best possible service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Personal Data We Collect</h2>
            <p>We may collect the following types of personal data:</p>
            <ul className="list-disc pl-6">
              <li>Name and contact information (e.g., email address, phone number, mailing address).</li>
              <li>Event registration details (e.g., selected events, attendee information).</li>
              <li>Content you upload or provide through our services (e.g., documents or images submitted via file upload features).</li>
              <li>Information you provide when contacting us (e.g., inquiries, feedback).</li>
              <li>Technical data (e.g., IP address, browser type, operating system, device information, access times).</li>
              <li>Usage data about how you interact with our services (e.g., pages visited, links clicked, search queries, user tags or categorizations).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Collect Personal Data</h2>
            <p>We collect personal data through:</p>
            <ul className="list-disc pl-6">
              <li>Direct interactions when you register for events, or otherwise interact with our services.</li>
              <li>Automated technologies or interactions, such as cookies, log files, and analytics tools that collect technical and usage data.</li>
              <li>Third-party service providers, such as:
                <ul className="list-circle pl-6">
                  <li>Uploadthing for file upload services.</li>
                </ul>
              </li>
              <li>From publicly available sources (where permitted by applicable law).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Purpose of Collection, Use and Disclosure</h2>
            <p>We collect, use and disclose your personal data for the following purposes:</p>
            <ul className="list-disc pl-6">
              <li>To provide, operate, and maintain our website and services, including event registration.</li>
              <li>To process and manage event registrations and related communications.</li>
              <li>To communicate with you about our services, events, updates, and promotional offers (where you have consented).</li>
              <li>To personalize and improve our services and your user experience, including content based on user tags or preferences.</li>
              <li>To respond to your inquiries, feedback, and requests.</li>
              <li>To analyze usage trends and patterns to improve our services, develop new features, and for business analytics.</li>
              <li>To comply with legal and regulatory obligations.</li>
              <li>To detect, prevent, and address fraud, security breaches, or technical issues.</li>
              <li>To disclose necessary information to third-party service providers (such as Uploadthing) who assist us in our operations and service delivery.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Consent</h2>
            <p>
              By using our services, you consent to the collection, use, and disclosure of your personal data for the purposes set out in this Privacy Policy. You may withdraw your consent at any time by contacting our Data Protection Officer. However, please note that this may affect our ability to provide you with certain services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Protection of Personal Data</h2>
            <p>
              We implement appropriate security measures to protect your personal data against unauthorized access, collection, use, disclosure, copying, modification, disposal, or similar risks. These measures include:
            </p>
            <ul className="list-disc pl-6">
              <li>Encryption of data in transit and at rest</li>
              <li>Access controls and authentication measures</li>
              <li>Regular security assessments and updates</li>
              <li>Staff training on data protection</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Retention of Personal Data</h2>
            <p>
              We retain personal data only for as long as necessary to fulfill the purposes for which it was collected, or as required by law. When personal data is no longer needed, it will be securely deleted or anonymized.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Transfer of Personal Data Outside Singapore</h2>
            <p>
              We may transfer your personal data to countries outside Singapore. When we do so, we ensure that the receiving organization provides a standard of protection comparable to the PDPA through appropriate safeguards and contractual obligations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Your Rights</h2>
            <p>Under the PDPA, you have the right to:</p>
            <ul className="list-disc pl-6">
              <li>Access your personal data in our possession or control</li>
              <li>Request correction of any error or omission in your personal data</li>
              <li>Withdraw your consent for the collection, use, or disclosure of your personal data</li>
              <li>Request information about our personal data protection policies and practices</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Cookies and Similar Technologies</h2>
            <p>
              We use cookies and similar technologies to enhance your experience on our website. You can control cookie settings through your browser preferences. Please note that disabling certain cookies may affect the functionality of our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Data Protection Officer</h2>
            <p>
              If you have any questions, concerns, or requests regarding your personal data or this Privacy Policy, please contact our Data Protection Officer at:
            </p>
            <p>
              Email: namo.amituofo.org@gmail.com<br />
              Address: No. 27, Lor 27, Geylang, Singapore 388163
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Updates to Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes through our website or other appropriate channels.
            </p>
          </section>

          <section>
            <div className="text-sm text-gray-600 mt-8">
              <p>Last updated: May 12, 2025</p>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
} 