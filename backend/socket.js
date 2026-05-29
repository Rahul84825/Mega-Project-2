import { Server } from "socket.io";

let io;

const getFrontendOrigin = () => {
  const url = process.env.FRONTEND_URL || "http://localhost:5173";
  return url.replace(/\/$/, "");
};

const allowedOrigins = [
  getFrontendOrigin(),
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

    return next();
  });

  io.on("connection", (socket) => {
    const role = socket.handshake.auth?.role || socket.data?.role || "user";

    if (role === "admin") {
      console.log(`📡 SOCKET_CONNECTED (Admin): ${socket.id}`);
    } else {
      console.log(`📡 SOCKET_CONNECTED: ${socket.id}`);
    }

    socket.on("disconnect", (reason) => {
      console.log(`📡 SOCKET_DISCONNECTED: ${socket.id} (${reason})`);
    });
  });

  return io;
};

export const getIo = () => io;
