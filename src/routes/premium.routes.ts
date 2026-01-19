import express from 'express';

import { updatePremiumStatus, getPremiumStatus } from '../controllers/premium.controllers.ts';
// @ts-ignore
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

// Get current user's premium status
router.get('/status', protectRoute, getPremiumStatus);

// Update premium status (for testing purposes)
router.put('/status', protectRoute, updatePremiumStatus);

export default router;
