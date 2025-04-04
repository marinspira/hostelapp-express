const mongoose = require("mongoose");

const HostelSchema = new mongoose.Schema({
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
        state: {
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
    description: {
        type: String
    },
    rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }],
    owners: [{
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    }],
    guests: [{
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    }],
    staffs: [{
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    }],
    events: [{
        type: mongoose.Schema.Types.ObjectId, ref: "Event"
    }],
    volunteer_opportunities: [{ type: mongoose.Schema.Types.ObjectId, ref: "VolunteerPosition" }],
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Hostel", HostelSchema);
