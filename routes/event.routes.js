import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { createEvent, getAllEvents } from "../controllers/events.controllers.js"
import { upload } from "../middleware/saveUploads.js"
import catchAsync from "../utils/catchAsync.js"

const router = express.Router()

/**
 * @swagger
 * /api/events/create:
 *   post:
 *     summary: Create a new event for a hostel
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *               - photo
 *             properties:
 *               event:
 *                 type: string
 *                 format: JSON
 *                 description: JSON stringified event object
 *                 example: '{"name":"Party","description":"Live music night","price":10,"date":"2025-08-01","hostel_location":true,"paid_event":true,"limited_spots":false,"payment_methods":["cash"]}'
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Image for the event
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Hostel does not exist
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.post("/create", protectRoute, upload.single('photo'), catchAsync(createEvent))

/**
 * @swagger
 * /api/events/:
 *   get:
 *     summary: Get all events for the logged-in hostel owner
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Successfully fetched events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Event found successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *       400:
 *         description: Hostel does not exist
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get("/", protectRoute, catchAsync(getAllEvents))

export default router