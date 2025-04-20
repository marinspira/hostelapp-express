import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { createHostelStripeAccount, finalizeStripeConnection } from "../controllers/stripe.controllers.js"

const router = express.Router()

router.post("/create-hostel-stripe-account", protectRoute, createHostelStripeAccount)
router.get('/success', finalizeStripeConnection);

export default router