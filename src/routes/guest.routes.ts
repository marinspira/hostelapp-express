import express from 'express';
// @ts-ignore
import { GuestController } from '../controllers/guest.controller.ts';
// @ts-ignore
import protectRoute from '../middleware/protectRoute.js';
// @ts-ignore
import { upload } from '../middleware/saveUploads.js';
// @ts-ignore
import catchAsync from '../utils/catchAsync.js';

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

router.put('/:id/update', protectRoute, upload.array('images', 4), async (req, res, next) => {
  try {
    const result = await guestController.update(req as any, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
