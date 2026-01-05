import path from 'path';
import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import rateLimit from 'express-rate-limit';
import { logAnalyzer } from 'api-traffic-analyzer';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import Stripe from 'stripe';

import openApiSpec from './swagger/index.js';
import logger from './logs.js';
import connectToMongoDB from './db/connectToMongoDB.js';
import authRoutes from './src/routes/auth.routes.js';
import guestRoutes from './src/routes/guest.routes.js';
import hostelRoutes from './src/routes/hostel.routes.js';
import roomRoutes from './src/routes/room.routes.js';
import reservationRoutes from './src/routes/reservation.routes.js';
import chatRoutes from './src/routes/chat.routes.js';
import stripeRoutes from './src/routes/stripe.routes.js';
import eventRoutes from './src/routes/event.routes.js';
import backofficeRoutes from './src/routes/backoffice.routes.js';
import errorHandler from './src/middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Winston settings
console.log = (...args) => {
  const message = args
    .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
    .join(' ');
  logger.info(message);
};

console.error = (...args) => {
  const message = args
    .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
    .join(' ');
  logger.error(message);
};

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

// Swagger route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use(helmet());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/backoffice', backofficeRoutes);

// Static files
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Middleware HTTP logs morgan + winston
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message.trim()),
    },
  })
);

app.use(errorHandler);

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
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Websocket
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:8000',
    methods: ['GET', 'POST'],
  },
});

// Socket.IO events
io.on('connection', socket => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('join_room', data => {
    socket.join(data);
  });

  // Simulate message reception
  socket.on('client_message', data => {
    console.log('📩 Received from client:', data);
  });

  socket.on('send_message', data => {
    socket.to(data.room).emit('receive_message', data);
    // callback({ status: 'ok' });
  });

  // Typing indicator events
  socket.on('typing', data => {
    try {
      socket.to(data.room).emit('user_typing', { room: data.room, senderName: data.senderName });
    } catch (err) {
      console.error('Error broadcasting typing event', err);
    }
  });

  socket.on('stop_typing', data => {
    try {
      socket.to(data.room).emit('user_stop_typing', {
        room: data.room,
        senderName: data.senderName,
      });
    } catch (err) {
      console.error('Error broadcasting stop_typing event', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  connectToMongoDB();
  console.log(`Server running on port ${PORT}`);
});
