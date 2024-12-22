import express from "express"
import { login, appleLogin, logout } from "../controllers/auth.controllers.js"

const router = express.Router()

router.post("/login", login)

router.post("/appleLogin", appleLogin)

router.post("/logout", logout)

export default router