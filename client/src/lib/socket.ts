import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "https://roundu-app.onrender.com";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  transports: ['websocket', 'polling'],
});
