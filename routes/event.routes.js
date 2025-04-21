import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { createEvent, getAllEvents } from "../controllers/events.controllers.js"
import { upload } from "../middleware/saveUploads.js"

const router = express.Router()

router.post("/create", protectRoute, upload.single('photo'), createEvent)
router.get("/getAllEvents", protectRoute, getAllEvents)

export default router