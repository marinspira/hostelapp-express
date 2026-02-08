import path from 'path';
import fs from 'fs';
// __dirname is available in CommonJS, removing imports not needed for CommonJS
// import { fileURLToPath } from 'url';
// import { URL } from 'url';

import express, { json, urlencoded } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import eventRoutes from './routes/event.routes';
// @ts-ignore
import errorHandler from './middleware/errorHandler.js';
import { RegisterRoutes } from './routes/routes';
import guestRoutes from './routes/guest.routes';
import hostelRoutes from './routes/hostel.routes';

const app = express();
dotenv.config();

// __dirname is available globally in CommonJS
export { __dirname };

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// Swagger route - only in development
if (process.env.NODE_ENV !== 'production') {
  try {
    const openApiSpec = JSON.parse(
      fs.readFileSync(path.join(__dirname, './docs/swagger.json'), 'utf-8')
    );
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  } catch (error) {
    console.warn(
      'Swagger documentation not available:',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// Routes
app.use('/api/events', eventRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/hostels', hostelRoutes);
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
if (process.env.NODE_ENV === 'production') {
  const uploadsPath = path.join(process.cwd(), 'wwwroot', 'uploads');
  console.log('Serving static files from:', uploadsPath);
  app.use('/uploads', express.static(uploadsPath));
} else {
  const uploadsPath = path.join(__dirname, 'uploads');
  app.use('/uploads', express.static(uploadsPath));
}

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
