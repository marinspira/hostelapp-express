import express from "express"
import { googleLogin, appleLogin, logout, isAuthenticated, localhostLogin } from "../controllers/auth.controllers.js"
import protectRoute from "../middleware/protectRoute.js"

const router = express.Router()

router.post("/isAuthenticated", protectRoute, isAuthenticated)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: maria.guest@hostelapp.com
 *               role:
 *                  type: string
 *                  example: guest
 *               appleId:
 *                  type: string
 *                  example: 9876543210
*     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 name: "Maria"
 *                 isNewUser: false
 *                 role: "guest"
 *               success: true
 *               message: "User logged successfully"
 *       201:
 *         description: New user created successfully
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 isNewUser: true
 *                 name: "Maria"
 *                 role: "guest"
 *               success: true
 *               message: "New user created successfully"
 *       400:
 *         description: Failed to create new user
 *         content:
 *           application/json:
 *             example:
 *               error: "Error creating new user"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             examples:
 *               UserQueryOrSaveError:
 *                 summary: Error querying or saving user
 *                 value:
 *                   error: "Internal Server Error"
 *               TokenGenerationError:
 *                 summary: Error during token generation or guest/hostel lookup
 *                 value:
 *                   error: "Internal Server Error"
 */
router.post('/localhostLogin', localhostLogin)

router.post("/googleLogin", googleLogin)

router.post("/appleLogin", appleLogin)

router.post("/logout", logout)

export default router