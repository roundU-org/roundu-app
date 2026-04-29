import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("new_booking", (data) => {
      console.log("New booking received:", data.id);
      // Broadcast to all connected clients (in a real app, filter by location/role)
      socket.broadcast.emit("incoming_request", {
        id: `req-${data.id}`,
        customerName: data.customerName || "Customer",
        serviceId: data.serviceId,
        address: data.address || "Unknown Location",
        date: data.date,
        time: data.time,
        price: data.price,
        status: "pending",
        notes: data.notes
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
