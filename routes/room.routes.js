import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { createRoom, getAllRooms } from "../controllers/room.controllers.js"

const router = express.Router()

router.post("/create", protectRoute, createRoom)
router.get("/getAll", protectRoute, getAllRooms)

export default router