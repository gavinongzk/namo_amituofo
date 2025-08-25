import { NextRequest, NextResponse } from 'next/server';
import { getUserForAdmin } from '@/lib/actions/user.actions';
import { connectToDatabase } from '@/lib/database';
import User from '@/lib/database/models/user.model';
import Order from '@/lib/database/models/order.model';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const users = await User.find().select('_id role');
    
    const usersWithCustomFields = await Promise.all(users.map(async (user) => {
      const order = await Order.findOne({ buyer: user._id })
        .select('customFieldValues')
        .sort({ createdAt: -1 });

      const customName = order?.customFieldValues.find((field: { label: string; value: string }) => 
        field.label.toLowerCase().includes('name'))?.value || '';
      
      const customPhone = order?.customFieldValues.find((field: { label: string; value: string }) => 
        field.label.toLowerCase().includes('phone'))?.value || '';

      return {
        id: user._id.toString(),
        customName,
        customPhone,
        role: user.role,
      };
    }));

    return NextResponse.json(usersWithCustomFields);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
