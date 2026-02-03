import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { URL } from 'url';
import express, { json, urlencoded } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import eventRoutes from './routes/event.routes.ts';
// @ts-ignore
import errorHandler from './middleware/errorHandler.js';
import { RegisterRoutes } from './routes/routes.ts';

const app = express();
dotenv.config();

// Define __dirname manualmente
const __filename = fileURLToPath(import.meta.url);
const srcDir = path.dirname(__filename);
export const __dirname = path.dirname(srcDir);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// Swagger route
const openApiSpec = JSON.parse(
  fs.readFileSync(new URL('./docs/swagger.json', import.meta.url), 'utf-8')
);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// Routes
app.use('/api/events', eventRoutes);
// app.use('/api/guests', guestRoutes);
// app.use('/api/hostels', hostelRoutes);
// app.use('/api/reservations', reservationRoutes);
// app.use('/api/notifications', notificationRoutes);

app.use(
  urlencoded({
    extended: true,
  })
);
app.use(json());

RegisterRoutes(app);

// Static files
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Middleware HTTP logs morgan + winston
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// @ts-ignore
app.use(errorHandler);

export default app;
