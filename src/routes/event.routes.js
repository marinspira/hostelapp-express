import express from 'express';

import protectRoute from '../middleware/protectRoute.js';
import {
  createEvent,
  getAllEvents,
  getPublicEvents,
  getCurrentStayEvents,
  updateEvent,
  deleteEvent,
} from '../controllers/events.controllers.ts';
import { upload } from '../middleware/saveUploads.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

router.post('/create', protectRoute, upload.array('images', 4), catchAsync(createEvent));

router.put('/update/:id', protectRoute, upload.array('images', 4), catchAsync(updateEvent));

router.delete('/delete/:id', protectRoute, catchAsync(deleteEvent));

router.get('/public', protectRoute, catchAsync(getPublicEvents));

router.get('/current-stay', protectRoute, catchAsync(getCurrentStayEvents));

router.get('/:hostelId', protectRoute, catchAsync(getAllEvents));

export default router;
