import express from "express"
import { googleLogin, appleLogin, logout, isAuthenticated, localhostLogin } from "../controllers/auth.controllers.js"
import protectRoute from "../middleware/protectRoute.js"

const router = express.Router()

/**
 * @swagger
 * /api/auth/is-authenticated:
 *   post:
 *     summary: Check if user is authenticated via cookie
 *     description: >
 *       This endpoint checks if the request has a valid session cookie and whether the user exists in the database.  
 *       Requires the `jwt` cookie to be set.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User is authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *             examples:
 *               ExistingUser:
 *                 summary: Existing user
 *                 value:
 *                   data:
 *                     name: "Maria"
 *                     isNewUser: false
 *                     role: "guest"
 *                   success: true
 *                   message: "User authenticated successfully"
 *               NewUser:
 *                 summary: New user
 *                 value:
 *                   data:
 *                     name: "Maria"
 *                     isNewUser: true
 *                     role: "guest"
 *                   success: true
 *                   message: "New user authenticated successfully"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               error: "Internal Server Error"
 */
router.post("/is-authenticated", protectRoute, isAuthenticated)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Simulated login to test session token and database connection
 *     description: >
 *       **This endpoint is not a real authentication flow.**  
 *       
 *       It only simulates a login to test: session token generation, cokie creation and database connection.
 *       
 *       The actual authentication is performed using Google or Apple login via `/api/auth/google` or `/api/auth/apple`.
 *       
 *       This route it is only be used for development or testing purposes.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credentials
 *               - role
 *           examples:
 *             GuestLoginExample:
 *               summary: Guest login
 *               value:
 *                 credentials:
 *                   email: "maria.guest@hostelapp.com"
 *                 role: "guest"
 *             HostelOwnerLoginExample:
 *               summary: Hostel owner login
 *               value:
 *                 credentials:
 *                   email: "maria.owner@hostelapp.com"
 *                 role: "host"
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 name: "Maria"
 *                 role: "guest"
 *                 isNewUser: false
 *               success: true
 *               message: "User logged successfully"
 *       201:
 *         description: New user created successfully
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 name: "Maria"
 *                 role: "guest"
 *                 isNewUser: true
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
router.post('/login', localhostLogin)

router.post("/google", googleLogin)

router.post("/apple", appleLogin)

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log the user out and clear the authentication cookie
 *     description: >
 *       This endpoint logs out the current user by clearing the JWT cookie set during login.  
 *       After calling this endpoint, the user will no longer be authenticated for protected routes.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "User logged out successfully"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               error: "Internal Server Error"
 */
router.post("/logout", logout)

export default router