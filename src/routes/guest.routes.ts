import express from 'express';

import { GuestController } from '../controllers/guest.controller';
import protectRoute from '../middleware/protectRoute';
import { upload } from '../middleware/saveUploads';

const router = express.Router();
const guestController = new GuestController();

router.post('/create', protectRoute, upload.array('image', 1), async (req, res, next) => {
  try {
    const result = await guestController.create(req as any);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.put('/update', protectRoute, upload.array('images', 4), async (req, res, next) => {
  try {
    const result = await guestController.update(req as any);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
