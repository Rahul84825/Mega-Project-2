import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const tokenExpiry = "7d";

const createToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      isAdmin: Boolean(user.isAdmin)
    },
    process.env.JWT_SECRET,
    { expiresIn: tokenExpiry }
  );
};

const buildUserPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  isAdmin: Boolean(user.isAdmin),
  googleId: user.googleId || null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const buildLoginUserPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  isAdmin: user.isAdmin === true
});

const getGoogleClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  return new OAuth2Client(clientId);
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    const existingUser = await User.findOne({ email: String(email || "").toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already in use"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isAdmin: false
    });

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      token,
      user: buildUserPayload(user)
    });
  } catch (error) {
    return next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || "").toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select("+password +googleId");

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      token,
      user: buildLoginUserPayload(user)
    });
  } catch (error) {
    return next(error);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body || {};
    const client = getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    if (!payload?.email) {
      return res.status(401).json({
        success: false,
        message: "Unable to verify Google account"
      });
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase().trim();
    const name = payload.name || payload.given_name || email.split("@")[0];

    let user = await User.findOne({
      $or: [{ googleId }, { email }]
    }).select("+password +googleId");

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
      }

      if (!user.name && name) {
        user.name = name;
      }

      if (!user.email) {
        user.email = email;
      }

      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        password: null,
        isAdmin: false
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      token,
      user: buildUserPayload(user)
    });
  } catch (error) {
    if (error?.message?.includes("GOOGLE_CLIENT_ID")) {
      return res.status(500).json({
        success: false,
        message: "Google authentication is not configured"
      });
    }

    if (error?.message) {
      return res.status(401).json({
        success: false,
        message: "Invalid Google token"
      });
    }

    return next(error);
  }
};
