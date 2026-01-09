import express from 'express';

import {
  logout,
  isAuthenticated,
  sendEmailCode,
  verifyEmailCode,
} from '../controllers/auth.controllers.js';
import protectRoute from '../middleware/protectRoute.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

router.post('/send-code', catchAsync(sendEmailCode));
router.post('/verify-code', catchAsync(verifyEmailCode));
router.post('/is-authenticated', protectRoute, catchAsync(isAuthenticated));
router.post('/logout', catchAsync(logout));

export default router;
