import express from 'express';

import protectRoute from '../middleware/protectRoute.js';
import { createHostel, getAllGuests, getHostel } from '../controllers/hostel.controllers.js';
import { upload } from '../middleware/saveUploads.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

// Create a hostel
router.post('/create', protectRoute, upload.single('photo'), catchAsync(createHostel));

// Get hostel of logged in host user
router.get('/mine', protectRoute, catchAsync(getHostel));

// Get all guests staying in the hostel
router.get('/guests', protectRoute, catchAsync(getAllGuests));

export default router;
