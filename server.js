import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import guestRoutes from "./routes/guest.routes.js";
import connectToMongoDB from "./db/connectToMongoDB.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Configure environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Define __dirname manually
const __filename = fileURLToPath(import.meta.url);
const backendFiles = path.dirname(__filename);
export const __dirname = path.dirname(`${backendFiles}/backend`); 

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(express.urlencoded({
 extended: true,
 })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/guest", guestRoutes);

// Static files
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Start server
app.listen(PORT, () => {
    connectToMongoDB();
    console.log(`Server running on port ${PORT}`);
});