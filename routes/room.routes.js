import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { createRoom, getAllRooms, getBedsAvailable } from "../controllers/room.controllers.js"

const router = express.Router()

/**
 * @swagger
 * /api/rooms/create:
 *   post:
 *     summary: HOST USER ONLY - Create a new room in the authenticated user's hostel
 *     tags:
 *       - Rooms
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               room:
 *                 type: object
 *                 required:
 *                   - name
 *                   - type
 *                   - capacity
 *                   - organization_by
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Room A1"
 *                   type:
 *                     type: string
 *                     example: "Shared"
 *                   capacity:
 *                     type: integer
 *                     example: 4
 *                   organization_by:
 *                     type: string
 *                     enum: [Letter, Number]
 *                     example: "Letter"
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Room created!
 *               success: true
 *               data:
 *                 _id: "64f123abc123def4567890gh"
 *                 name: "Room A1"
 *                 type: "Shared"
 *                 capacity: 4
 *                 organization_by: "Letter"
 *                 beds:
 *                   - bed_number: "A"
 *                     reservation_id: null
 *                   - bed_number: "B"
 *                     reservation_id: null
 *       400:
 *         description: Validation or duplication error
 *         content:
 *           application/json:
 *             examples:
 *               hostelMissing:
 *                 summary: Hostel not found
 *                 value:
 *                   message: Hostel does not exist!
 *                   success: false
 *               roomExists:
 *                 summary: Room already exists
 *                 value:
 *                   message: A room with the same name already exists in this hostel.
 *                   success: false
 *               invalidCapacity:
 *                 summary: Capacity is invalid
 *                 value:
 *                   message: Invalid capicity number
 *                   success: false
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               error: Internal Server Error
 */
router.post("/create", protectRoute, createRoom)

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: HOST USER ONLY - Retrieve all rooms and their beds for the authenticated user's hostel
 *     tags:
 *       - Rooms
 *     responses:
 *       200:
 *         description: Rooms retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Rooms retrieved successfully!
 *               success: true
 *               data:
 *                 - _id: "64f456abc123def4567890gh"
 *                   name: "Room A1"
 *                   type: "Shared"
 *                   capacity: 4
 *                   organization_by: "Por letras"
 *                   hostel: "64f999defabc1234567890gh"
 *                   beds:
 *                     - bed_number: "A"
 *                       reservation_id: null
 *                       guestPhoto: "https://example.com/guest1.jpg"
 *                     - bed_number: "B"
 *                       reservation_id: "64fabc1234567890abcdef12"
 *                       guestPhoto: "https://example.com/guest2.jpg"
 *       400:
 *         description: Hostel not found
 *         content:
 *           application/json:
 *             example:
 *               message: Hostel not found!
 *               success: false
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               error: Internal Server Error
 */
router.get("/", protectRoute, getAllRooms)

/**
 * @swagger
 * /api/rooms/beds-available:
 *   get:
 *     summary: HOST USER ONLY - Get available beds between two dates in the authenticated user's hostel
 *     tags:
 *       - Rooms
 *     parameters:
 *       - in: query
 *         name: checkin_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2025-08-01"
 *       - in: query
 *         name: checkout_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2025-08-10"
 *     responses:
 *       200:
 *         description: List of available beds by room
 *         content:
 *           application/json:
 *             example:
 *               message: Available beds retrieved successfully!
 *               success: true
 *               data:
 *                 - room_number: "Room A1"
 *                   beds: ["A", "B"]
 *                 - room_number: "Room B1"
 *                   beds: ["1", "2"]
 *       400:
 *         description: Missing dates or hostel not found
 *         content:
 *           application/json:
 *             examples:
 *               missingDates:
 *                 summary: Dates missing
 *                 value:
 *                   message: Checkin and checkout dates are required
 *                   success: false
 *               noHostel:
 *                 summary: Hostel not found
 *                 value:
 *                   message: Hostel not found!
 *                   success: false
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               error: Internal Server Error
 */
router.get("/beds-available", protectRoute, getBedsAvailable)

export default router