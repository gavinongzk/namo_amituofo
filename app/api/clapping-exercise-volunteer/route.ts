import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Event from '@/lib/database/models/event.model';
import Order from '@/lib/database/models/order.model';
import { CustomFieldGroup } from '@/types';

export async function GET() {
  try {
    await connectToDatabase();

    // Find the clapping exercise volunteer recruitment event
    const clappingExerciseEvent = await Event.findOne({ 
      title: '拍手念佛健身操·义工招募',
      isDeleted: false 
    });

    if (!clappingExerciseEvent) {
      return NextResponse.json({
        success: true,
        volunteers: []
      });
    }

    // Get all orders (registrations) for this event
    const orders = await Order.find({
      event: clappingExerciseEvent._id,
      isDeleted: false
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      volunteers: orders
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

    // Find or create a clapping exercise volunteer recruitment event
    let clappingExerciseEvent = await Event.findOne({ 
      title: '拍手念佛健身操·义工招募',
      isDeleted: false 
    });

    if (!clappingExerciseEvent) {
      // Create the clapping exercise volunteer recruitment event if it doesn't exist
      clappingExerciseEvent = await Event.create({
        title: '拍手念佛健身操·义工招募',
        description: '新加坡弥陀寺拍手念佛健身操义工招募活动',
        location: '新加坡弥陀寺',
        startDateTime: new Date('2024-01-01T16:00:00+08:00'),
        endDateTime: new Date('2024-12-31T17:00:00+08:00'),
        maxSeats: 50,
        country: 'Singapore',
        category: null, // Will be set when category is created
        organizer: null, // Will be set when admin creates the event
        customFields: [
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
        isDraft: false
      });
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

    const order = await Order.create({
      event: clappingExerciseEvent._id,
      buyer: null, // Anonymous registration
      customFieldValues: [customFieldGroup],
      createdAt: new Date()
    });

    // Update event attendee count
    await Event.findByIdAndUpdate(clappingExerciseEvent._id, {
      $inc: { attendeeCount: 1 }
    });

    return NextResponse.json({
      success: true,
      message: '拍手念佛健身操义工申请已成功提交',
      registrationId: order._id
    });

  } catch (error) {
    console.error('Error processing clapping exercise volunteer registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
