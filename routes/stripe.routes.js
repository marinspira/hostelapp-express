import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { createHostelStripeAccount, finalizeStripeConnection } from "../controllers/stripe.controllers.js"
import catchAsync from "../utils/catchAsync.js"

const router = express.Router()

router.post("/create-hostel-stripe-account", protectRoute, catchAsync(createHostelStripeAccount))
router.get('/success', catchAsync(finalizeStripeConnection));

export default router