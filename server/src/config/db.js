import mongoose from "mongoose";

export async function connectDB(uri) {
  try {
    mongoose.set("strictQuery", true);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed");
    console.error("message:", error.message);
    console.error("code:", error.code);
    throw error;
  }
}