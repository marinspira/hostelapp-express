import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { createEvent } from "../controllers/events.controllers.js"

const router = express.Router()

router.post("/create", protectRoute, createEvent)

export default router