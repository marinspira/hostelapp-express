const RoomsSchema = new mongoose.Schema({
    hostel: {
        type: mongoose.Schema.Types.ObjectId, ref: "Hostel"
    },
    number: {
        type: String, required: true
    },
    beds: [{
        number: {
            type: Number, required: true
        },
        current_guest: {
            type: mongoose.Schema.Types.ObjectId, ref: "User"
        },
        status: {
            type: String, enum: ["busy", "empty", "reserved"], default: "empty"
        },
    }],
    created_at: {
        type: Date, default: Date.now
    }
});

module.exports = mongoose.model("Rooms", RoomsSchema);
