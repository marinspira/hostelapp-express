import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import http from "http";
import logger from "./logs.js"
import morgan from "morgan";
import fs from 'fs';
import swaggerUi from "swagger-ui-express"
import swaggerJsdoc from "swagger-jsdoc"

import connectToMongoDB from "./db/connectToMongoDB.js";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.js";
import guestRoutes from "./routes/guest.routes.js";
import hostelRoutes from "./routes/hostel.routes.js";
import roomRoutes from "./routes/room.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import stripeRoutes from "./routes/stripe.routes.js";
import eventRoutes from "./routes/event.routes.js";
import Stripe from 'stripe';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Winston settings
console.log = (...args) => logger.info(args.join(' '));
console.error = (...args) => logger.error(args.join(' '));

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

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


// Swagger definition (OpenAPI 3.0)
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
      title: 'HostelApp API',
      version: '1.0.0',
      description: 'API using Swagger with Express',
    },
    servers: [
      {
        url: 'http://localhost:8000',
      },
    ],
  };

  // Options for swagger-jsdoc
const options = {
    swaggerDefinition,
    apis: ['./routes/*.js'],
  };

  const swaggerSpec = swaggerJsdoc(options);

// Swagger route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/guest", guestRoutes);
app.use("/api/hostel", hostelRoutes)
app.use("/api/room", roomRoutes)
app.use("/api/reservation", reservationRoutes)
app.use("/api/conversation", conversationRoutes)
app.use("/api/stripe", stripeRoutes)
app.use("/api/event", eventRoutes)

// Static files
const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));

// Middleware HTTP logs morgan + winston
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

app.use(morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

// Websocket
const io = new Server(server, {
    cors: {
        origin: "http://localhost:8081",
        methods: ["GET", "POST"],
    },
});

// Evento de conexão do Socket.IO
io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("join_room", (data) => {
        socket.join(data);
    });

    socket.on("send_message", (data) => {
        socket.to(data.room).emit("receive_message", data);
    });
});


// Iniciar o servidor HTTP e conectar ao MongoDB
server.listen(PORT, () => {
    connectToMongoDB();
    console.log(`Server running on port ${PORT}`);
});