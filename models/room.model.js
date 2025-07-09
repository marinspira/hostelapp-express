/**
 * @swagger
 * components:
 *   schemas:
 *     Room:
 *       type: object
 *       required:
 *         - type
 *         - name
 *         - capacity
 *         - organization_by
 *         - beds
 *       properties:
 *         _id:
 *           type: string
 *           format: uuid
 *           example: "64b10c9a3e5f1b6d2c123456"
 *         type:
 *           type: string
 *           enum: [Shared, Private, Staff]
 *           description: Type of the room
 *           example: "Shared"
 *         name:
 *           type: string
 *           description: Name or number of the room
 *           example: "Room 101"
 *         capacity:
 *           type: integer
 *           description: Number of beds in the room
 *           example: 6
 *         organization_by:
 *           type: string
 *           description: How beds are organized (e.g., "By numbers" or "By letters")
 *           example: "By letters"
 *         beds:
 *           type: array
 *           description: List of beds in the room
 *           items:
 *             type: object
 *             properties:
 *               bed_number:
 *                 type: string
 *                 description: Unique identifier of the bed (within the room)
 *                 example: "A"
 *               reservation_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: ID of the reservation occupying the bed (if any)
 *                 example: "64b10c9a3e5f1b6d2c123999"
 *         hostel:
 *           type: string
 *           format: uuid
 *           description: Reference to the associated hostel
 *           example: "64acde56b75ef438c7a8d1a2"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the room was created
 *           example: "2025-07-06T10:45:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the room was last updated
 *           example: "2025-07-07T09:30:00.000Z"
 */
import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
    type: { 
        type: String, 
        required: true,
        enum: ['Shared', 'Private', 'Staff'],
    },
    name: { 
        type: String, 
        required: true 
    },
    capacity: {
        type: Number, 
        required: true 
    },
    organization_by: {
        type: String, 
        required: true 
    },
    beds: [{
        bed_number: { 
            type: String, 
            required: true 
        },
        reservation_id: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Reservation", 
            default: null 
        }
    }],
    hostel: {
        type: mongoose.Schema.Types.ObjectId, ref: "Hostel"
    }
}, { timestamps: true });

const Room = mongoose.model("Room", RoomSchema)

export default Room