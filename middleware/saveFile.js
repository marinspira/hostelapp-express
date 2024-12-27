import multer from "multer";
import path from "path";

// Save uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user._id;
    const uploadDir = `uploads/users/${userId}`;
    cb(null, path.join(__dirname, '..', uploadDir));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

export const upload = multer({ storage });