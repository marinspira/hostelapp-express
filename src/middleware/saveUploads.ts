import path from 'path';
import fs from 'fs';

import { Request } from 'express';
import multer from 'multer';
import { Express } from 'express-serve-static-core';

interface AuthenticatedRequest extends Request {
  user?: {
    _id: any;
  };
}

const projectRoot = process.cwd();

const storage = multer.diskStorage({
  destination: (
    req: AuthenticatedRequest,
    file: Express.Multer.File,   
    cb: (_error: Error | null, _destination: string) => void
  ) => {
    const userId = req.user?._id;
    const user = userId.toString();
    const uploadDir = path.join(projectRoot, 'uploads', 'users', user);

    fs.mkdirSync(uploadDir, { recursive: true });

    cb(null, uploadDir);
  },
  filename: (
    req: AuthenticatedRequest,  
    file: Express.Multer.File,   
    cb: (_error: Error | null, _filename: string) => void
  ) => {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage: storage });

export const getRelativeFilePath = (req: AuthenticatedRequest, file: any): string => {
  const userId = req.user?._id.toString();
  return path.join('uploads', 'users', userId, file.originalname);
};
