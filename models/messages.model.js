/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "615c8a9b3f1e4a001f3b8e4a"
 *         chat:
 *           type: string
 *           description: ID of the chat this message belongs to.
 *           example: "615c8a9b3f1e4a001f3b8e49"
 *         sender:
 *           type: string
 *           description: ID of the sender (User or Hostel).
 *           example: "60d0fe4f5311236168a109cc"
 *         senderModel:
 *           type: string
 *           enum: [User, Hostel]
 *           example: "User"
 *         text:
 *           type: string
 *           example: "Hi there! Is the private room available?"
 */

import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'senderModel'
    },
    senderModel: {
        type: String,
        required: true,
        enum: ['User', 'Hostel']
    },
    text: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Message = mongoose.model("Message", MessageSchema);

export default Message
