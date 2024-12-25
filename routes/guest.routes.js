import express from "express"
import { saveGuest } from "../controllers/guest.controllers.js"
import protectRoute from "../middleware/protectRoute.js"

const router = express.Router()

router.post("/saveGuest", protectRoute, saveGuest)

export default router