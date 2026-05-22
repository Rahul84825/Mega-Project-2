import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: null, select: false },
    googleId: { type: String, unique: true, sparse: true, select: false },
    isAdmin: { type: Boolean, default: false }
  },
  { timestamps: true }
);

/**
 * Automatically exclude password and googleId from toJSON/toObject conversions
 * Prevents accidental exposure of sensitive fields in API responses
 */
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.googleId;
    return ret;
  }
});

userSchema.set("toObject", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  }
});

/**
 * PERFORMANCE OPTIMIZATION: Database Indexes
 * Speeds up common email/ID lookups and admin queries
 */

// Note: `email` is already defined with `unique: true` on the field.
// Avoid duplicate index definitions to prevent Mongoose warnings.

// Index for admin user queries (dashboard statistics)
userSchema.index({ isAdmin: 1 });

// Compound index for admin creation date (get recent admins)
userSchema.index({ isAdmin: 1, createdAt: -1 });

const User = mongoose.model("User", userSchema);

export default User;
