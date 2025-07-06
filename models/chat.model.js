/**
 * @swagger
 * components:
 *   schemas:
 *     Chat:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The unique identifier for the chat.
 *           example: "60d0fe4f5311236168a109ca"
 *         participants:
 *           type: array
 *           description: List of participants in the chat.
 *           items:
 *             type: object
 *             properties:
 *               hostel:
 *                 type: string
 *                 description: Reference to the hostel participant.
 *                 example: "60d0fe4f5311236168a109cb"
 *               user:
 *                 type: string
 *                 description: Reference to the user participant.
 *                 example: "60d0fe4f5311236168a109cc"
 *         group:
 *           type: boolean
 *           description: Indicates if the chat is a group chat.
 *           default: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the chat was created.
 *           example: "2025-07-01T12:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the chat was last updated.
 *           example: "2025-07-01T12:30:00.000Z"
 */
import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema({
    participants: [{
        hostel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hostel",
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    }],
    group: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const Chat = mongoose.model("Chat", ChatSchema)

export default Chat