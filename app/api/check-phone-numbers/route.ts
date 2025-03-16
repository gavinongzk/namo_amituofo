import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { CustomField, CustomFieldGroup, DuplicateRegistrationDetail } from '@/types';

interface CheckPhoneNumbersRequest {
  phoneNumbers: string[];
  eventId: string;
}

interface CheckPhoneNumbersResponse {
  duplicates: DuplicateRegistrationDetail[];
}

interface ErrorResponse {
  error: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<CheckPhoneNumbersResponse | ErrorResponse>> {
  try {
    await connectToDatabase();
    
    const { phoneNumbers, eventId }: CheckPhoneNumbersRequest = await req.json();
    
    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json<CheckPhoneNumbersResponse>({ duplicates: [] });
    }

    const validPhoneNumbers = phoneNumbers.filter(phone => phone && phone.trim());

    if (validPhoneNumbers.length === 0) {
      return NextResponse.json<CheckPhoneNumbersResponse>({ duplicates: [] });
    }

    const orders = await Order.find({
      event: eventId,
      'customFieldValues.fields': {
        $elemMatch: {
          type: 'phone',
          value: { $in: validPhoneNumbers }
        }
      }
    });

    const duplicateDetails: DuplicateRegistrationDetail[] = [];
    
    for (const phoneNumber of validPhoneNumbers) {
      for (const order of orders) {
        for (const group of order.customFieldValues) {
          const phoneField = group.fields.find((field: CustomField) => 
            field.type === 'phone' && field.value === phoneNumber
          );
          
          if (phoneField) {
            const nameField = group.fields.find((field: CustomField) => 
              field.label.toLowerCase().includes('name')
            );
            
            duplicateDetails.push({
              phoneNumber: phoneNumber,
              name: nameField ? String(nameField.value) : 'N/A',
              queueNumber: group.queueNumber || 'N/A',
              qrCode: group.qrCode || ''
            });
          }
        }
      }
    }

    return NextResponse.json<CheckPhoneNumbersResponse>({ duplicates: duplicateDetails });
  } catch (error) {
    console.error('Error checking phone numbers:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}