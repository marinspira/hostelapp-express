import express from 'express';

import { EventsController } from '../controllers/events.controller.ts';
// @ts-ignore
import protectRoute from '../middleware/protectRoute.js';
// @ts-ignore
import { upload } from '../middleware/saveUploads.js';

const router = express.Router();
const eventsController = new EventsController();

router.post('/create', protectRoute, upload.array('images', 4), async (req, res, next) => {
  try {
    const result = await eventsController.create(req as any);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.put('/:id/update', protectRoute, upload.array('images', 4), async (req, res, next) => {
  try {
    const result = await eventsController.update(req as any, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
