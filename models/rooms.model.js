const mongoose = require("mongoose");

const RoomsSchema = new mongoose.Schema({
    type: { type: String, required: true },
    number: { type: String, required: true },
    beds: [{
        bed_number: { type: String, required: true },
        assigned_by: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation", default: null }
    }]
});

module.exports = {
    Rooms: mongoose.model("Rooms", RoomsSchema)
};