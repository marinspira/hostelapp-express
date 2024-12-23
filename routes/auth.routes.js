import express from "express"
import { googleLogin, appleLogin, logout } from "../controllers/auth.controllers.js"

const router = express.Router()

router.post("/googleLogin", googleLogin)

router.post("/appleLogin", appleLogin)

router.post("/logout", logout)

export default router