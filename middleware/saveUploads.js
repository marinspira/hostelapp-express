import multer from "multer";
import path from "path";
import fs from 'fs';
import { __dirname } from "../server.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user._id;
    const user = userId.toString()
    const uploadDir = path.join(__dirname, 'uploads', 'users', user);

    fs.mkdirSync(uploadDir, { recursive: true });

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

export const upload = multer({ storage: storage });

export const getRelativeFilePath = (req, file) => {
  const userId = req.user._id.toString();
  return path.join('uploads', 'users', userId, file.originalname); 
};