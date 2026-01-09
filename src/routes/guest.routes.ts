import express from 'express';

// @ts-ignore
import {
  deleteGuestProfileImage,
  getGuest,
  getHome,
  saveGuest,
  saveGuestProfileImages,
  searchGuest,
  updateGuest,
} from '../controllers/guest.controllers.js';
// @ts-ignore
import protectRoute from '../middleware/protectRoute.js';
// @ts-ignore
import { upload } from '../middleware/saveUploads.js';
// @ts-ignore
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

router.post('/create', protectRoute, upload.single('photo'), catchAsync(saveGuest));

router.get('/me', protectRoute, catchAsync(getGuest));

router.put('/update', protectRoute, catchAsync(updateGuest));

router.get('/home', protectRoute, catchAsync(getHome));

router.get('/:username', protectRoute, catchAsync(searchGuest));

// Guest images
router.post(
  '/save-images',
  protectRoute,
  upload.single('photo'),
  catchAsync(saveGuestProfileImages)
);
router.delete('/delete-images', protectRoute, catchAsync(deleteGuestProfileImage));

export default router;
