import express from 'express';

import protectRoute from '../middleware/protectRoute.js';
import {
  createEvent,
  getAllEvents,
  getPublicEvents,
  getCurrentStayEvents,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
} from '../controllers/events.controllers.ts';
import { upload } from '../middleware/saveUploads.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

router.post('/create', protectRoute, upload.array('images', 4), catchAsync(createEvent));

router.put('/update/:id', protectRoute, upload.array('images', 4), catchAsync(updateEvent));

router.delete('/delete/:id', protectRoute, catchAsync(deleteEvent));

router.post('/join/:id', protectRoute, catchAsync(joinEvent));

router.delete('/leave/:id', protectRoute, catchAsync(leaveEvent));

router.get('/public', protectRoute, catchAsync(getPublicEvents));

router.get('/current-stay', protectRoute, catchAsync(getCurrentStayEvents));

router.get('/:hostelId', protectRoute, catchAsync(getAllEvents));

export default router;
