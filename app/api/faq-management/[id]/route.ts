import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import FAQ from '@/lib/database/models/faq.model';
import { auth } from '@clerk/nextjs';
import { handleError } from '@/lib/utils';

// Helper function to check if user is superadmin
async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const User = (await import('@/lib/database/models/user.model')).default;
    const user = await User.findOne({ clerkId: userId });
    return user?.role === 'superadmin';
  } catch (error) {
    console.error('Error checking superadmin status:', error);
    return false;
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is authenticated and is superadmin
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectToDatabase();

    const faq = await FAQ.findById(params.id);
    if (!faq) {
      return NextResponse.json(
        { error: 'FAQ not found' },
        { status: 404 }
      );
    }

    // If FAQ is not visible, only allow superadmins to view it
    if (!faq.isVisible) {
      const isAdmin = await isSuperAdmin(userId);
      if (!isAdmin) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    return NextResponse.json(faq);
  } catch (error) {
    console.error('Error in GET /api/faq-management/[id]:', error);
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is authenticated and is superadmin
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const isAdmin = await isSuperAdmin(userId);
    if (!isAdmin) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await req.json();

    await connectToDatabase();

    const updatedFaq = await FAQ.findByIdAndUpdate(
      params.id,
      { ...body, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedFaq) {
      return NextResponse.json(
        { error: 'FAQ not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedFaq);
  } catch (error) {
    console.error('Error in PATCH /api/faq-management/[id]:', error);
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is authenticated and is superadmin
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const isAdmin = await isSuperAdmin(userId);
    if (!isAdmin) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    await connectToDatabase();

    const deletedFaq = await FAQ.findByIdAndDelete(params.id);
    if (!deletedFaq) {
      return NextResponse.json(
        { error: 'FAQ not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/faq-management/[id]:', error);
    return handleError(error);
  }
}

export const dynamic = 'force-dynamic'; 