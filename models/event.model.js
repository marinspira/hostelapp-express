/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - date
 *         - hostel_id
 *         - description
 *         - hostel_location
 *         - paid_event
 *         - limited_spots
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d0fe4f5311236168a109ca
 *         name:
 *           type: string
 *           example: Sunset Party
 *         description:
 *           type: string
 *           example: A fun event with drinks, music, and games
 *         price:
 *           type: number
 *           example: 15.0
 *         hostel_location:
 *           type: boolean
 *           example: true
 *         date:
 *           type: string
 *           format: date-time
 *           example: 2025-07-15T19:00:00.000Z
 *         photos_last_event:
 *           type: array
 *           items:
 *             type: string
 *           example: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
 *         spots_available:
 *           type: number
 *           example: 30
 *         limited_spots:
 *           type: boolean
 *           example: true
 *         paid_event:
 *           type: boolean
 *           example: true
 *         payment_to_hostel:
 *           type: boolean
 *           example: false
 *         payment_methods:
 *           type: array
 *           items:
 *             type: string
 *           example: ["cash", "credit_card", "pix"]
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *               example: 123 Flower Street
 *             city:
 *               type: string
 *               example: New York
 *             zip:
 *               type: string
 *               example: 10001
 *         hostel_id:
 *           type: string
 *           description: Reference to the hostel organizing the event
 *           example: 60d0fe4f5311236168a109cb
 *         suggested_by:
 *           type: string
 *           description: User ID of the guest who suggested the event
 *           example: 60d0fe4f5311236168a109cc
 *         attendees:
 *           type: array
 *           items:
 *             type: string
 *           description: List of users who confirmed attendance
 *           example: ["60d0fe4f5311236168a109dd", "60d0fe4f5311236168a109de"]
 *         status:
 *           type: string
 *           enum: [pending, approved]
 *           example: pending
 *         img:
 *           type: string
 *           description: Cover image of the event
 *           example: "https://example.com/event-cover.jpg"
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: 2025-07-01T12:00:00.000Z
 */

import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
    name: {
        type: String, required: true
    },
    description: {
        type: String, required: true
    },
    price: {
        type: Number
    },
    hostel_location: {
        type: Boolean, required: true
    },
    date: {
        type: Date, required: true
    },
    photos_last_event: {
        type: [String]
    },
    spots_available: {
        type: Number
    },
    limited_spots: {
        type: Boolean, required: true
    },
    paid_event: {
        type: Boolean, required: true, default: false
    },
    payment_to_hostel: {
        type: Boolean
    },
    payment_methods: {
        type: [String]
    },
    address: {
        street: {
            type: String
        },
        city: {
            type: String
        },
        zip: {
            type: String
        }
    },
    hostel_id: {
        type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true
    },
    suggested_by: {
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    }, 
    attendees: [{
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    }],
    status: {
        type: String, enum: ["pending", "approved"], default: "pending"
    },
    img: {
        type: String
    },
    created_at: {
        type: Date, default: Date.now
    }
});

const Event = mongoose.model("Event", EventSchema)

export default Event
