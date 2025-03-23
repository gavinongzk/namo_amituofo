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

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated and is superadmin
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // For public FAQ page, we don't need to check superadmin status
    const { searchParams } = new URL(req.url);
    const publicOnly = searchParams.get('public') === 'true';

    if (!publicOnly) {
      const isAdmin = await isSuperAdmin(userId);
      if (!isAdmin) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    await connectToDatabase();

    // If public only, only return visible FAQs
    const query = publicOnly ? { isVisible: true } : {};
    const faqs = await FAQ.find(query).sort({ createdAt: -1 });

    return NextResponse.json(faqs);
  } catch (error) {
    console.error('Error in GET /api/faq-management:', error);
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
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

    // Validate required fields
    if (!body.question || !body.answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const faq = await FAQ.create(body);
    return NextResponse.json(faq, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/faq-management:', error);
    return handleError(error);
  }
}

export const dynamic = 'force-dynamic'; 