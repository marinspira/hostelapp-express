import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
    type: { 
        type: String, 
        required: true,
        enum: ['Shared', 'Private', 'Staff'],
    },
    name: { 
        type: String, 
        required: true 
    },
    capacity: {
        type: Number, 
        required: true 
    },
    organization_by: {
        type: String, 
        required: true 
    },
    beds: [{
        bed_number: { 
            type: String, 
            required: true 
        },
        reservation_id: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Reservation", 
            default: null 
        }
    }],
    hostel: {
        type: mongoose.Schema.Types.ObjectId, ref: "Hostel"
    }
}, { timestamps: true });

const Room = mongoose.model("Room", RoomSchema)

export default Room