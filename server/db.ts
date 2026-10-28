import mongoose from 'mongoose';
import { config } from './config';

export let isConnectedToMongo = false;

export async function connectDB(): Promise<boolean> {
  const uri = config.mongoUri;

  if (!uri) {
    console.log('[TraceCrop DB] MONGO_URI not configured. Operating in in-memory fallback mode.');
    isConnectedToMongo = false;
    return false;
  }

  // Validate scheme
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    console.warn('[TraceCrop DB] MONGO_URI does not start with mongodb:// or mongodb+srv://. Operating in in-memory fallback mode.');
    isConnectedToMongo = false;
    return false;
  }

  // Check for placeholder credentials or template domains
  if (uri.includes('<username>') || uri.includes('<password>') || uri.includes('cluster0.abcde.mongodb.net')) {
    console.log('[TraceCrop DB] Placeholder MONGO_URI credentials or demo domain detected. Operating in in-memory fallback mode.');
    isConnectedToMongo = false;
    return false;
  }

  try {
    console.log('[TraceCrop DB] Attempting connection to MongoDB Atlas...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3500,
      connectTimeoutMS: 4000,
    });
    isConnectedToMongo = true;
    console.log('[TraceCrop DB] Connected successfully to MongoDB Atlas.');
    return true;
  } catch (err: any) {
    console.warn('[TraceCrop DB] MongoDB Atlas connection could not be established:', err.message);
    console.log('[TraceCrop DB] Operating in high-fidelity in-memory database store.');
    isConnectedToMongo = false;
    return false;
  }
}
