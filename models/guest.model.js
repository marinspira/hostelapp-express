/**
 * @swagger
 * components:
 *   schemas:
 *     Guest:
 *       type: object
 *       required:
 *         - username
 *         - user
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d0fe4f5311236168a109cb
 *         username:
 *           type: string
 *           example: "guest123"
 *         guestPhotos:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of URLs or base64 encoded images
 *           example: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
 *         phoneNumber:
 *           type: string
 *           example: "+1234567890"
 *         birthday:
 *           type: string
 *           example: "1990-05-20"
 *         country:
 *           type: string
 *           example: "Brazil"
 *         passaportPhoto:
 *           type: string
 *           format: binary
 *           nullable: true
 *           description: Passport photo binary data
 *         interests:
 *           type: array
 *           items:
 *             type: string
 *           example: ["hiking", "photography"]
 *         description:
 *           type: string
 *           example: "Loves traveling and meeting new people."
 *         languages:
 *           type: array
 *           items:
 *             type: string
 *           example: ["English", "Portuguese"]
 *         digitalNomad:
 *           type: boolean
 *           example: true
 *         smoker:
 *           type: boolean
 *           example: false
 *         pets:
 *           type: boolean
 *           example: true
 *         instagram:
 *           type: string
 *           example: "https://instagram.com/guest123"
 *         linkedin:
 *           type: string
 *           example: "https://linkedin.com/in/guest123"
 *         twitter:
 *           type: string
 *           example: "https://twitter.com/guest123"
 *         showProfileAuthorization:
 *           type: boolean
 *           example: true
 *         user:
 *           type: string
 *           description: MongoDB ObjectId referencing User
 *           example: 60d0fe4f5311236168a109ca
 *         reservations:
 *           type: array
 *           items:
 *             type: string
 *             description: MongoDB ObjectId referencing Reservation
 *           nullable: true
 *           example: ["60d0fe4f5311236168a109cd", "60d0fe4f5311236168a109ce"]
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

const GuestSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    guestPhotos: {
        type: [String]
    },
    phoneNumber: {
        type: String
    },
    birthday: {
        type: String,
    },
    country: {
        type: String
    },
    passaportPhoto: {
        type: Buffer
    },
    interests: {
        type: [String]
    },
    description: {
        type: String
    },
    languages: {
        type: [String]
    },
    digitalNomad: {
        type: Boolean
    },
    smoker: {
        type: Boolean
    },
    pets: {
        type: Boolean
    },
    instagram: {
        type: String
    },
    linkedin: {
        type: String
    },
    twitter: {
        type: String
    },
    showProfileAuthorization: {
        type: Boolean
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reservations: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Reservation",
        default: null
    }],
}, { timestamps: true })

const Guest = mongoose.model("Guest", GuestSchema)

export default Guest