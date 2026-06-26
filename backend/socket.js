import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

const getFrontendOrigin = () => {
  const url = process.env.FRONTEND_URL || "http://localhost:5173";
  return url.replace(/\/$/, "");
};

const allowedOrigins = [
  getFrontendOrigin(),
  "https://mithaipune.com",
  "https://www.mithaipune.com",
  "http://mithaipune.com",
  "http://www.mithaipune.com",
  "https://mithaiworld.vercel.app",
  "https://mega-project-2.vercel.app"
];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  return allowedOrigins.includes(origin.replace(/\/$/, ""));
};

export const initializeSocket = (httpServer) => {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"), false);
        }
      },
      credentials: true
    },
    allowRequest: (req, callback) => {
      const requestOrigin = req.headers.origin;

      if (!isOriginAllowed(requestOrigin)) {
        return callback("Origin not allowed by Socket.IO CORS policy", false);
      }

      return callback(null, true);
    }
  });

  io.use((socket, next) => {
    const requestOrigin = socket.handshake.headers.origin;

    if (!isOriginAllowed(requestOrigin)) {
      return next(new Error("Unauthorized socket origin"));
    }

    // Hardened: Verify JWT token if provided in handshake auth
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.data = {
          userId: decoded.userId,
          isAdmin: decoded.isAdmin === true
        };
      } catch (err) {
        console.warn(`⚠️ Socket auth token verification failed: ${err.message}`);
        // Allow unauthenticated/guest sockets to connect for public events (e.g., stock:updated),
        // but do not grant them admin status or join them to the admin room.
      }
    }

    return next();
  });

  io.on("connection", (socket) => {
    const isAdmin = socket.data?.isAdmin === true;

    if (isAdmin) {
      socket.join("admin-room");
      console.log(`📡 SOCKET_CONNECTED (Admin - Joined Room): ${socket.id} (User: ${socket.data.userId})`);
    } else {
      console.log(`📡 SOCKET_CONNECTED (Guest/Customer): ${socket.id}`);
    }

    socket.on("disconnect", (reason) => {
      console.log(`📡 SOCKET_DISCONNECTED: ${socket.id} (${reason})`);
    });
  });

  return io;
};

export const getIo = () => io;
