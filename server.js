import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import http from "http";

import connectToMongoDB from "./db/connectToMongoDB.js";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.js";
import guestRoutes from "./routes/guest.routes.js";
import hostelRoutes from "./routes/hostel.routes.js";
import roomRoutes from "./routes/room.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Criando servidor HTTP e instância do Socket.IO
const server = http.createServer(app);

// Define __dirname manualmente
const __filename = fileURLToPath(import.meta.url);
const backendFiles = path.dirname(__filename);
export const __dirname = path.dirname(`${backendFiles}/backend`);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/guest", guestRoutes);
app.use("/api/hostel", hostelRoutes)
app.use("/api/room", roomRoutes)
app.use("/api/reservation", reservationRoutes)

// Static files
const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));

const io = new Server(server, {
    cors: {
        origin: "http://localhost:8081",
        methods: ["GET", "POST"],
    },
});

// Evento de conexão do Socket.IO
io.on("connection", (socket) => {
    console.log("Usuário conectado:", socket.id);

     // Enviar histórico ao usuário quando ele conectar
     Message.find().sort({ timestamp: -1 }).limit(50)
     .then(messages => {
         socket.emit("chatHistory", messages);
     });

    socket.on("sendMessage", async (data) => {
        console.log("Nova mensagem recebida:", data);
        const savedMessage = await saveMessage(data);
        io.emit("receiveMessage", savedMessage);
    });

    socket.on("disconnect", () => {
        console.log("Usuário desconectado:", socket.id);
    });
});

// Iniciar o servidor HTTP e conectar ao MongoDB
server.listen(PORT, () => {
    connectToMongoDB();
    console.log(`Server running on port ${PORT}`);
});