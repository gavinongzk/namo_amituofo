import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import ClappingEvent from '@/lib/database/models/clappingEvent.model';
import Category from '@/lib/database/models/category.model';
import User from '@/lib/database/models/user.model';
import ClappingRegistration from '@/lib/database/models/clappingRegistration.model';
import { CustomFieldGroup } from '@/types';

async function ensureClappingExerciseEventExists() {
  try {
    // Check if event already exists
    let clappingEvent = await ClappingEvent.findOne({ 
      title: '拍手念佛健身操·义工招募',
      isDeleted: false 
    });

    if (clappingEvent) {
      return clappingEvent;
    }

    // Find or create category
    let clappingCategory = await Category.findOne({ name: '拍手念佛健身操义工招募' });
    if (!clappingCategory) {
      clappingCategory = await Category.create({
        name: '拍手念佛健身操义工招募',
        color: 'bg-orange-100 text-orange-800',
        description: 'Clapping Exercise Volunteer Recruitment Events'
      });
    }

    // Find a user to be the organizer
    let organizer = await User.findOne({ role: 'admin' });
    if (!organizer) {
      organizer = await User.findOne({ role: 'superadmin' });
    }
    if (!organizer) {
      // Create a default organizer user
      organizer = await User.create({
        clerkId: 'admin-clapping-exercise',
        email: 'admin@namoamituofo.org',
        role: 'admin'
      });
    }

    // Create the event
    clappingEvent = await ClappingEvent.create({
      title: '拍手念佛健身操·义工招募',
      description: '我们即将在 新加坡弥陀寺 长期举办 「拍手念佛健身操」。此活动结合健身运动与念佛，带来身心双重利益。',
      location: '净土宗弥陀寺（新加坡）',
      startDateTime: new Date('2024-02-01T16:00:00+08:00'),
      endDateTime: new Date('2024-12-31T23:59:59+08:00'),
      category: clappingCategory._id,
      organizer: organizer._id,
      maxSeats: 100000000,
      country: 'Singapore',
      isDeleted: false,
      isDraft: false,
      customFields: [
        { id: '1', label: '名字 / Name', type: 'text' },
        { id: '2', label: '净土宗皈依号 / Pure Land Refuge Number', type: 'text' },
        { id: '3', label: '联系号码 / Contact Number', type: 'phone' },
        { id: '4', label: '是否愿意参与拍手念佛健身操义工服务 / Willing to participate in clapping exercise volunteer service', type: 'radio', options: [
          { label: '是的，我愿意参与 / Yes, I am willing to participate', value: 'yes' },
          { label: '暂时无法参与 / Unable to participate at the moment', value: 'no' }
        ]},
        { id: '5', label: '参与频率 / Participation frequency', type: 'radio', options: [
          { label: '每星期 / Weekly', value: 'weekly' },
          { label: '两个星期一次 / Bi-weekly', value: 'biweekly' },
          { label: '其他（请注明）/ Other (please specify)', value: 'other' }
        ]},
        { id: '6', label: '询问事项 / Inquiries', type: 'text' }
      ]
    });

    console.log('Created clapping exercise volunteer event:', clappingEvent._id);
    return clappingEvent;
  } catch (error) {
    console.error('Error ensuring clapping exercise event exists:', error);
    return null;
  }
}

export async function GET() {
  try {
    await connectToDatabase();

    // Ensure the clapping exercise event exists
    const clappingExerciseEvent = await ensureClappingExerciseEventExists();

    if (!clappingExerciseEvent) {
      return NextResponse.json({
        success: true,
        volunteers: []
      });
    }

    // Fetch all registrations from dedicated collection
    const registrations = await ClappingRegistration.find({}).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      volunteers: registrations
    });

  } catch (error) {
    console.error('Error fetching clapping exercise volunteer registrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const {
      name,
      dharmaName,
      contactNumber,
      willingToParticipate,
      participationFrequency,
      otherFrequency,
      inquiries
    } = body;

    // Validate required fields
    if (!name || !contactNumber || !willingToParticipate || !participationFrequency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure the clapping exercise event exists
    const clappingExerciseEvent = await ensureClappingExerciseEventExists();

    if (!clappingExerciseEvent) {
      return NextResponse.json(
        { error: 'Failed to create or find clapping exercise volunteer recruitment event' },
        { status: 500 }
      );
    }

    // Generate unique queue number for clapping exercise volunteer
    const generateClappingExerciseQueueNumber = () => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      return `C${timestamp}${random}`;
    };

    const queueNumber = generateClappingExerciseQueueNumber();

    // Create order (registration) record following the existing pattern
    const customFieldGroup: CustomFieldGroup = {
      groupId: Date.now().toString(),
      fields: [
        {
          id: 'eventTitle',
          label: '活动标题 / Event Title',
          type: 'text',
          value: '拍手念佛健身操·义工招募'
        },
        {
          id: '1',
          label: '名字 / Name',
          type: 'text',
          value: name
        },
        {
          id: '2',
          label: '净土宗皈依号 / Pure Land Refuge Number',
          type: 'text',
          value: dharmaName || ''
        },
        {
          id: '3',
          label: '联系号码 / Contact Number',
          type: 'phone',
          value: contactNumber
        },
        {
          id: '4',
          label: '是否愿意参与拍手念佛健身操义工服务 / Willing to participate in clapping exercise volunteer service',
          type: 'radio',
          value: willingToParticipate
        },
        {
          id: '5',
          label: '参与频率 / Participation frequency',
          type: 'radio',
          value: participationFrequency
        },
        {
          id: '6',
          label: '询问事项 / Inquiries',
          type: 'text',
          value: inquiries || ''
        }
      ],
      queueNumber: queueNumber,
      cancelled: false,
      attendance: false,
      qrCode: '', // Will be generated if needed
      __v: 0
    };

    const registrationDoc = await ClappingRegistration.create({
      customFieldValues: [customFieldGroup],
      createdAt: new Date()
    });

    // Update event attendee count
    await ClappingEvent.findByIdAndUpdate(clappingExerciseEvent._id, {
      $inc: { attendeeCount: 1 }
    });

    return NextResponse.json({
      success: true,
      message: '拍手念佛健身操义工申请已成功提交',
      registrationId: registrationDoc._id
    });

  } catch (error) {
    console.error('Error processing clapping exercise volunteer registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
