import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { CustomField, CustomFieldGroup } from '@/types';

interface CheckPhoneNumbersRequest {
  phoneNumbers: string[];
  eventId: string;
}

interface CheckPhoneNumbersResponse {
  duplicates: string[];
}

interface ErrorResponse {
  error: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<CheckPhoneNumbersResponse | ErrorResponse>> {
  try {
    await connectToDatabase();
    
    const { phoneNumbers, eventId }: CheckPhoneNumbersRequest = await req.json();
    
    const orders = await Order.find({
      event: eventId,
      'customFieldValues.fields': {
        $elemMatch: {
          type: 'phone',
          value: { $in: phoneNumbers }
        }
      }
    });

    const duplicates = phoneNumbers.filter(phone => 
      orders.some(order => 
        order.customFieldValues.some((group: CustomFieldGroup) => 
          group.fields.some((field: CustomField) => 
            field.type === 'phone' && field.value === phone
          )
        )
      )
    );

    return NextResponse.json<CheckPhoneNumbersResponse>({ duplicates });
  } catch (error) {
    console.error('Error checking phone numbers:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
