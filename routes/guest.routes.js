import express from "express"
import { deleteGuestProfileImage, getGuest, getHome, saveGuest, saveGuestProfileImages, searchGuest, updateGuest } from "../controllers/guest.controllers.js"
import protectRoute from "../middleware/protectRoute.js"
import { upload } from "../middleware/saveUploads.js"

const router = express.Router()

// Guest details
router.post("/saveGuest", protectRoute, saveGuest)
router.get("/getGuest", protectRoute, getGuest)
router.put("/updateGuest", protectRoute, updateGuest)

router.get("/home", protectRoute, getHome)

// TODO: Mover para hostel
// Search a guest
router.get("/:username", protectRoute, searchGuest)

// Guest images
router.post("/saveGuestProfileImages", protectRoute, upload.single('photo'), saveGuestProfileImages)
router.delete("/deleteGuestProfileImage", protectRoute, deleteGuestProfileImage)

export default router