import express from "express"
import { getMessages, saveMessage } from "../controllers/message.controller.js"
import protectRoute from "../middleware/protectRoute.js"

const router = express.Router()

router.post("/saveMessage", protectRoute, saveMessage)
router.get("/messages", getMessages)

export default router