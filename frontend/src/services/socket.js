import { io } from "socket.io-client";
import { getSocketUrl } from "./utils/backendUrl";

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

socket.io.on("reconnect", (attempt) => {
  console.log("📡 SOCKET_RECONNECTED:", attempt);
});

socket.on("connect_error", (error) => {
  console.error("📡 SOCKET_CONNECTION_ERROR:", error.message);
});
