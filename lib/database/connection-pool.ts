import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

class DatabaseConnectionPool {
  private static instance: DatabaseConnectionPool;
  private connectionPromise: Promise<typeof mongoose> | null = null;
  private lastConnectionTime = 0;
  private readonly CONNECTION_TIMEOUT = 30000; // 30 seconds
  private isConnecting = false;

  static getInstance(): DatabaseConnectionPool {
    if (!DatabaseConnectionPool.instance) {
      DatabaseConnectionPool.instance = new DatabaseConnectionPool();
    }
    return DatabaseConnectionPool.instance;
  }

  async getConnection(): Promise<typeof mongoose> {
    const now = Date.now();
    
    // Reuse existing connection if it's still valid
    if (this.connectionPromise && (now - this.lastConnectionTime) < this.CONNECTION_TIMEOUT) {
      try {
        // Test if connection is still alive
        const connection = await this.connectionPromise;
        if (connection.connection.readyState === 1) {
          return connection;
        }
      } catch (error) {
        console.warn('Connection test failed, creating new connection');
      }
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      return this.connectionPromise!;
    }

    // Create new connection
    this.isConnecting = true;
    this.connectionPromise = this.createConnection();
    this.lastConnectionTime = now;
    
    try {
      const connection = await this.connectionPromise;
      this.isConnecting = false;
      return connection;
    } catch (error) {
      this.isConnecting = false;
      this.connectionPromise = null;
      throw error;
    }
  }

  private async createConnection(): Promise<typeof mongoose> {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }

    // Skip database connection during build time
    if (process.env.NODE_ENV === 'production' && !MONGODB_URI) {
      console.log('Skipping database connection during build time');
      return mongoose;
    }

    // Skip during Vercel build
    if (process.env.VERCEL_ENV === 'production' && !MONGODB_URI) {
      console.log('Skipping database connection during Vercel build');
      return mongoose;
    }

    try {
      const options = {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        maxIdleTimeMS: 30000,
        retryWrites: true,
        w: 'majority' as const
      };

      const connection = await mongoose.connect(MONGODB_URI, options);
      
      // Set up connection event listeners
      connection.connection.on('connected', () => {
        console.log('Mongoose connected to MongoDB (pooled)');
      });
      
      connection.connection.on('error', (err) => {
        console.error('Mongoose connection error (pooled):', err);
      });
      
      connection.connection.on('disconnected', () => {
        console.log('Mongoose disconnected from MongoDB (pooled)');
      });

      return connection;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async closeConnection(): Promise<void> {
    if (this.connectionPromise) {
      try {
        const connection = await this.connectionPromise;
        await connection.disconnect();
        this.connectionPromise = null;
        this.lastConnectionTime = 0;
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }
}

// Export singleton instance
export const connectionPool = DatabaseConnectionPool.getInstance();

// Enhanced connectToDatabase function that uses the pool
export const connectToDatabase = async (): Promise<typeof mongoose> => {
  return connectionPool.getConnection();
};
