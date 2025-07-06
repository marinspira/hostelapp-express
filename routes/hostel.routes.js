import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { createHostel, getAllGuests, getHomeScreen, getHostel } from "../controllers/hostel.controllers.js"
import { upload } from "../middleware/saveUploads.js"

const router = express.Router()

// Host details
/**
 * @swagger
 * /api/hostels/create:
 *   post:
 *     summary: HOST USER ONLY - Create a new hostel
 *     description: Creates a new hostel for the authenticated user. Accepts a photo file and hostel details.
 *     tags: [Hostels]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - hostel
 *               - photo
 *             properties:
 *               hostel:
 *                 type: string
 *                 description: JSON stringified hostel data
 *                 example: '{"name": "Sunny Hostel", "street": "Rua das Flores", "city": "Lisbon", "country": "Portugal", "zip": "1200-456", "phone": "+351912345678", "email": "sunny@hostels.com", "website": "https://sunnyhostel.com", "experience_with_volunteers": "5 years"}'
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Hostel created successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Hostel created!"
 *               data:
 *                 _id: "60c73c8a6f8b8e3d4cd9ec12"
 *                 name: "Sunny Hostel"
 *                 username: "sunny-hostel"
 *       409:
 *         description: Hostel already exists
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Hostel already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               error: "Internal Server Error"
 */
router.post("/create", protectRoute, upload.single('photo'), createHostel)

/**
 * @swagger
 * /api/hostels/mine:
 *   get:
 *     summary: HOST USER ONLY - Get hostel details of the authenticated user
 *     tags: [Hostels]
 *     responses:
 *       200:
 *         description: Hostel found successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Hostel found succefully!"
 *               data:
 *                 _id: "60c73c8a6f8b8e3d4cd9ec12"
 *                 name: "Sunny Hostel"
 *       409:
 *         description: Hostel not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Hostel not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               error: "Internal Server Error"
 */
router.get("/mine", protectRoute, getHostel)

// Get all guests staying in the hostel
/**
 * @swagger
 * /api/hostels/guests:
 *   get:
 *     summary: HOST USER ONLY - Get all guests staying in the hostel
 *     tags: [Hostels]
 *     responses:
 *       200:
 *         description: Guests retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Guests"
 *               data:
 *                 - userId: "60c74191a123456789abcd01"
 *                   name: "Maria Silva"
 *                   firstPhoto: "/uploads/users/photo1.jpg"
 *       200-b:
 *         description: No guests found
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "No guests found"
 *               data: []
 *       409:
 *         description: Hostel not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Hostel not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               error: "Internal Server Error"
 */
router.get("/guests", protectRoute, getAllGuests)

// Get Home Screen
router.get("/getHomeScreen", protectRoute, getHomeScreen)

export default router