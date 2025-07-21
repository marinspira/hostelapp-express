import express from "express"
import { getHostelStats, getUsers, getUserStats, getHostels, getErrorLogs, saveFrontendLogs } from "../controllers/backoffice.controllers.js"
import { authenticateToken } from "../middleware/bearerAuthentication.js"
import catchAsync from "../utils/catchAsync.js"

const router = express.Router()

/**
 * @swagger
 * /api/backoffice/users:
 *   get:
 *     summary: Retrieve a list of users
 *     description: Retrieve all users from the database.
 *     tags: [Backoffice]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal Server Error
 */
router.get("/users", authenticateToken, catchAsync(getUsers))

/**
 * @swagger
 * /api/backoffice/hostels:
 *   get:
 *     summary: Retrieve a list of hostels
 *     description: Retrieve all hostels from the database.
 *     tags: [Backoffice]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of hostels.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal Server Error
 */
router.get("/hostels", authenticateToken, catchAsync(getHostels))

/**
* @swagger
* /api/backoffice/hostels-stats:
*   get:
*     summary: Retrieve statistics about hostels
*     tags: [Backoffice]
*     security:
*       - BearerAuth: []
*     responses:
*       200:
*         description: Successfully retrieved hostel statistics
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   type: object
*                   properties:
*                     totalHostels:
*                       type: integer
*                       example: 20
*                     hostelsBySize:
*                       type: object
*                       properties:
*                         small:
*                           type: integer
*                           description: Hostels with less than 5 rooms
*                           example: 5
*                         medium:
*                           type: integer
*                           description: Hostels with 5 to 15 rooms
*                           example: 10
*                         large:
*                           type: integer
*                           description: Hostels with more than 15 rooms
*                           example: 5
*                     hostelsByPopularity:
*                       type: object
*                       properties:
*                         low:
*                           type: integer
*                           description: Hostels with 0 to 5 guests
*                           example: 7
*                         medium:
*                           type: integer
*                           description: Hostels with 6 to 15 guests
*                           example: 8
*                         high:
*                           type: integer
*                           description: Hostels with more than 15 guests
*                           example: 5
*                     hostelsByCountry:
*                       type: object
*                       additionalProperties:
*                         type: integer
*                       example: { "Brazil": 10, "USA": 5 }
*                     hostelsByCity:
*                       type: object
*                       additionalProperties:
*                         type: integer
*                       example: { "Rio de Janeiro": 5, "New York": 3 }
*                     averageRooms:
*                       type: number
*                       format: float
*                       example: 8.3
*                     hostelsWithVolunteers:
*                       type: integer
*                       example: 6
*                     hostelsByStatus:
*                       type: object
*                       additionalProperties:
*                         type: integer
*                       example: { "pending": 15, "approved": 5 }
*       500:
*         description: Internal server error
*/
router.get("/hostels-stats", authenticateToken, catchAsync(getHostelStats))

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       description: |
 *         Bearer token authorization necessary to authorize BACKOFFICE ROUTES. Enter the token `only_a_test` to be able to access.
 *
 * /api/backoffice/users-stats:
 *   get:
 *     summary: Retrieve statistics about users
 *     tags: [Backoffice]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                       example: 100
 *                     usersByRole:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       example: { "admin": 10, "guest": 70, "staff": 20 }
 *                     newUsersCount:
 *                       type: integer
 *                       example: 15
 *                     activeUsers:
 *                       type: integer
 *                       description: Users active in the last 30 days
 *                       example: 40
 *                     usersByStatus:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       example: { "active": 80, "inactive": 20 }
 *                     usersCreatedByMonth:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       example: { "2025-04": 10, "2025-05": 20 }
 *       500:
 *         description: Internal server error
 */
router.get("/users-stats", authenticateToken, catchAsync(getUserStats))

/**
 * @swagger
 * /api/backoffice/error-logs:
 *   get:
 *     summary: Retrieve a list of recent backend errors
 *     description: Get the last 100 errors logged by the global error handler.
 *     tags: [Backoffice]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of error logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       message:
 *                         type: string
 *                         example: "ValidationError: Event validation failed"
 *                       stack:
 *                         type: string
 *                         example: "ValidationError: Event validation failed at Document..."
 *                       route:
 *                         type: string
 *                         example: "/api/events/create"
 *                       type:
 *                         type: string
 *                         example: "POST"
 *                       time:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-07-10T17:52:49.598Z"
 *       500:
 *         description: Internal server error
 */
router.get("/error-logs", authenticateToken, catchAsync(getErrorLogs))

router.post("/frontend-logs", authenticateToken, catchAsync(saveFrontendLogs))

export default router