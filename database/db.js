const mongoose = require("mongoose");

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    cachedConnection = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/lifeOsDB",
      {
        serverSelectionTimeoutMS: 5000,
      },
    );
    console.log("MongoDB connected successfully");
    return cachedConnection;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
};

module.exports = connectDB;
