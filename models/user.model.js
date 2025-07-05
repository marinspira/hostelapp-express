/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - role
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d0fe4f5311236168a109ca
 *         name:
 *           type: string
 *           example: Maria
 *         email:
 *           type: string
 *           example: maria@example.com
 *         googleId:
 *           type: string
 *           nullable: true
 *           example: 1234567890abcdef
 *         appleId:
 *           type: string
 *           nullable: true
 *           example: abcdef1234567890
 *         role:
 *           type: string
 *           enum: [host, guest]
 *           example: guest
 *         sessionToken:
 *           type: string
 *           nullable: true
 *           example: abc.def.ghi
 *         isNewUser:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-07-05T10:45:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-07-05T11:00:00.000Z
 */

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    googleId: {
        type: String,
        default: null,
    },
    appleId: {
        type: String,
        default: null,
    },
    role: {
        type: String,
        enum: ['host', 'guest'],
        required: true
    },
    sessionToken: {
        type: String,
        default: null
    },
    isNewUser: {
        type: Boolean,
        default: true
    },
}, { timestamps: true })

UserSchema.pre('validate', function (next) {
    if (!this.googleId && !this.appleId) {
        return next(new Error('Either googleId or appleId is required.'));
    }
    next();
});

const User = mongoose.model("User", UserSchema)

export default User;