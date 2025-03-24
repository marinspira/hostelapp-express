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
    }
}, { timestamps: true })

UserSchema.pre('validate', function (next) {
    if (!this.googleId && !this.appleId) {
        return next(new Error('Either googleId or appleId is required.'));
    }
    next();
});

const User = mongoose.model("User", UserSchema)

export default User;