const mongoose = require('mongoose');

// CRITICAL FOR SERVERLESS: Disable bufferCommands
// This prevents Mongoose from hanging for 10000ms when disconnected!
mongoose.set('bufferCommands', false);

let mongod = null;

const connectDB = async () => {
  // If already connected or connecting, reuse connection
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/garment_qms';

  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000, // Quickly fail if local/remote mongod is not running
    });
    console.log('✅ [Database] Successfully connected to MongoDB server');
  } catch (err) {
    console.warn(`⚠️ [Database] Could not connect to primary MongoDB: ${err.message}`);

    // In Vercel serverless, MongoMemoryServer cannot run due to binary/lambda restrictions
    if (process.env.VERCEL) {
      console.log('⚡ [Database:Serverless] Operating in resilient serverless in-memory mode.');
      return;
    }

    console.log('🚀 [Database] Initializing in-memory MongoDB fallback...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      console.log(`[Database] In-memory MongoDB booted at: ${memUri}`);

      await mongoose.connect(memUri);
      console.log('✅ [Database] Successfully connected to in-memory MongoDB instance');
    } catch (memErr) {
      console.warn('⚠️ [Database] In-memory MongoDB daemon not available. Controllers will use resilient in-memory store.');
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
    console.log('[Database] Database connection cleanly closed.');
  } catch (err) {
    console.error('[Database] Error disconnecting database:', err);
  }
};

module.exports = { connectDB, disconnectDB };
