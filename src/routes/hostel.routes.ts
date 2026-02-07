import express from 'express';

// @ts-ignore
import protectRoute from '../middleware/protectRoute.js';
// @ts-ignore
import { upload } from '../middleware/saveUploads.js';
import { HostelController } from '../controllers/hostel.controller.js';

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
