import { NextRequest, NextResponse } from 'next/server';
import { createOrder, verifyUserDetails } from '@/lib/actions/order.actions';
import { CreateOrderParams } from '@/types'; // Assuming CreateOrderParams will be updated

export async function POST(req: NextRequest) {
  console.log("Received POST request to /api/createOrder");

  try {
    const body = await req.json();
    console.log("Request body:", body);
    // Destructure expected fields
    const { eventId, membershipNumber, last4PhoneNumberDigits, customFieldValues }: CreateOrderParams = body;

    // Validate the new required fields
    if (!eventId || !membershipNumber || !last4PhoneNumberDigits || !customFieldValues?.length) {
      console.error("Validation Error: Missing required fields", { eventId, membershipNumber, last4PhoneNumberDigits, customFieldValues });
      return new NextResponse("Event ID, Membership Number, Last 4 Phone Digits, and Custom Field Values are required", { status: 400 });
    }

    // --- User Lookup and Verification ---
    let verifiedUserDetails;
    try {
      verifiedUserDetails = await verifyUserDetails({ membershipNumber, last4PhoneNumberDigits });
      if (!verifiedUserDetails) {
        // verifyUserDetails should throw an error if not found or verification fails, but double-check
        console.warn("Verification failed: User details not returned for", membershipNumber);
        return new NextResponse("会员验证失败 / Membership verification failed", { status: 400 });
      }
      console.log("User verified:", verifiedUserDetails.name, verifiedUserDetails._id);
    } catch (verificationError: any) {
      console.error("Membership verification error:", verificationError.message);
      // Return specific error message from verification function
      return new NextResponse(verificationError.message || "会员验证失败 / Membership verification failed", { status: 400 });
    }

    // --- Create Order ---
    // Pass only necessary, verified data to the createOrder action
    const newOrder = await createOrder({
      eventId,
      registrantDetailsId: verifiedUserDetails._id.toString(), // Pass the verified UserDetails ID
      createdAt: new Date(),
      customFieldValues, // Pass customFieldValues
      // Note: membershipNumber/last4PhoneNumberDigits are not needed in createOrder itself anymore
      // as the user is verified and linked via registrantDetailsId.
      // We might pass membershipNumber if it's needed for QR code generation though.
      membershipNumberForQR: membershipNumber // Pass specifically for QR code if needed
    });

    return NextResponse.json({ message: '报名成功 / Order created successfully', order: newOrder });
  } catch (error) {
    console.error('Error in POST /api/createOrder:', error);
    // Ensure a generic error is sent to the client for unexpected issues
    const message = error instanceof Error ? error.message : 'Internal server error';
    // Avoid exposing detailed internal errors unless they are specific verification failures handled above
    if (message.includes("会员验证失败") || message.includes("Membership verification failed")) {
      return new NextResponse(message, { status: 400 });
    }
    return new NextResponse(`创建订单时出错 / Error creating order`, { status: 500 });
  }
}

export function OPTIONS() {
  return NextResponse.json({ status: 'OK' }, { status: 200 });
}