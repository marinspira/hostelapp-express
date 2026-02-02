import express from 'express';

import { EventsController } from '../controllers/events.controller.ts';
// @ts-ignore
import protectRoute from '../middleware/protectRoute.js';
// @ts-ignore
import { upload } from '../middleware/saveUploads.js';
// @ts-ignore
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();
const eventsController = new EventsController();

router.post(
  '/create',
  protectRoute,
  upload.array('images', 4),
  catchAsync(eventsController.create.bind(eventsController))
);

// router.put('/update/:id', protectRoute, upload.array('images', 4), catchAsync(updateEvent));

// router.delete('/delete/:id', protectRoute, catchAsync(deleteEvent));

// router.post('/join/:id', protectRoute, catchAsync(joinEvent));

// router.delete('/leave/:id', protectRoute, catchAsync(leaveEvent));

// router.get('/public', protectRoute, catchAsync(getPublicEvents));

// router.get('/current-stay', protectRoute, catchAsync(getCurrentStayEvents));

// router.get('/hostel/:hostelId', protectRoute, catchAsync(getAllEvents));

// router.get('/:id', protectRoute, catchAsync(getEventById));

export default router;
