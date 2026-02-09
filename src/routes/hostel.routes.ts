import express from 'express';

import protectRoute from '../middleware/protectRoute';
import { upload } from '../middleware/saveUploads';
import { HostelController } from '../controllers/hostel.controller';

const router = express.Router();
const hostelController = new HostelController();

router.post('/create', protectRoute, upload.single('image'), async (req, res, next) => {
  try {
    const result = await hostelController.create(req as any);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.put('/update', protectRoute, upload.single('image'), async (req, res, next) => {
  try {
    const result = await hostelController.update(req as any);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
