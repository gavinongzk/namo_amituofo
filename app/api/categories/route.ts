import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/index';
import Category from '@/lib/database/models/category.model';
import { handleError } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const categories = await Category.find({}).select('name').lean();

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/categories:', error);
    return handleError(error);
  }
}
