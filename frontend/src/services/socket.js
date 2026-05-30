import { io } from "socket.io-client";

const getSocketUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1" && !hostname.startsWith("192.168.")) {
      return "https://mega-project-2-b880.onrender.com";
    }
  }
  const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return rawUrl.replace(/\/api\/?$/, "");
};

const socketBaseUrl = getSocketUrl();

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
