import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { connectToDatabase } from '@/lib/database';
import AutoEnrollProfile from '@/lib/database/models/autoEnrollProfile.model';

const getRoleFromClaims = (sessionClaims: any): string | undefined => {
  return (sessionClaims?.role as string) || (sessionClaims?.metadata?.role as string);
};

const normalizePhoneNumber = (value: string) => value.trim();

const ensureSuperAdmin = () => {
  const { userId, sessionClaims } = auth();
  const role = getRoleFromClaims(sessionClaims);

  if (!userId || role !== 'superadmin') {
    return false;
  }

  return true;
};

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!ensureSuperAdmin()) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid id' }, { status: 400 });
    }

    const body = await req.json();
    const updateData: Record<string, any> = {};

    if (typeof body?.name === 'string') updateData.name = body.name.trim();
    if (typeof body?.phoneNumber === 'string') {
      updateData.phoneNumber = normalizePhoneNumber(body.phoneNumber);
    }
    if (typeof body?.postalCode === 'string') updateData.postalCode = body.postalCode.trim();
    if (typeof body?.enabled === 'boolean') updateData.enabled = body.enabled;
    if (typeof body?.country === 'string') {
      const country = body.country.trim();
      if (country !== 'Singapore' && country !== 'Malaysia') {
        return NextResponse.json(
          { message: 'country must be Singapore or Malaysia' },
          { status: 400 }
        );
      }
      updateData.country = country;
    }

    await connectToDatabase();

    const updatedProfile = await AutoEnrollProfile.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProfile) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updatedProfile });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { message: 'A profile with this phone number and country already exists' },
        { status: 409 }
      );
    }

    console.error('Failed to update always-add user:', error);
    return NextResponse.json({ message: 'Failed to update always-add user' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!ensureSuperAdmin()) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid id' }, { status: 400 });
    }

    await connectToDatabase();
    const deletedProfile = await AutoEnrollProfile.findByIdAndDelete(id);

    if (!deletedProfile) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete always-add user:', error);
    return NextResponse.json({ message: 'Failed to delete always-add user' }, { status: 500 });
  }
}
