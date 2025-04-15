import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { createHostel, getAllGuests } from "../controllers/hostel.controllers.js"

const router = express.Router()

// Host details
router.post("/create", protectRoute, createHostel)

// Get all guests staying in the hostel
router.get("/getAllGuests", protectRoute, getAllGuests)

export default router