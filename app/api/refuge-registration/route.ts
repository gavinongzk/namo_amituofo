import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import RefugeRegistration from '@/lib/database/models/refugeRegistration.model';
import { auth } from '@clerk/nextjs';

export async function GET() {
  try {
    await connectToDatabase();

    const { sessionClaims } = auth();
    const role = sessionClaims?.role as string;
    if (role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized: Only superadmins can view refuge registrations' }, { status: 403 });
    }

    // Fetch all registrations from dedicated collection
    const registrations = await RefugeRegistration.find({}).sort({ createdAt: -1 });

    console.log('Refuge registrations found:', registrations.length);

    return NextResponse.json({
      success: true,
      registrations: registrations
    });

  } catch (error) {
    console.error('Error fetching refuge registrations:', error);
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
      chineseName,
      englishName,
      age,
      dob,
      gender,
      contactNumber,
      address
    } = body;

    // Validate required fields
    if (!chineseName || !englishName || !age || !dob || !gender || !contactNumber || !address) {
      return NextResponse.json(
        { error: 'Missing required fields / 缺少必填项' },
        { status: 400 }
      );
    }

    // Create registration record
    const registrationDoc = await RefugeRegistration.create({
      chineseName,
      englishName,
      age,
      dob,
      gender,
      contactNumber,
      address,
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: '报名成功！/ Registration successful!',
      registrationId: registrationDoc._id
    });

  } catch (error) {
    console.error('Error processing refuge registration:', error);
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
    
    const { sessionClaims } = auth();
    const role = sessionClaims?.role as string;
    if (role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized: Only superadmins can update refuge registrations' }, { status: 403 });
    }

    const body = await request.json();
    const { registrationId, ...fieldUpdates } = body;

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Missing registrationId' },
        { status: 400 }
      );
    }

    // Find and update the registration
    const registration = await RefugeRegistration.findByIdAndUpdate(
      registrationId,
      fieldUpdates,
      { new: true, runValidators: true }
    );

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '更新成功 / Update successful',
      registration
    });

  } catch (error) {
    console.error('Error updating refuge registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { sessionClaims } = auth();
    const role = sessionClaims?.role as string;
    if (role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized: Only superadmins can delete refuge registrations' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('id');

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Missing registration ID' },
        { status: 400 }
      );
    }

    // Find and delete the registration
    const registration = await RefugeRegistration.findByIdAndDelete(registrationId);
    
    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '删除成功 / Delete successful'
    });

  } catch (error) {
    console.error('Error deleting refuge registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

