const ReservationSchema = new mongoose.Schema({
    hostel: {
        type: mongoose.Schema.Types.ObjectId, ref: "Hostel"
    },
    guest: {
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    },
    checkin_date: {
        type: Date
    },
    checkout_date: {
        type: Date
    },
    room_number: {
        type: String, required: true
    },
    bed_number: {
        type: String, required: true
    },
    created_at: {
        type: Date, default: Date.now
    },
});

module.exports = mongoose.model("Reservation", ReservationSchema);
