import mongoose from 'mongoose';

// Function to connect to MongoDB database
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10, // Maximum number of simultaneous connections
      socketTimeoutMS: 45000, // Close idle connections after 45 seconds
      family: 4 // Use IPv4 only
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process on connection failure
  }
};

export default connect;