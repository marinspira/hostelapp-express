import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import http from "http";
import helmet from 'helmet';
import logger from "./logs.js"
import morgan from "morgan";
import fs from 'fs';
import swaggerUi from "swagger-ui-express"
import swaggerJsdoc from "swagger-jsdoc"
import rateLimit from 'express-rate-limit';
import { logAnalyzer } from 'api-traffic-analyzer'

import connectToMongoDB from "./db/connectToMongoDB.js";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.js";
import guestRoutes from "./routes/guest.routes.js";
import hostelRoutes from "./routes/hostel.routes.js";
import roomRoutes from "./routes/room.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import stripeRoutes from "./routes/stripe.routes.js";
import eventRoutes from "./routes/event.routes.js";
import backofficeRoutes from "./routes/backoffice.routes.js";
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
app.use(logAnalyzer);

// Swagger definition (OpenAPI 3.0)
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'HostelApp API',
    version: '1.0.0',
    description:
      "To use protected endpoints, first call `POST /api/auth/login`. This will set a JWT cookie in your browser to authenticate subsequent requests.\n\n" +
      "🔐 Access Control:\n" +
      "- Some endpoints are only available when logged in as a **host**.\n" +
      "- Others require logging in as a **guest** — both roles can be selected during login at `/api/auth/login`.\n\n" +
      "⚠️ Notes:\n" +
      "1. There is a **rate limit of 20 requests per 15 minutes per IP** to protect the API from abuse.\n" +
      "2. **Cookies are being set for analytics purposes.**"
  },
};

  // Options for swagger-jsdoc
const options = {
    swaggerDefinition,
    apis: [
        './routes/*.js',
        './models/*.js', 
    ],
  };

  const swaggerSpec = swaggerJsdoc(options);

// Swagger route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(helmet());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/hostels", hostelRoutes)
app.use("/api/rooms", roomRoutes)
app.use("/api/reservations", reservationRoutes)
app.use("/api/chats", chatRoutes)
app.use("/api/stripe", stripeRoutes)
app.use("/api/events", eventRoutes)
app.use("/api/backoffice", backofficeRoutes)

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

// Reject requests with missing or fake user agents and limiter 
app.use((req, res, next) => {
    const userAgent = req.get('User-Agent');
    if (!userAgent || userAgent.length < 10) {
      return res.status(400).json({ error: 'Invalid user agent' });
    }
    next();
  });  

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                 // limit each IP to 20 requests per windowMs
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);

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
        // callback({ status: 'ok' });
    });

      // Simulate message reception
    socket.on('client_message', (data) => {
    console.log('📩 Received from client:', data);
    })

    socket.on("send_message", (data) => {
        socket.to(data.room).emit("receive_message", data);
        callback({ status: 'ok' });
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
});


// Iniciar o servidor HTTP e conectar ao MongoDB
server.listen(PORT, () => {
    connectToMongoDB();
    console.log(`Server running on port ${PORT}`);
});