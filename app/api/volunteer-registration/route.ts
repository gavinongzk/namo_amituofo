import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import VolunteerEvent from '@/lib/database/models/volunteerEvent.model';
import Category from '@/lib/database/models/category.model';
import User from '@/lib/database/models/user.model';
import VolunteerRegistration from '@/lib/database/models/volunteerRegistration.model';
import { CustomFieldGroup } from '@/types';

async function ensureVolunteerEventExists() {
  try {
    // Check if event already exists
    let volunteerEvent = await VolunteerEvent.findOne({ 
      title: '新加坡净土儿童佛学班·义工招募',
      isDeleted: false 
    });

    if (volunteerEvent) {
      return volunteerEvent;
    }

    // Find or create category
    let volunteerCategory = await Category.findOne({ name: '义工招募' });
    if (!volunteerCategory) {
      volunteerCategory = await Category.create({
        name: '义工招募',
        color: 'bg-purple-100 text-purple-800',
        description: 'Volunteer Recruitment Events'
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
        clerkId: 'admin-volunteer-registration',
        email: 'admin@namoamituofo.org',
        role: 'admin'
      });
    }

    // Create the event
    volunteerEvent = await VolunteerEvent.create({
      title: '新加坡净土儿童佛学班·义工招募',
      description: '为了让孩子们在佛光中茁壮成长，「净土儿童佛学班」即将开课。本寺诚挚邀请大家一同加入义工之行，共同成就此殊胜因缘。',
      location: '净土宗弥陀寺（新加坡）',
      startDateTime: new Date('2024-02-01T10:00:00+08:00'),
      endDateTime: new Date('2024-12-31T23:59:59+08:00'),
      category: volunteerCategory._id,
      organizer: organizer._id,
      maxSeats: 100000000,
      country: 'Singapore',
      isDeleted: false,
      isDraft: false,
      customFields: [
        { id: '1', label: '名字 / Name', type: 'text' },
        { id: '2', label: '净土宗皈依号 / Pure Land Refuge Number', type: 'text' },
        { id: '3', label: '联系号码 / Contact Number', type: 'phone' },
        { id: '4', label: '是否愿意参与义工服务 / Willing to participate in volunteer service', type: 'radio', options: [
          { label: '是的，我愿意参与 / Yes, I am willing to participate', value: 'yes' },
          { label: '暂时无法参与 / Unable to participate at the moment', value: 'no' }
        ]},
        { id: '5', label: '每月参与次数 / Monthly participation frequency', type: 'radio', options: [
          { label: '每月 2 次 / Twice a month', value: 'twice' },
          { label: '每月 1 次 / Once a month', value: 'once' },
          { label: '其他（请注明）/ Other (please specify)', value: 'other' }
        ]},
        { id: '6', label: '询问事项 / Inquiries', type: 'text' }
      ]
    });

    console.log('Created volunteer recruitment event:', volunteerEvent._id);
    return volunteerEvent;
  } catch (error) {
    console.error('Error ensuring volunteer event exists:', error);
    return null;
  }
}

export async function GET() {
  try {
    await connectToDatabase();

    // Ensure the volunteer event exists
    const volunteerEvent = await ensureVolunteerEventExists();

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

const generateVolunteerQueueNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `V${timestamp}${random}`;
};

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

    // Ensure the volunteer event exists
    const volunteerEvent = await ensureVolunteerEventExists();

    console.log('Looking for volunteer event, found:', volunteerEvent ? volunteerEvent._id : 'Not found');

    if (!volunteerEvent) {
      return NextResponse.json(
        { error: 'Failed to create or find volunteer recruitment event' },
        { status: 500 }
      );
    }

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
          id: '5_other',
          label: '其他参与频率说明 / Other frequency details',
          type: 'text',
          value: otherFrequency || ''
        },
        {
          id: '6',
          label: '询问事项 / Inquiries',
          type: 'text',
          value: inquiries || ''
        }
      ],
      queueNumber,
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
    await VolunteerEvent.findByIdAndUpdate(volunteerEvent._id, {
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

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { registrationId, fieldUpdates } = body;

    if (!registrationId || !fieldUpdates) {
      return NextResponse.json(
        { error: 'Missing registrationId or fieldUpdates' },
        { status: 400 }
      );
    }

    // Find the registration
    const registration = await VolunteerRegistration.findById(registrationId);
    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Update fields in the first group
    const group = registration.customFieldValues[0];
    if (group) {
      Object.entries(fieldUpdates).forEach(([fieldId, value]) => {
        const field = group.fields.find((f: any) => f.id === fieldId);
        if (field) {
          field.value = value as string;
        }
      });
      group.lastUpdated = new Date();
    }

    await registration.save();

    return NextResponse.json({
      success: true,
      message: '更新成功',
      registration
    });

  } catch (error) {
    console.error('Error updating volunteer registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('id');

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Missing registration ID' },
        { status: 400 }
      );
    }

    // Find and delete the registration
    const registration = await VolunteerRegistration.findByIdAndDelete(registrationId);
    
    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Update event attendee count
    const volunteerEvent = await VolunteerEvent.findOne({ 
      title: '新加坡净土儿童佛学班·义工招募',
      isDeleted: false 
    });
    
    if (volunteerEvent) {
      await VolunteerEvent.findByIdAndUpdate(volunteerEvent._id, {
        $inc: { attendeeCount: -1 }
      });
    }

    return NextResponse.json({
      success: true,
      message: '删除成功'
    });

  } catch (error) {
    console.error('Error deleting volunteer registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
