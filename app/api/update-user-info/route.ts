import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import User from '@/lib/database/models/user.model';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { registrationId, updatedName, updatedPhoneNumber } = await req.json();

        if (!registrationId || !updatedName || !updatedPhoneNumber) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const user = await User.findOneAndUpdate(
            { registrationId },
            { name: updatedName, phoneNumber: updatedPhoneNumber },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'User info updated successfully', user });
    } catch (error) {
        console.error('Error updating user info:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

