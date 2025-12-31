import mongoose from 'mongoose';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Adjust these imports to your project structure if needed
import { connectToDatabase } from '../lib/database';
import Order from '../lib/database/models/order.model';

const EVENT_ID = '68316c3e1a60981d24efedd0'; // <-- Replace with your event id

async function reassignQueueNumbers(eventId: string) {
  await connectToDatabase();

  // Fetch all orders for the event
  const orders = await Order.find({ event: eventId }).sort({ createdAt: 1 });

  // Flatten all customFieldValues with references to their order and group
  const allGroups: {
    order: typeof orders[0];
    orderId: string;
    groupIndex: number;
    createdAt: Date;
    group: any;
  }[] = [];

  for (const order of orders) {
    order.customFieldValues.forEach((group: any, idx: number) => {
      allGroups.push({
        order,
        orderId: order._id,
        groupIndex: idx,
        createdAt: order.createdAt,
        group,
      });
    });
  }

  // Sort by createdAt (or by name, or however you want)
  allGroups.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // Assign new queue numbers and update QR code
  for (let i = 0; i < allGroups.length; i++) {
    const { order, groupIndex, group } = allGroups[i];
    const newQueueNumber = `${String(i + 1).padStart(3, '0')}`;

    // Find phone number from fields
    const phoneField = group.fields.find(
      (field: any) =>
        (field.label && field.label.toLowerCase().includes('phone')) ||
        field.type === 'phone'
    );
    const phoneNumber = phoneField?.value || '';

    // Create a unique hash for this registration using phone number and queue number
    const registrationHash = crypto
      .createHash('sha256')
      .update(`${phoneNumber}_${newQueueNumber}_${eventId}`)
      .digest('hex')
      .slice(0, 16);

    // Create QR code data with event ID, queue number, and registration hash
    const qrCodeData = `${eventId}_${newQueueNumber}_${registrationHash}`;
    const qrCode = await QRCode.toDataURL(qrCodeData, {
      errorCorrectionLevel: 'H',
      margin: 4,
      width: 512,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Update the group in the order
    order.customFieldValues[groupIndex].queueNumber = newQueueNumber;
    order.customFieldValues[groupIndex].qrCode = qrCode;
    // You can update other fields here if needed
  }

  // Save all updated orders
  for (const order of orders) {
    await order.save();
    console.log(`Order ${order._id} updated`);
  }

  console.log('Queue number and QR code reassignment complete!');
  process.exit(0);
}

// Run the script
reassignQueueNumbers(EVENT_ID).catch((err) => {
  console.error(err);
  process.exit(1);
});