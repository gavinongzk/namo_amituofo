import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = (global as any).mongoose || { conn: null, promise: null };

// --- Add connection event listeners ---
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});
mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err)
});
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
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
  // Skip database connection during build time to prevent timeouts
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production' && !process.env.MONGODB_URI) {
    console.log('Skipping database connection during build time');
    return null;
  }

  // Also skip during build process
  if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
    console.log('Skipping database connection during build process');
    return null;
  }

  // Skip during Vercel build
  if (process.env.VERCEL_ENV && !process.env.MONGODB_URI) {
    console.log('Skipping database connection during Vercel build');
    return null;
  }

  if (cached.conn) return cached.conn;

  if(!MONGODB_URI) {
    console.log('MONGODB_URI is missing, skipping database connection');
    return null;
  }

  cached.promise = cached.promise || connectWithRetry(MONGODB_URI, {
    dbName: 'evently',
    bufferCommands: false,
    maxPoolSize: 10, // Limit connection pool size
    serverSelectionTimeoutMS: 5000, // 5 second timeout for server selection
    socketTimeoutMS: 45000, // 45 second timeout for socket operations
    connectTimeoutMS: 10000, // 10 second timeout for initial connection
  });

  cached.conn = await cached.promise;

  return cached.conn;
}