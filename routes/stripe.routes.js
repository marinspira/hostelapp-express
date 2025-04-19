import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { createHostelStripeAccount, finalizeStripeConnection } from "../controllers/stripe.controllers.js"

const router = express.Router()

router.post("/createHostelStripeAccount", protectRoute, createHostelStripeAccount)
router.get('/stripeSuccess', finalizeStripeConnection);

export default router