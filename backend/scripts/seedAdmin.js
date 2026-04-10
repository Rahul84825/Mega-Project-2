import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const run = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_FALLBACK;
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!mongoUri) {
    throw new Error("MONGODB_URI or MONGODB_URI_FALLBACK is required");
  }

  if (!name || !email || !password) {
    throw new Error("ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required");
  }

  await mongoose.connect(mongoUri);

  const hashedPassword = await bcrypt.hash(password, 12);
  const normalizedEmail = email.toLowerCase().trim();

  await User.findOneAndUpdate(
    { email: normalizedEmail },
    {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      googleId: null,
      isAdmin: true
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Admin user seeded for ${normalizedEmail}`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Admin seeding failed:", error.message);

  try {
    await mongoose.disconnect();
  } catch (_disconnectError) {
    // Ignore disconnect errors.
  }

  process.exit(1);
});