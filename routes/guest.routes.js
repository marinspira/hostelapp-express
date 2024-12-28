import express from "express"
import { saveGuest, saveGuestProfileImages } from "../controllers/guest.controllers.js"
import protectRoute from "../middleware/protectRoute.js"
import { upload } from "../middleware/saveUploads.js"

const router = express.Router()

router.post("/saveGuest", protectRoute, saveGuest)

router.post("/saveGuestProfileImages", protectRoute, upload.single('photo'), saveGuestProfileImages)

export default router