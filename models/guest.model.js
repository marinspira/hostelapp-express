import mongoose from "mongoose";

const GuestSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    guestPhotos: {
        type: [String]
    },
    isNewUser: {
        type: Boolean,
        default: true
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
    },
    reservations: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Reservation",
        default: null
    }],
}, { timestamps: true })

const Guest = mongoose.model("Guest", GuestSchema)

export default Guest