import mongoose from "mongoose";

const GuestSchema = new mongoose.Schema({
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
    }
}, { timestamps: true })

const Guest = mongoose.model("Guest", GuestSchema)

export default Guest