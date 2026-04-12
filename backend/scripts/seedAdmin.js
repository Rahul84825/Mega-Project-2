import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const DATABASE_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_FALLBACK || process.env.MONGO_URI;
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "activegamer789@gmail.com").toLowerCase().trim();
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin User";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Rahulbhai@12";

const seedAdmin = async () => {
  try {
    if (!DATABASE_URI) {
      throw new Error("Missing database URI. Set MONGODB_URI in backend/.env");
    }

    await mongoose.connect(DATABASE_URI);

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const admin = await User.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        googleId: null,
        isAdmin: true
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    console.log(`Admin ensured for ${admin.email} with isAdmin=${admin.isAdmin === true}`);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();