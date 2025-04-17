import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { getAllConversations, getMessages, sendMessage } from "../controllers/conversation.controlles.js"

const router = express.Router()

router.get("/getAllConversations", protectRoute, getAllConversations)
router.get("/:conversationOrUserId", protectRoute, getMessages)

router.post("/sendMessage", protectRoute, sendMessage)

export default router