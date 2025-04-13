import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { createReservation } from "../controllers/reservation.controllers.js"

const router = express.Router()

router.post("/create", protectRoute, createReservation)

export default router