import { WebSocketServer, WebSocket } from 'ws';
import { MongoClient, ChangeStreamDocument } from 'mongodb';
import { config } from '@/config';

interface WebSocketClient extends WebSocket {
  isAlive: boolean;
}

const wss = new WebSocketServer({ port: config.websocket.port });
const mongoClient = new MongoClient(config.mongodb.url);

// Type definition for change stream events
interface AttendanceChangeEvent extends ChangeStreamDocument {
  documentKey: {
    _id: { toString: () => string };
  };
  updateDescription: {
    updatedFields: Record<string, any>;
  };
}

async function startChangeStream() {
  try {
    await mongoClient.connect();
    const db = mongoClient.db(config.mongodb.dbName);
    const collection = db.collection('orders');

    // Watch for changes in the orders collection
    const changeStream = collection.watch([
      {
        $match: {
          'updateDescription.updatedFields.customFieldValues.attendance': { $exists: true }
        }
      }
    ]);

    changeStream.on('change', (change: any) => {
      // We need to cast to any first due to MongoDB type limitations
      const typedChange = change as AttendanceChangeEvent;
      
      try {
        // Extract the relevant information from the change event
        const orderId = typedChange.documentKey._id.toString();
        const updatedFields = typedChange.updateDescription.updatedFields;
        
        // Find which group's attendance was updated
        const groupId = Object.keys(updatedFields).find(key => 
          key.startsWith('customFieldValues.') && key.endsWith('.attendance')
        );
        
        if (groupId) {
          const attendance = updatedFields[groupId];
          
          // Broadcast the update to all connected clients
          wss.clients.forEach((client: WebSocketClient) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'attendance_update',
                orderId,
                groupId: groupId.split('.')[1], // Extract the actual groupId
                attendance
              }));
            }
          });
        }
      } catch (error) {
        console.error('Error processing change event:', error);
      }
    });

    console.log('MongoDB change stream started');
  } catch (error) {
    console.error('Error starting change stream:', error);
    // Attempt to reconnect after a delay
    setTimeout(startChangeStream, 5000);
  }
}

// Set up ping-pong to detect dead connections
const interval = setInterval(() => {
  wss.clients.forEach((ws: WebSocketClient) => {
    if (ws.isAlive === false) return ws.terminate();
    
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('connection', (ws: WebSocket) => {
  const client = ws as WebSocketClient;
  client.isAlive = true;
  
  client.on('pong', () => {
    client.isAlive = true;
  });
  
  client.on('close', () => {
    console.log('Client disconnected from WebSocket server');
  });
  
  console.log('Client connected to WebSocket server');
});

wss.on('close', () => {
  clearInterval(interval);
  mongoClient.close();
});

// Start the change stream
startChangeStream();

// Export for use in scripts
export default wss; 