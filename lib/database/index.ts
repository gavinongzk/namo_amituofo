import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = (global as any).mongoose || { conn: null, promise: null };

// --- Add connection event listeners ---
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});
mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose disconnected from MongoDB');
});
mongoose.connection.on('reconnected', () => {
  console.log('Mongoose reconnected to MongoDB');
});

// --- Retry logic for initial connection ---
async function connectWithRetry(uri: string, options: any, retries = 3, delay = 1000): Promise<typeof mongoose> {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await mongoose.connect(uri, options);
    } catch (err) {
      lastError = err;
      console.error(`MongoDB connection attempt ${attempt} failed:`, err);
      if (attempt < retries) {
        await new Promise(res => setTimeout(res, delay * attempt)); // Exponential backoff
      }
    }
  }
  throw lastError;
}

export const connectToDatabase = async () => {
  if (cached.conn) return cached.conn;

  if(!MONGODB_URI) throw new Error('MONGODB_URI is missing');

  cached.promise = cached.promise || connectWithRetry(MONGODB_URI, {
    dbName: 'evently',
    bufferCommands: false,
  });

  cached.conn = await cached.promise;

  return cached.conn;
}