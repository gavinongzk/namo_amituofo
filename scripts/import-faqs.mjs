import { connect, Schema, model } from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

const defaultFaqs = [
  {
    question: "1. 如何报名？ How to register?",
    answer: `报名步骤：
1. 在首页选择想要参加的活动
2. 点击"报名Register"
3. 填写所需资料（名字、电话等）
4. 提交表格后，您将收到二维码

Registration steps:
1. Select the event you want to attend from the homepage
2. Click the "Register" button
3. Fill in required information (name, phone number, etc.)
4. After submitting, you will receive a QR code`,
    isVisible: true,
    category: "Registration"
  },
  {
    question: "2. 如何确定报名成功？ How to confirm successful registration?",
    answer: `您可以通过以下方式确认：
1. 报名成功后会显示专属二维码
2. 您可以在"活动查询"页面，输入电话号码查询所有报名记录
3. 查看您的报名详情和二维码

You can confirm through:
1. A unique QR code will be displayed after successful registration
2. You can check all your registrations in the "Event Lookup" page by entering your phone number
3. View your registration details and QR codes`,
    isVisible: true,
    category: "Registration"
  },
  {
    question: "3. 名字或电话输入错误，如何更改？ How to correct name or phone number?",
    answer: `更改步骤：
1. 在"活动查询"页面，输入您的电话号码
2. 找到需要更改的报名记录
3. 点击"View Registration Details"查看报名记录
4. 在详情页面可以更改名字或电话号码

To make corrections:
1. Enter your phone number in the "Event Lookup" page
2. Find the registration you want to modify
3. Click "View Registration Details"
4. You can edit your name or phone number on the details page`,
    isVisible: true,
    category: "Registration Management"
  },
  {
    question: "4. 报名后，突然不能出席，如何取消报名？ How to cancel registration?",
    answer: `取消步骤：
1. 在"活动查询"页面，输入您的电话号码
2. 找到需要取消的报名记录
3. 点击"View Details"
4. 在详情页面点击"Cancel Registration"取消报名

Cancellation steps:
1. Enter your phone number in the "Event Lookup" page
2. Find the registration you want to cancel
3. Click "View Details"
4. Click "Cancel Registration" on the details page`,
    isVisible: true,
    category: "Registration Management"
  },
  {
    question: "5. 可以帮家人、朋友一起报名吗？ Can I register for family and friends?",
    answer: `可以！但请注意：
1. 在报名表格中，您可以使用同一个电话号码为多人报名
2. 点击"添加参加者"来添加更多参与者
3. 每个参加者都会获得独立的二维码

Yes! But please note:
1. On the registration form, you can use the same phone number for multiple people
2. Click "Add Participant" to add more participants
3. Each participant will receive their own QR code
4. Use the registration phone number in the "Event Lookup" page to see a list of all registered people
5. Click the "View QR Code" link next to each participant to see their individual QR code`,
    isVisible: true,
    category: "Group Registration"
  },
  {
    question: "6. 活动当天如何报到？ How to take attendance on the event day?",
    answer: `报到步骤：
1. 准备好您的二维码（可在活动查询页面查看）
2. 到达活动地点后，前往报到处
3. 在扫码区出示您的二维码
4. 义工们会为您完成报到扫描

Steps to take attendance:
1. Have your QR code ready (can be viewed in Event Lookup page)
2. Upon arrival, proceed to the counter
3. Present your QR code at the scanning station
4. Volunteers will scan your code to confirm your attendance`,
    isVisible: true,
    category: "Event Day"
  },
  {
    question: "7. 无法成功报名，该怎么做？ What to do if registration fails?",
    answer: `如遇到问题：
1. 检查网络连接是否正常
2. 确保所有必填资料都已填写完整
3. 刷新页面重试
4. 如果问题持续，请通过WhatsApp联系道场：+65 8818 4848

If you encounter issues:
1. Check your internet connection
2. Ensure all required fields are filled correctly
3. Refresh the page and try again
4. If the problem persists, contact volunteers via WhatsApp: +65 8818 4848`,
    isVisible: true,
    category: "Troubleshooting"
  },
  {
    question: "8. 我不是来自新加坡或马来西亚，如何报名？ How to register if I'm not from Singapore or Malaysia?",
    answer: `报名步骤：
1. 在报名表格中选择您所在的国家
2. 输入您的国际电话号码（包含国家代码）
3. 输入您所在地区的实际邮区编号
4. 填写其他必要资料后提交

Registration steps:
1. Select your country in the registration form
2. Enter your international phone number (including country code)
3. Enter your actual postal code for your location
4. Fill in other required information and submit`,
    isVisible: true,
    category: "International Registration"
  }
];

// Define FAQ Schema
const faqSchema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String },
  isVisible: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const importFaqs = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await connect(MONGODB_URI);
    console.log('Connected to database');

    // Create FAQ model
    const FAQ = model('FAQ', faqSchema);

    // Import default FAQs
    const existingFaqs = await FAQ.find({});
    const newFaqs = defaultFaqs.filter(defaultFaq => 
      !existingFaqs.some(existingFaq => 
        existingFaq.question === defaultFaq.question
      )
    );

    if (newFaqs.length > 0) {
      await FAQ.insertMany(newFaqs);
      console.log(`Imported ${newFaqs.length} new FAQs`);
    } else {
      console.log('No new FAQs to import');
    }

    console.log('FAQ import completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error importing FAQs:', error);
    process.exit(1);
  }
};

importFaqs(); 