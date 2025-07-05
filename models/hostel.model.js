/**
 * @swagger
 * components:
 *   schemas:
 *     Hostel:
 *       type: object
 *       required:
 *         - username
 *         - name
 *         - address
 *         - user_id_owners
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d0fe4f5311236168a109cf
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected, suspended]
 *           default: pending
 *           example: pending
 *         stripeAccountId:
 *           type: string
 *           nullable: true
 *           example: acct_1GqIC8LYf12Abcde
 *         logo:
 *           type: string
 *           nullable: true
 *           example: "https://example.com/logo.png"
 *         username:
 *           type: string
 *           example: "hostelusername"
 *         name:
 *           type: string
 *           example: "Sunny Hostel"
 *         address:
 *           type: object
 *           required:
 *             - street
 *             - city
 *             - country
 *           properties:
 *             street:
 *               type: string
 *               example: "123 Sunshine St"
 *             city:
 *               type: string
 *               example: "Lisbon"
 *             country:
 *               type: string
 *               example: "Portugal"
 *             zip:
 *               type: string
 *               nullable: true
 *               example: "1100-123"
 *         phone:
 *           type: string
 *           nullable: true
 *           example: "+351912345678"
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *           example: "contact@sunnyhostel.com"
 *         website:
 *           type: string
 *           nullable: true
 *           example: "https://sunnyhostel.com"
 *         experience_with_volunteers:
 *           type: boolean
 *           nullable: true
 *           example: true
 *         currency:
 *           type: string
 *           nullable: true
 *           example: "EUR"
 *         rooms:
 *           type: array
 *           items:
 *             type: string
 *             description: MongoDB ObjectId referencing Room
 *           example: ["60d0fe4f5311236168a109d0", "60d0fe4f5311236168a109d1"]
 *         user_id_owners:
 *           type: array
 *           items:
 *             type: string
 *             description: MongoDB ObjectId referencing User
 *           example: ["60d0fe4f5311236168a109ca"]
 *         user_id_guests:
 *           type: array
 *           items:
 *             type: string
 *             description: MongoDB ObjectId referencing User guests
 *           example: ["60d0fe4f5311236168a109cb"]
 *         user_id_staffs:
 *           type: array
 *           items:
 *             type: string
 *             description: MongoDB ObjectId referencing User staffs
 *           example: ["60d0fe4f5311236168a109cc"]
 *         events:
 *           type: array
 *           items:
 *             type: string
 *             description: MongoDB ObjectId referencing Event
 *           example: ["60d0fe4f5311236168a109cd"]
 *         volunteer_opportunities:
 *           type: array
 *           items:
 *             type: string
 *             description: MongoDB ObjectId referencing VolunteerPosition
 *           example: ["60d0fe4f5311236168a109ce"]
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2025-07-05T10:45:00.000Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-07-05T10:45:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-07-05T11:00:00.000Z"
 */

import mongoose from "mongoose";

const HostelSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
    },
    stripeAccountId: {
        type: String
    },
    logo: {
        type: String
    },
    username: {
        type: String, required: true
    },
    name: {
        type: String, required: true
    },
    address: {
        street: {
            type: String, required: true
        },
        city: {
            type: String, required: true
        },
        country: {
            type: String, required: true
        },
        zip: {
            type: String
        }
    },
    phone: {
        type: String
    },
    email: {
        type: String, unique: true, required: false
    },
    website: {
        type: String
    },
    experience_with_volunteers: {
        type: Boolean
    },
    currency: {
        type: String, required: false
    },
    rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }],
    user_id_owners: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        validate: [arr => arr.length > 0, 'At least one owner is required.']
    }],
    user_id_guests: [{
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    }],
    user_id_staffs: [{
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    }],
    events: [{
        type: mongoose.Schema.Types.ObjectId, ref: "Event"
    }],
    volunteer_opportunities: [{ type: mongoose.Schema.Types.ObjectId, ref: "VolunteerPosition" }],
    created_at: { type: Date, default: Date.now }
}, { timestamps: true });

const Hostel = mongoose.model("Hostel", HostelSchema)

export default Hostel
