import multer from "multer";
import path from "path";

export const upload = multer({ storage });

// Save uploads
const storage = multer.diskStorage({
  destination: (req, cb) => {
    const userId = req.user._id;
    const uploadDir = `uploads/users/${userId}`;
    cb(null, path.join(__dirname, '..', uploadDir));
  },
  filename: (file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });