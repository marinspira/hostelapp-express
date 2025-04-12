import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { createRoom } from "../controllers/room.controllers.js"

const router = express.Router()

router.post("/create", protectRoute, createRoom)

export default router