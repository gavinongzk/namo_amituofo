import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"

export default function FAQPage() {
  const faqs = [
    {
      question: "1. 如何报名？ How to register?",
      answer: (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">报名步骤：</p>
            <ol className="list-none space-y-1.5 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">1.</span> 在首页选择想要参加的活动
              </li>
              <li>
                <span className="font-medium text-gray-900">2.</span> 点击"报名Register"按钮
              </li>
              <li>
                <span className="font-medium text-gray-900">3.</span> 填写所需信息（名字、电话等）
              </li>
              <li>
                <span className="font-medium text-gray-900">4.</span> 提交表格后，您将收到专属二维码
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-gray-900">Registration steps:</p>
            <ol className="list-none space-y-1.5 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">1.</span> Select the event you want to attend from the homepage
              </li>
              <li>
                <span className="font-medium text-gray-900">2.</span> Click the "Register" button
              </li>
              <li>
                <span className="font-medium text-gray-900">3.</span> Fill in required information (name, phone number, etc.)
              </li>
              <li>
                <span className="font-medium text-gray-900">4.</span> After submitting, you will receive a unique QR code
              </li>
            </ol>
          </div>
        </div>
      )
    },
    {
      question: "2. 如何确定自己已经报名成功？ How to confirm successful registration?",
      answer: (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">您可以通过以下方式确认：</p>
            <ol className="list-none space-y-1.5 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">1.</span> 报名成功后会显示专属二维码
              </li>
              <li>
                <span className="font-medium text-gray-900">2.</span> 您可以在"活动查询"页面输入电话号码查询所有报名记录
              </li>
              <li>
                <span className="font-medium text-gray-900">3.</span> 查看您的报名详情和二维码
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-gray-900">You can confirm through:</p>
            <ol className="list-none space-y-1.5 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">1.</span> A unique QR code will be displayed after successful registration
              </li>
              <li>
                <span className="font-medium text-gray-900">2.</span> You can check all your registrations in the "Event Lookup" page by entering your phone number
              </li>
              <li>
                <span className="font-medium text-gray-900">3.</span> View your registration details and QR codes
              </li>
            </ol>
          </div>
        </div>
      )
    },
    {
      question: "3. 名字或电话输入错误，如何更改？ How to correct name or phone number?",
      answer: (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">更改步骤：</p>
            <ol className="list-none space-y-1.5 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">1.</span> 在"活动查询"页面输入您的电话号码
              </li>
              <li>
                <span className="font-medium text-gray-900">2.</span> 找到需要更改的报名记录
              </li>
              <li>
                <span className="font-medium text-gray-900">3.</span> 点击"View Details"查看详情
              </li>
              <li>
                <span className="font-medium text-gray-900">4.</span> 在详情页面可以更改名字或电话号码
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-gray-900">To make corrections:</p>
            <ol className="list-none space-y-1.5 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">1.</span> Enter your phone number in the "Event Lookup" page
              </li>
              <li>
                <span className="font-medium text-gray-900">2.</span> Find the registration you want to modify
              </li>
              <li>
                <span className="font-medium text-gray-900">3.</span> Click "View Details"
              </li>
              <li>
                <span className="font-medium text-gray-900">4.</span> You can edit your name or phone number on the details page
              </li>
            </ol>
          </div>
        </div>
      )
    },
    {
      question: "4. 报名后，突然不能出席，如何取消报名？ How to cancel registration?",
      answer: (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">取消步骤：</p>
            <ol className="list-none space-y-1.5 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">1.</span> 在"活动查询"页面输入您的电话号码
              </li>
              <li>
                <span className="font-medium text-gray-900">2.</span> 找到需要取消的报名记录
              </li>
              <li>
                <span className="font-medium text-gray-900">3.</span> 点击"View Details"
              </li>
              <li>
                <span className="font-medium text-gray-900">4.</span> 在详情页面点击"Cancel Registration"取消报名
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-gray-900">Cancellation steps:</p>
            <ol className="list-none space-y-1.5 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">1.</span> Enter your phone number in the "Event Lookup" page
              </li>
              <li>
                <span className="font-medium text-gray-900">2.</span> Find the registration you want to cancel
              </li>
              <li>
                <span className="font-medium text-gray-900">3.</span> Click "View Details"
              </li>
              <li>
                <span className="font-medium text-gray-900">4.</span> Click "Cancel Registration" on the details page
              </li>
            </ol>
          </div>
        </div>
      )
    },
    {
      question: "5. 可以帮家人、朋友一起报名吗？ Can I register for family and friends?",
      answer: (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">可以！但请注意：</p>
            <ol className="list-none space-y-1.5 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">1.</span> 在注册表格中，您可以使用同一个电话号码为多人注册
              </li>
              <li>
                <span className="font-medium text-gray-900">2.</span> 点击"添加另一位参加者"来添加更多参与者
              </li>
              <li>
                <span className="font-medium text-gray-900">3.</span> 每个参加者都会获得独立的二维码
              </li>
              <li>
                <span className="font-medium text-gray-900">4.</span> 使用注册时的电话号码在"活动查询"页面，您将看到所有注册人员的列表
              </li>
              <li>
                <span className="font-medium text-gray-900">5.</span> 点击每个参加者旁边的"查看二维码"链接可以查看各自的二维码
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-gray-900">Yes! But please note:</p>
            <ol className="list-none space-y-1.5 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">1.</span> On the registration form, you can use the same phone number for multiple people
              </li>
              <li>
                <span className="font-medium text-gray-900">2.</span> Click "Add Another Person" to add more participants
              </li>
              <li>
                <span className="font-medium text-gray-900">3.</span> Each participant will receive their own QR code
              </li>
              <li>
                <span className="font-medium text-gray-900">4.</span> Use the registration phone number in the "Event Lookup" page to see a list of all registered people
              </li>
              <li>
                <span className="font-medium text-gray-900">5.</span> Click the "View QR Code" link next to each participant to see their individual QR code
              </li>
            </ol>
          </div>
        </div>
      )
    },
    {
      question: "6. 当天如何报到？ How to check in on the event day?",
      answer: (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">报到步骤：</p>
            <ol className="list-none space-y-1.5 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">1.</span> 准备好您的二维码（可在活动查询页面查看）
              </li>
              <li>
                <span className="font-medium text-gray-900">2.</span> 到达活动地点后，前往报到处
              </li>
              <li>
                <span className="font-medium text-gray-900">3.</span> 在扫码区出示您的二维码
              </li>
              <li>
                <span className="font-medium text-gray-900">4.</span> 义工们会为您完成扫码确认
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-gray-900">Check-in steps:</p>
            <ol className="list-none space-y-1.5 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">1.</span> Have your QR code ready (can be viewed in Event Lookup page)
              </li>
              <li>
                <span className="font-medium text-gray-900">2.</span> Upon arrival, proceed to the check-in counter
              </li>
              <li>
                <span className="font-medium text-gray-900">3.</span> Present your QR code at the scanning station
              </li>
              <li>
                <span className="font-medium text-gray-900">4.</span> Volunteers will scan your code to confirm your attendance
              </li>
            </ol>
          </div>
        </div>
      )
    },
    {
      question: "7. 无法成功报名，该怎么做？ What to do if registration fails?",
      answer: (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">如遇到问题：</p>
            <ol className="list-none space-y-1.5 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">1.</span> 检查网络连接是否正常
              </li>
              <li>
                <span className="font-medium text-gray-900">2.</span> 确保所有必填信息都已填写完整
              </li>
              <li>
                <span className="font-medium text-gray-900">3.</span> 刷新页面重试
              </li>
              <li>
                <span className="font-medium text-gray-900">4.</span> 如果问题持续，请通过WhatsApp联系寺院义工获取帮助：{' '}
                <a 
                  href="https://wa.me/6588184848" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary-600 hover:underline font-medium"
                >
                  +65 8818 4848
                </a>
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-gray-900">If you encounter issues:</p>
            <ol className="list-none space-y-1.5 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">1.</span> Check your internet connection
              </li>
              <li>
                <span className="font-medium text-gray-900">2.</span> Ensure all required fields are filled correctly
              </li>
              <li>
                <span className="font-medium text-gray-900">3.</span> Refresh the page and try again
              </li>
              <li>
                <span className="font-medium text-gray-900">4.</span> If the problem persists, contact volunteers via WhatsApp:{' '}
                <a 
                  href="https://wa.me/6588184848" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary-600 hover:underline font-medium"
                >
                  +65 8818 4848
                </a>
              </li>
            </ol>
          </div>
        </div>
      )
    },
    {
      question: "8. 我不是来自新加坡或马来西亚，如何报名？ How to register if I'm not from Singapore or Malaysia?",
      answer: (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">报名步骤：</p>
            <ol className="list-none space-y-1.5 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">1.</span> 在报名表格中选择您所在的国家
              </li>
              <li>
                <span className="font-medium text-gray-900">2.</span> 输入您的国际电话号码（包含国家代码）
              </li>
              <li>
                <span className="font-medium text-gray-900">3.</span> 输入您所在地区的实际邮区编号
              </li>
              <li>
                <span className="font-medium text-gray-900">4.</span> 填写其他必要信息后提交
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-gray-900">Registration steps:</p>
            <ol className="list-none space-y-1.5 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">1.</span> Select your country in the registration form
              </li>
              <li>
                <span className="font-medium text-gray-900">2.</span> Enter your international phone number (including country code)
              </li>
              <li>
                <span className="font-medium text-gray-900">3.</span> Enter your actual postal code for your location
              </li>
              <li>
                <span className="font-medium text-gray-900">4.</span> Fill in other required information and submit
              </li>
            </ol>
          </div>
        </div>
      )
    },
    {
      question: "9. 我的手机无法显示二维码，该怎么办？ What if my phone cannot display the QR code?",
      answer: (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">解决方案：</p>
            <ol className="list-none space-y-1.5 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">1.</span> 您可以将二维码截图保存
              </li>
              <li>
                <span className="font-medium text-gray-900">2.</span> 可以将二维码转发到其他设备上显示
              </li>
              <li>
                <span className="font-medium text-gray-900">3.</span> 到达活动现场时，可以提供您的电话号码给义工查询
              </li>
              <li>
                <span className="font-medium text-gray-900">4.</span> 义工可以通过您的电话号码在系统中找到您的报名记录
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-gray-900">Solutions:</p>
            <ol className="list-none space-y-1.5 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">1.</span> You can take a screenshot of the QR code
              </li>
              <li>
                <span className="font-medium text-gray-900">2.</span> Forward the QR code to another device for display
              </li>
              <li>
                <span className="font-medium text-gray-900">3.</span> At the event, you can provide your phone number to the volunteers
              </li>
              <li>
                <span className="font-medium text-gray-900">4.</span> Volunteers can look up your registration using your phone number
              </li>
            </ol>
          </div>
        </div>
      )
    },
  ];

  return (
    <div className="wrapper my-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary-600 mb-4">
            常见问题 / FAQ
          </h1>
          <p className="text-gray-600 text-lg">
            查询常见问题 / Find answers to commonly asked questions
          </p>
        </div>

        {/* FAQ Section */}
        <Card className="p-6 bg-white/50 backdrop-blur-sm shadow-xl rounded-xl">
          <Accordion type="single" collapsible className="w-full space-y-6">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                <AccordionTrigger className="px-6 py-5 hover:bg-gray-50 text-left [&[data-state=open]]:bg-primary-50">
                  <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                </AccordionTrigger>
                <AccordionContent className="px-6 py-5 bg-white">
                  <div className="prose prose-gray max-w-none">
                    <div className="text-gray-600 leading-relaxed">
                      {typeof faq.answer === 'string' ? (
                        <div className="whitespace-pre-line">{faq.answer}</div>
                      ) : (
                        faq.answer
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        {/* Contact Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 space-y-2">
            <div>还有其他问题？请通过WhatsApp联系我们：</div>
            <div>Still have questions? Contact us via WhatsApp at{' '}
              <a 
                href="https://wa.me/6588184848" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary-600 hover:underline font-medium"
              >
                +65 8818 4848
              </a>
            </div>
          </p>
        </div>
      </div>
    </div>
  );
}
