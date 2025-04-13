import mongoose from "mongoose";

const ReservationSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['walking in', 'in house', 'checked out'],
        default: 'walking in'
    },
    hostel_id: {
        type: mongoose.Schema.Types.ObjectId, ref: "Hostel"
    },
    user_id_guest: {
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    },
    checkin_date: {
        type: Date
    },
    checkout_date: {
        type: Date,
        required: true,
        validate: {
            validator: function(value) {
                return value > this.checkin_date;
            },
            message: 'Checkout date must be after checkin date'
        }
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
}, { timestamps: true });

const Reservation = mongoose.model("Reservation", ReservationSchema)

export default Reservation
