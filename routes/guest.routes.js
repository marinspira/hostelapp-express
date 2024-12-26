import express from "express"
import { saveGuest, saveGuestProfileImages } from "../controllers/guest.controllers.js"
import protectRoute from "../middleware/protectRoute.js"
import { upload } from "../middleware/saveFile.js"

const router = express.Router()

router.post("/saveGuest", protectRoute, saveGuest)

router.post("/saveGuestProfileImages", upload.single('file'), saveGuestProfileImages)

export default router