import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    picture: {
        type: String,
        default: null,
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
    dateOfBirth: {
        type: Date,
        default: null,
        validate: {
            validator: function (value) {
                return value === null || value < new Date();
            },
            message: 'Date of birth must be in the past.'
        }
    }
}, { timestamps: true })

userSchema.pre('validate', function (next) {
    if (!this.googleId && !this.appleId) {
        return next(new Error('Either googleId or appleId is required.'));
    }
    next();
});

const User = mongoose.model("User", userSchema)

export default User;