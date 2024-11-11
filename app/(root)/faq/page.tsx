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
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
              <li>在首页选择想要参加的活动</li>
              <li>点击"Register"按钮</li>
              <li>填写所需信息（姓名、电话等）</li>
              <li>提交表格后，您将收到专属二维码</li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-gray-900">Registration steps:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
              <li>Select the event you want to attend from the homepage</li>
              <li>Click the "Register" button</li>
              <li>Fill in required information (name, phone number, etc.)</li>
              <li>After submitting, you will receive a unique QR code</li>
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
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
              <li>报名成功后会显示专属二维码</li>
              <li>您可以在"活动查询"页面输入电话号码查询所有报名记录</li>
              <li>查看您的报名详情和二维码</li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-gray-900">You can confirm through:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
              <li>A unique QR code will be displayed after successful registration</li>
              <li>You can check all your registrations in the "Event Lookup" page by entering your phone number</li>
              <li>View your registration details and QR codes</li>
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
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
              <li>在"活动查询"页面输入您的电话号码</li>
              <li>找到需要更改的报名记录</li>
              <li>点击"View Details"查看详情</li>
              <li>在详情页面可以更改姓名或电话号码</li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-gray-900">To make corrections:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
              <li>Enter your phone number in the "Event Lookup" page</li>
              <li>Find the registration you want to modify</li>
              <li>Click "View Details"</li>
              <li>You can edit your name or phone number on the details page</li>
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
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
              <li>在"活动查询"页面输入您的电话号码</li>
              <li>找到需要取消的报名记录</li>
              <li>点击"View Details"</li>
              <li>在详情页面点击"Cancel Registration"取消报名</li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-gray-900">Cancellation steps:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
              <li>Enter your phone number in the "Event Lookup" page</li>
              <li>Find the registration you want to cancel</li>
              <li>Click "View Details"</li>
              <li>Click "Cancel Registration" on the details page</li>
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
            <p className="font-semibold text-gray-900">可以！但请注意以下事项：</p>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
              <li>在报名表格页面，每个人需要填写各自的电话号码</li>
              <li>点击"Add Another Person"添加更多参加者</li>
              <li>每个参加者都会获得独立的二维码</li>
              <li>每位参加者需要使用自己的电话号码在"活动查询"页面查看各自的二维码</li>
              <li>请确保将此信息告知您帮忙报名的人员</li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-gray-900">Yes! But please note:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
              <li>On the registration form, each person needs their own phone number</li>
              <li>Click "Add Another Person" to add more participants</li>
              <li>Each participant will receive their own QR code</li>
              <li>Each participant must use their own phone number in the "Event Lookup" page to view their QR code</li>
              <li>Please make sure to inform the people you registered about this process</li>
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
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
              <li>准备好您的二维码（可在活动查询页面查看）</li>
              <li>到达活动地点后，前往报到处</li>
              <li>在扫码区出示您的二维码</li>
              <li>工作人员会为您完成扫码确认</li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-gray-900">Check-in steps:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
              <li>Have your QR code ready (can be viewed in Event Lookup page)</li>
              <li>Upon arrival, proceed to the check-in counter</li>
              <li>Present your QR code at the scanning station</li>
              <li>Staff will scan your code to confirm your attendance</li>
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
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
              <li>检查网络连接是否正常</li>
              <li>确保所有必填信息都已填写完整</li>
              <li>刷新页面重试</li>
              <li>
                如果问题持续，请通过WhatsApp联系寺院工作人员获取帮助：{' '}
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
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
              <li>Check your internet connection</li>
              <li>Ensure all required fields are filled correctly</li>
              <li>Refresh the page and try again</li>
              <li>
                If the problem persists, contact temple staff via WhatsApp:{' '}
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
    }
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
            Find answers to commonly asked questions about registration and events
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
          <p className="text-gray-600">
            Still have questions? Contact us via WhatsApp at{' '}
            <a 
              href="https://wa.me/6588184848" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary-600 hover:underline font-medium"
            >
              +65 8818 4848
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
