const mongoose = require("mongoose");
const { MONGO_URI } = require("./env");

const connectDB = async () => {
  let mongoHost = "unknown";

  try {
    mongoHost = new URL(MONGO_URI).host;
  } catch {
    mongoHost = "invalid-uri";
  }

  console.log("[startup] connecting to MongoDB", {
    mongoHost,
    hasMongoUri: Boolean(MONGO_URI),
  });

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error", {
      name: error.name,
      message: error.message,
      code: error.code,
    });
    throw error;
  }
};

module.exports = connectDB;
