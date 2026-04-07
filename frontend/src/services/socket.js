import { io } from "socket.io-client";

const socketBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

export const socket = io(socketBaseUrl, {
  autoConnect: false
});
