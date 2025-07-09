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
 *               - photo
 *             properties:
 *               hostel[name]:
 *                 type: string
 *                 description: Name of the hostel
 *                 example: HostelApp
 *               hostel[zip]:
 *                 type: string
 *                 example: "230492"
 *               hostel[street]:
 *                 type: string
 *                 example: Teste
 *               hostel[city]:
 *                 type: string
 *                 example: Sampa
 *               hostel[country]:
 *                 type: string
 *                 example: Argentina
 *               hostel[website]:
 *                 type: string
 *                 example: https://hostelaoo.com
 *               hostel[experience_with_volunteers]:
 *                 type: string
 *                 enum: [ "true", "false" ]
 *                 example: "false"
 *               hostel[policies]:
 *                 type: string
 *                 enum: [ "true", "false" ]
 *                 example: "true"
 *               imageId:
 *                 type: string
 *                 example: hostelImage
 *                 description: Optional image ID to associate with photo
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Photo file to upload
 *           examples:
 *             example-1:
 *               summary: Example with nested keys in form data
 *               value:
 *                 hostel[name]: HostelApp
 *                 hostel[zip]: "230492"
 *                 hostel[street]: Teste
 *                 hostel[city]: Sampa
 *                 hostel[country]: Argentina
 *                 hostel[website]: https://hostelaoo.com
 *                 hostel[experience_with_volunteers]: "false"
 *                 example: "false"
 *               hostel[policies]:
 *                 type: string
 *                 enum: [ "true", "false" ]
 *                 example: "true"
 *               imageId:
 *                 type: string
 *                 example: hostelImage
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Photo file to upload
 *           encoding:
 *             photo:
 *               contentType: image/png 
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