import { io } from "socket.io-client";

const socketBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

export const socket = io(socketBaseUrl, {
  autoConnect: false
});

socket.on("connect", () => {
  console.log("📡 SOCKET_CONNECTED:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("📡 SOCKET_DISCONNECTED:", reason);
});

socket.on("connect_error", (error) => {
  console.error("📡 SOCKET_CONNECTION_ERROR:", error.message);
});
