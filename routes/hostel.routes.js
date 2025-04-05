import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { createHostel } from "../controllers/hostel.controllers.js"

const router = express.Router()

// Host details
router.post("/create", protectRoute, createHostel)

export default router