import mongoose from "mongoose";

export const connectDB = async (mongoUri) => {
  if (!mongoUri) {
    throw new Error("MongoDB URI is required");
  }

  await mongoose.connect(mongoUri);
};
