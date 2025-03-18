import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { WebSocket } from 'ws';

// Create a map to store active SSE connections
const clients = new Map<string, ReadableStreamController<Uint8Array>>();

// WebSocket connection to our internal update server
const ws = new WebSocket('ws://localhost:3001');

ws.on('message', (data: string) => {
  try {
    const update = JSON.parse(data);
    const orderId = update.orderId;
    const controller = clients.get(orderId);
    
    if (controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(update)}\n\n`));
    }
  } catch (error) {
    console.error('Error processing WebSocket message:', error);
  }
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const encoder = new TextEncoder();
  const headersList = headers();
  
  // Create a new stream for this client
  const stream = new ReadableStream({
    start(controller) {
      // Store the controller for this orderId
      clients.set(params.id, controller);
      
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );
    },
    cancel() {
      // Clean up when the client disconnects
      clients.delete(params.id);
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 