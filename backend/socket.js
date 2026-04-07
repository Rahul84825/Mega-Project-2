import { Server } from "socket.io";

let io;

const getFrontendOrigin = () => process.env.FRONTEND_URL || "http://localhost:5173";

export const initializeSocket = (httpServer) => {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: getFrontendOrigin(),
      credentials: true
    },
    allowRequest: (req, callback) => {
      const requestOrigin = req.headers.origin;
      const allowedOrigin = getFrontendOrigin();

      if (!requestOrigin || requestOrigin !== allowedOrigin) {
        return callback("Origin not allowed by Socket.IO CORS policy", false);
      }

      return callback(null, true);
    }
  });

  io.use((socket, next) => {
    const requestOrigin = socket.handshake.headers.origin;
    const allowedOrigin = getFrontendOrigin();

    if (requestOrigin !== allowedOrigin) {
      return next(new Error("Unauthorized socket origin"));
    }

    return next();
  });

  io.on("connection", (socket) => {
    const role = socket.handshake.auth?.role || socket.data?.role || "user";

    if (role === "admin") {
      console.log(`Admin connected: ${socket.id}`);
    } else {
      console.log(`Socket connected: ${socket.id}`);
    }

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

export const getIo = () => io;
