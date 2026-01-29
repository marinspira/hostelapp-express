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

import openApiSpec from './swagger/index.js';
import logger from './logs.js';
import connectToMongoDB from './src/db/connectToMongoDB.js';
import authRoutes from './src/routes/auth.routes.js';
import guestRoutes from './src/routes/guest.routes.ts';
import hostelRoutes from './src/routes/hostel.routes.js';
import reservationRoutes from './src/routes/reservation.routes.js';
import notificationRoutes from './src/routes/notification.routes.js';
import eventRoutes from './src/routes/event.routes.js';
import errorHandler from './src/middleware/errorHandler.js';
import { startAutomaticCheckoutJob } from './src/jobs/automaticCheckout.job.ts';

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
app.use(logAnalyzer);
app.use(helmet());

// Swagger route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/events', eventRoutes);

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

server.listen(PORT, () => {
  connectToMongoDB();
  startAutomaticCheckoutJob();
  console.log(`Server running on port ${PORT}`);
});
