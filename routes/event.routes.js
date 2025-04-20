import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { createEvent, getAllEvents } from "../controllers/events.controllers.js"

const router = express.Router()

router.post("/create", protectRoute, createEvent)
router.get("/getAllEvents", protectRoute, getAllEvents)

export default router