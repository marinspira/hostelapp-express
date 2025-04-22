import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { createHostel, getAllGuests, getHostel } from "../controllers/hostel.controllers.js"
import { upload } from "../middleware/saveUploads.js"

const router = express.Router()

// Host details
router.post("/create", protectRoute, upload.single('photo'), createHostel)
router.get("/get", protectRoute, getHostel)

// Get all guests staying in the hostel
router.get("/getAllGuests", protectRoute, getAllGuests)

export default router