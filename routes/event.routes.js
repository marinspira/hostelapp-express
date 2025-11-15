import express from 'express';

import protectRoute from '../middleware/protectRoute.js';
import { createEvent, getAllEvents } from '../controllers/events.controllers.js';
import { upload } from '../middleware/saveUploads.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

router.post('/create', protectRoute, upload.array('images', 4), catchAsync(createEvent));

router.get('/:hostelId', protectRoute, catchAsync(getAllEvents));

export default router;
