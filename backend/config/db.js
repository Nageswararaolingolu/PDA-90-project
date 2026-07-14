const mongoose = require('mongoose');

let useMock = false;

const connectDB = async () => {
  try {
    // Attempt connecting with a fast 2.5s server selection timeout
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel-pg-db', {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    useMock = false;
  } catch (error) {
    console.warn(`MongoDB Connection Failed: ${error.message}`);
    console.log('>>> SYSTEM ALERT: Launching NestSync with In-Memory Mock Database fallback <<<');
    useMock = true;
    
    // Dynamically seed the mock database
    const mockDb = require('../models/mockDb');
    await mockDb.seedMockDb();
  }
};

const isMockMode = () => useMock;

module.exports = { connectDB, isMockMode };
