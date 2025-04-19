import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
    name: {
        type: String, required: true
    },
    description: {
        type: String
    },
    price: {
        type: Number, required: true
    },
    hostel_location: {
        type: Boolean
    },
    date: {
        type: Date, required: true
    },
    photos_last_event: {
        type: [String]
    },
    spots_available: {
        type: Number
    },
    limited_spots: {
        type: Boolean
    },
    paid_event: {
        type: Boolean
    },
    payment_to_hostel: {
        type: Boolean
    },
    payment_methods: {
        type: [String]
    },
    address: {
        street: {
            type: String
        },
        city: {
            type: String
        },
        zip: {
            type: String
        }
    },
    hostel_id: {
        type: mongoose.Schema.Types.ObjectId, ref: "Hostel"
    },
    suggested_by: {
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    }, // Hóspede que sugeriu
    attendees: [{
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    }], // Quem confirmou presença
    status: {
        type: String, enum: ["pendente", "aprovado"], default: "pendente"
    },
    photos_last_event: {
        type: [String]
    },
    img: {
        type: String
    },
    created_at: {
        type: Date, default: Date.now
    }
});

const Event = mongoose.model("Event", EventSchema)

export default Event
