import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Event from '@/lib/database/models/event.model';
import VolunteerRegistration from '@/lib/database/models/volunteerRegistration.model';
import { CustomFieldGroup } from '@/types';

export async function GET() {
  try {
    await connectToDatabase();

    // Find the volunteer recruitment event
    const volunteerEvent = await Event.findOne({ 
      title: '净土儿童佛学班·义工招募',
      isDeleted: false 
    });

    console.log('Volunteer event found:', volunteerEvent ? volunteerEvent._id : 'Not found');

    if (!volunteerEvent) {
      return NextResponse.json({
        success: true,
        volunteers: []
      });
    }

    // Fetch all registrations from dedicated collection
    const registrations = await VolunteerRegistration.find({}).sort({ createdAt: -1 });

    console.log('Volunteer registrations found:', registrations.length);

    return NextResponse.json({
      success: true,
      volunteers: registrations
    });

  } catch (error) {
    console.error('Error fetching volunteer registrations:', error);
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

    // Find or create a volunteer recruitment event
    let volunteerEvent = await Event.findOne({ 
      title: '净土儿童佛学班·义工招募',
      isDeleted: false 
    });

    console.log('Looking for volunteer event, found:', volunteerEvent ? volunteerEvent._id : 'Not found');

    if (!volunteerEvent) {
      // Create the volunteer recruitment event if it doesn't exist
      volunteerEvent = await Event.create({
        title: '净土儿童佛学班·义工招募',
        description: '新加坡净土儿童佛学班义工招募活动',
        location: '净土宗弥陀寺（新加坡）',
        startDateTime: new Date('2024-01-01T09:30:00+08:00'),
        endDateTime: new Date('2024-12-31T11:30:00+08:00'),
        maxSeats: 100,
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
            label: '是否愿意参与义工服务 / Willing to participate in volunteer service',
            type: 'radio',
            value: willingToParticipate
          },
          {
            id: '5',
            label: '每月参与次数 / Monthly participation frequency',
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
      console.log('Created volunteer event:', volunteerEvent._id);
    }

    // Generate unique queue number for volunteer
    const generateVolunteerQueueNumber = () => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      return `V${timestamp}${random}`;
    };

    const queueNumber = generateVolunteerQueueNumber();

    // Create registration record in dedicated collection
    const customFieldGroup: CustomFieldGroup = {
      groupId: Date.now().toString(),
      fields: [
        {
          id: 'eventTitle',
          label: '活动标题 / Event Title',
          type: 'text',
          value: '净土儿童佛学班·义工招募'
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
          label: '是否愿意参与义工服务 / Willing to participate in volunteer service',
          type: 'radio',
          value: willingToParticipate
        },
        {
          id: '5',
          label: '每月参与次数 / Monthly participation frequency',
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

    console.log('Creating order for event:', volunteerEvent._id);
    
    const registrationDoc = await VolunteerRegistration.create({
      customFieldValues: [customFieldGroup],
      createdAt: new Date()
    });

    // Update event attendee count
    await Event.findByIdAndUpdate(volunteerEvent._id, {
      $inc: { attendeeCount: 1 }
    });

    return NextResponse.json({
      success: true,
      message: '义工申请已成功提交',
      registrationId: registrationDoc._id
    });

  } catch (error) {
    console.error('Error processing volunteer registration:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
