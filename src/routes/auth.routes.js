import express from 'express';

import {
  googleLogin,
  appleLogin,
  logout,
  isAuthenticated,
  localhostLogin,
  sendEmailCode,
  verifyEmailCode,
  updateUser,
} from '../controllers/auth.controllers.js';
import protectRoute from '../middleware/protectRoute.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

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
router.post('/is-authenticated', protectRoute, catchAsync(isAuthenticated));

router.post('/login', catchAsync(localhostLogin));

router.post('/google', catchAsync(googleLogin));

router.post('/apple', catchAsync(appleLogin));

router.post('/send-code', catchAsync(sendEmailCode));

router.post('/verify-code', catchAsync(verifyEmailCode));

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
router.post('/logout', catchAsync(logout));

/**
 * @swagger
 * /api/auth/update-user:
 *   put:
 *     summary: Update user information
 *     description: Update the authenticated user's information (name, etc.)
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userData:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Maria Ferreira"
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "User updated successfully!"
 *               data:
 *                 name: "Maria Ferreira"
 *                 email: "maria@example.com"
 *                 role: "guest"
 *                 isNewUser: false
 *       400:
 *         description: Bad request - user data required
 *       500:
 *         description: Internal server error
 */
router.put('/update-user', protectRoute, catchAsync(updateUser));

export default router;
