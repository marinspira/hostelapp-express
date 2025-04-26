import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { createRoom, getAllRooms, getBedsAvailable } from "../controllers/room.controllers.js"

const router = express.Router()

router.post("/create", protectRoute, createRoom)
router.get("/getAll", protectRoute, getAllRooms)
router.get("/bedsAvailable", protectRoute, getBedsAvailable)

export default router