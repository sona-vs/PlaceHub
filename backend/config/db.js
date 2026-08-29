const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/placehub';
    console.log(`Connecting to MongoDB: ${dbURI.replace(/\/\/.*@/, '//<credentials>@')}`);
    
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000 // 3 seconds timeout
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.warn(`Database connection failed: ${error.message}`);
    console.log('Attempting fallback: spinning up in-memory MongoDB database...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      
      // Store in env for future references
      process.env.MONGODB_URI = mongoUri;
      
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log(`In-Memory MongoDB connected: ${mongoUri}`);
    } catch (fallbackError) {
      console.error(`Failed to connect to in-memory fallback database: ${fallbackError.message}`);
      process.exit(1);
    }
  }

  // Auto-seeding check
  try {
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found in database. Auto-seeding demo data...');
      const seedData = require('../seed/seed');
      await seedData();
      console.log('Database auto-seeding completed!');
    } else {
      console.log(`Database already initialized with ${userCount} users.`);
    }
  } catch (seedError) {
    console.error(`Database check/auto-seeding failed: ${seedError.message}`);
  }
};

module.exports = connectDB;
