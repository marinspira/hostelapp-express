import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { createReservation } from "../controllers/reservation.controllers.js"
import catchAsync from "../utils/catchAsync.js"

const router = express.Router()

/**
 * @swagger
 * /api/reservations/create:
 *   post:
 *     summary: HOST USER ONLY - Create a new reservation
 *     description: Creates a reservation for a specific bed in a room, updating guest, room, hostel, and chat records.
 *     tags:
 *       - Reservations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reservation:
 *                 type: object
 *                 required:
 *                   - user_id_guest
 *                   - room_number
 *                   - bed_number
 *                   - checkin_date
 *                   - checkout_date
 *                 properties:
 *                   user_id_guest:
 *                     type: string
 *                     example: "64f85fcf8e5e7c1f9bbf7a52"
 *                   room_number:
 *                     type: string
 *                     example: "A101"
 *                   bed_number:
 *                     type: integer
 *                     example: 1
 *                   checkin_date:
 *                     type: string
 *                     format: date
 *                     example: "2025-08-01"
 *                   checkout_date:
 *                     type: string
 *                     format: date
 *                     example: "2025-08-10"
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Reservation created!
 *               success: true
 *               data:
 *                 _id: "64fc79bd7e79b3c1d405a003"
 *                 user_id_guest: "64f85fcf8e5e7c1f9bbf7a52"
 *                 room_number: "A101"
 *                 bed_number: 1
 *                 checkin_date: "2025-08-01T00:00:00.000Z"
 *                 checkout_date: "2025-08-10T00:00:00.000Z"
 *                 hostel_id: "64f865f5d7915c1e7e453d90"
 *       400:
 *         description: Hostel not found or validation error
 *         content:
 *           application/json:
 *             example:
 *               message: Hostel does not exist!
 *               success: false
 *       409:
 *         description: Bed already reserved for selected dates
 *         content:
 *           application/json:
 *             example:
 *               message: This bed is already reserved for the selected dates.
 *               success: false
 *       500:
 *         description: Internal server error or update failure
 *         content:
 *           application/json:
 *             example:
 *               message: Failed to update room with reservation ID
 *               success: false
 */
router.post("/create", protectRoute, catchAsync(createReservation))

export default router