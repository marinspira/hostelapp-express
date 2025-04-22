import mongoose from "mongoose";

const HostelSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
    },
    isNewUser: {
        type: Boolean,
        default: true
    },
    stripeAccountId: {
        type: String
    },
    logo: {
        type: String
    },
    username: {
        type: String, required: true
    },
    name: {
        type: String, required: true
    },
    address: {
        street: {
            type: String, required: true
        },
        city: {
            type: String, required: true
        },
        country: {
            type: String, required: true
        },
        zip: {
            type: String
        }
    },
    phone: {
        type: String
    },
    email: {
        type: String, unique: true, required: true
    },
    website: {
        type: String
    },
    experience_with_volunteers: {
        type: Boolean
    },
    currency: {
        type: String, required: true
    },
    rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }],
    owners: [{
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    }],
    user_id_guests: [{
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    }],
    user_id_staffs: [{
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    }],
    events: [{
        type: mongoose.Schema.Types.ObjectId, ref: "Event"
    }],
    volunteer_opportunities: [{ type: mongoose.Schema.Types.ObjectId, ref: "VolunteerPosition" }],
    created_at: { type: Date, default: Date.now }
}, { timestamps: true });

const Hostel = mongoose.model("Hostel", HostelSchema)

export default Hostel
