import express from "express"
import { googleLogin, appleLogin, logout, isAuthenticated } from "../controllers/auth.controllers.js"
import protectRoute from "../middleware/protectRoute.js"

const router = express.Router()

router.post("/isAuthenticated", protectRoute, isAuthenticated)

router.post("/googleLogin", googleLogin)

router.post("/appleLogin", appleLogin)

router.post("/logout", logout)

export default router