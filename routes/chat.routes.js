import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { getAllChats, getMessages, sendMessage } from "../controllers/chat.controlles.js"

const router = express.Router()

/**
 * @swagger
 * components:
 *   responses:
 *     UnauthorizedError:
 *       description: Unauthorized - No token provided or token is invalid.
 *       content:
 *         application/json:
 *           example:
 *             error: "Unauthorized - No Token Provided"
 *     InternalServerError:
 *       description: Internal Server Error.
 *       content:
 *         application/json:
 *           example:
 *             error: "Internal Server Error"
 */

/**
 * @swagger
 * /api/chats/:
 *   get:
 *     summary: Get all chats for the current user or hostel
 *     tags: [Chats]
 *     responses:
 *       '200':
 *         description: A list of chat summaries for the user.
 *         content:
 *           application/json:
 *             examples:
 *               ChatsFound:
 *                 summary: When the user has active chats
 *                 value:
 *                   message: "Get all chats successfully"
 *                   data:
 *                     - chatId: "615c8a9b3f1e4a001f3b8e49"
 *                       participant:
 *                         userId: "60d0fe4f5311236168a109cc"
 *                         name: "Maria"
 *                         photo: "uploads/users/guest1/photo1.jpg"
 *                       lastMessage:
 *                         text: "See you then!"
 *                         createdAt: "2025-07-05T15:00:00.000Z"
 *                   success: true
 *               NoChats:
 *                 summary: When the user has no chats
 *                 value:
 *                   message: "Get all chats successfully"
 *                   data: []
 *                   success: true
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/", protectRoute, getAllChats)

/**
 * @swagger
 * /api/chats/{id}:
 *   get:
 *     summary: Get messages from a specific chat
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the chat.
 *         example: "686985c0dd13d196738e13d5"
 *     responses:
 *       '200':
 *         description: A list of formatted messages from the chat, or an empty array if the chat hasn't started.
 *         content:
 *           application/json:
 *             examples:
 *               MessagesFound:
 *                 summary: When messages are found for the chat
 *                 value:
 *                   message: "Get all messages successfully"
 *                   data:
 *                     - text: "Hello!"
 *                       time: "2025-07-05T14:30:00.000Z"
 *                       sender: "other"
 *                     - text: "Hi, how are you?"
 *                       time: "2025-07-05T14:31:00.000Z"
 *                       sender: "me"
 *                   success: true
 *               ChatNotFound:
 *                 summary: When no chat exists for the given ID
 *                 value:
 *                   message: "Chat not found or not started yet"
 *                   data: []
 *                   success: true
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/:id", protectRoute, getMessages)

/**
 * @swagger
 * /api/chats/:
 *   post:
 *     summary: Send a message and handle chat creation
 *     tags: [Chats]
 *     description: >
 *       Sends a message from the authenticated entity (which can be a User or a Hostel) to a specified recipient User. If a `chatId` is provided, the message is simply added to that existing chat. If `chatId` is omitted, the system uses the `recipientId` to find an existing chat between the two parties. If no chat is found, a new one is created automatically before sending the message.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 required: true
 *                 description: The content of the message.
 *                 example: "Let's meet tomorrow!"
 *               recipientId:
 *                 type: string
 *                 description: The **User ID** of the recipient. This is required if chatId is not provided. It cannot be a Hostel ID.
 *                 example: "6806b8381d51a5ea99c95036"
 *     responses:
 *       '201':
 *         description: Message sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Message sent!"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       '400':
 *         description: Bad Request - The provided chatId does not exist.
 *         content:
 *           application/json:
 *             example:
 *               message: "Chat not found"
 *               success: false
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/", protectRoute, sendMessage)

export default router
