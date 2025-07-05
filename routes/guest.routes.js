import express from "express"
import { deleteGuestProfileImage, getGuest, getHome, saveGuest, saveGuestProfileImages, searchGuest, updateGuest } from "../controllers/guest.controllers.js"
import protectRoute from "../middleware/protectRoute.js"
import { upload } from "../middleware/saveUploads.js"

const router = express.Router()

// Guest details
/**
 * @swagger
 * /api/guest/create:
 *   post:
 *     summary: Create or update guest if partially created by Google
 *     description: Creates a new guest profile or completes it if it was created via Google auth. Only a few data fields are being sent. For register screen.
 *     tags: [Guest]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guestData:
 *                 type: object
 *                 properties:
 *                   phoneNumber:
 *                     type: string
 *                     example: "+1-555-123-4567"
 *                   birthday:
 *                     type: string
 *                     format: date
 *                     example: "1990-01-01"
 *                   country:
 *                     type: string
 *                     example: "Germany"
 *                   passaportPhoto:
 *                     type: string
 *                     example: "uploads/passport_photo.jpg"
 *                   digitalNomad:
 *                     type: boolean
 *                     example: true
 *                   smoker:
 *                     type: boolean
 *                     example: false
 *                   pets:
 *                     type: boolean
 *                     example: false
 *                   showProfileAuthorization:
 *                     type: boolean
 *                     example: true
  *     responses:
 *       201:
 *         description: Guest created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Guest created!
 *               data:
 *                 _id: "60f7e7c8c456bc1d9c111111"
 *                 username: "mariazinha123"
 *                 phoneNumber: "+1-123-456-7890"
 *                 birthday: "1990-01-01"
 *                 country: "Brazil"
 *                 passaportPhoto: "uploads/users/guest1/passport.jpg"
 *                 digitalNomad: true
 *                 smoker: false
 *                 pets: true
 *                 showProfileAuthorization: true
 *                 user: "60f7e7c8c456bc1d9c999999"
 *       200:
 *         description: Guest updated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Guest updated!
 *               data:
 *                 _id: "60f7e7c8c456bc1d9c111111"
 *                 username: "existinguser"
 *                 birthday: "1990-01-01"
 *                 phoneNumber: "+1-123-456-7890"
 *                 country: "Brazil"
 *       400:
 *         description: Birthday cannot be updated for existing guest
 *         content:
 *           application/json:
 *             example:
 *               error: Birthday cannot be updated for existing guest!
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               error: Internal Server Error
 */
router.post("/create", protectRoute, saveGuest)

/**
 * @swagger
 * /api/guest/get:
 *   get:
 *     summary: Retrieve guest profile
 *     description: Retrieves the guest profile information for the authenticated user.
 *     tags: [Guest]
 *     responses:
 *       200:
 *         description: Guest retrieved successfully
 *         content:
 *           application/json:
 *             examples:
 *               GuestFound:
 *                 summary: Guest data returned
 *                 value:
 *                   success: true
 *                   message: Guest retrieved successfully
 *                   data:
 *                     guestPhotos:
 *                       - uploads/users/guest1/photo1.jpg
 *                       - uploads/users/guest1/photo2.jpg
 *                     phoneNumber: "+1-555-123-4567"
 *                     birthday: "1990-06-15"
 *                     country: "Canada"
 *                     passaportPhoto: "uploads/users/guest1/passport.jpg"
 *                     interests:
 *                       - hiking
 *                       - photography
 *                     description: "I love exploring the outdoors and meeting new people."
 *                     languages:
 *                       - English
 *                       - French
 *                     digitalNomad: true
 *                     smoker: false
 *                     pets: true
 *                     instagram: "@guestprofile"
 *                     linkedin: "https://linkedin.com/in/guestprofile"
 *                     twitter: "@guest_tweet"
 *                     showProfileAuthorization: true
 *       404:
 *         description: Guest not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Guest not found!
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               error: Internal Server Error
 */
router.get("/get", protectRoute, getGuest)

/**
 * @swagger
 * /api/guest/update:
 *   put:
 *     summary: Update guest profile
 *     description: Updates editable fields on the guest profile (all data fields), and returns only the updated relevant guest data. For profile screen.
 *     tags: [Guest]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guestData:
 *                 type: object
 *                 properties:
 *                   phoneNumber:
 *                     type: string
 *                   country:
 *                     type: string
 *                   passaportPhoto:
 *                     type: string
 *                   interests:
 *                     type: array
 *                     items:
 *                       type: string
 *                   languages:
 *                     type: array
 *                     items:
 *                       type: string
 *                   digitalNomad:
 *                     type: boolean
 *                   smoker:
 *                     type: boolean
 *                   pets:
 *                     type: boolean
 *                   showProfileAuthorization:
 *                     type: boolean
 *                   description:
 *                     type: string
 *                   instagram:
 *                     type: string
 *                   linkedin:
 *                     type: string
 *                   twitter:
 *                     type: string
 *                   username:
 *                     type: string
 *     responses:
 *       200:
 *         description: Guest updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Guest updated successfully
 *               data:
 *                 guestPhotos:
 *                   - "uploads/users/67df062a81fec05a34d1bb76/photo1.jpg"
 *                 phoneNumber: "+1-234-567-890"
 *                 country: "Brazil"
 *                 passaportPhoto: null
 *                 interests:
 *                   - "surfing"
 *                   - "coding"
 *                   - "music"
 *                 languages:
 *                   - "English"
 *                   - "Portuguese"
 *                 digitalNomad: true
 *                 smoker: false
 *                 pets: true
 *                 showProfileAuthorization: true
 *                 description: "I love traveling and meeting new people."
 *                 instagram: "@myinsta"
 *                 linkedin: "https://linkedin.com/in/myprofile"
 *                 twitter: "@mytwitter"
 *                 username: "mariazinha"
 *       404:
 *         description: Guest not found
 *       500:
 *         description: Internal Server Error
 */
router.put("/update", protectRoute, updateGuest)

router.get("/home", protectRoute, getHome)

// Search a guest
/**
 * @swagger
 * /api/guest/{username}:
 *   get:
 *     summary: Search guests by username or email
 *     description: Searches for guest users by matching the provided username or email (case-insensitive). Returns limited guest data including user ID, name, email, profile image, and username.
 *     tags: [Guest]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *           example: mariazinha
 *         description: The username or email fragment to search for.
 *     responses:
 *       200:
 *         description: User is authenticated
 *         content:
 *           application/json:
 *             examples:
 *               No matches found:
 *                 summary: No user found
 *                 value:
 *                   success: true
 *                   message: No guest or user found with the given username.
 *                   data: []
 *               Guest(s) found:
 *                 summary: Guests found
 *                 value:
 *                   success: true
 *                   message: Guest(s) found successfully.
 *                   data:
 *                     - user_id_guest: "abc123"
 *                       name: "Maria"
 *                       email: "maria@example.com"
 *                       image: "uploads/users/photo1.jpg"
 *                       username: "mariazinha"
 *       500:
 *         description: Internal Server Error
 */
router.get("/:username", protectRoute, searchGuest)

// Guest images
router.post("/save-images", protectRoute, upload.single('photo'), saveGuestProfileImages)
router.delete("/delete-images", protectRoute, deleteGuestProfileImage)

export default router