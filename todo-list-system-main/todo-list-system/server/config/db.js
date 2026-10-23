// =============================================================
// config/db.js
// Connects the Node.js server to MongoDB using Mongoose.
// The connection string comes from the .env file (MONGODB_URI),
// so it is NEVER hardcoded in the source code.
// =============================================================
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is missing. Copy .env.example to .env and set it.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error) {
    console.error('Could not connect to MongoDB:', error.message);
    console.error('Check that MongoDB is running and MONGODB_URI in .env is correct.');
    process.exit(1);
  }

  // Log problems that happen AFTER the first successful connection
  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));
}

module.exports = connectDB;
