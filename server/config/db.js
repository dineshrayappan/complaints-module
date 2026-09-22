const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/garment_qms';

  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quickly fall back if local mongod is not running
    });
    console.log('✅ [Database] Successfully connected to MongoDB server');
  } catch (err) {
    console.warn('⚠️ [Database] Could not connect to local/external MongoDB daemon.');
    console.log('🚀 [Database] Initializing high-performance in-memory MongoDB server fallback...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      console.log(`[Database] In-memory MongoDB booted at: ${memUri}`);
      
      await mongoose.connect(memUri);
      console.log('✅ [Database] Successfully connected to in-memory MongoDB instance');
    } catch (memErr) {
      console.error('❌ [Database] Failed to initialize in-memory MongoDB:', memErr.message);
      process.exit(1);
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
