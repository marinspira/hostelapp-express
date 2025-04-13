import mongoose from "mongoose";
import Hostel from "../models/hostel.model.js";
import Reservation from "../models/reservation.model.js";

export const createReservation = async (req, res) => {
    try {
        const user = req.user
        const { reservation } = req.body

        console.log(reservation)

        const hostel = await Hostel.findOne({ owners: user._id });

        if (!hostel) {
            return res.status(400).json({
                message: 'Hostel does not exist!',
                success: false,
            });
        }

        const existingReservation = await Reservation.findOne({
            room_number: reservation.room_number,
            bed_number: reservation.bed_number,
            $or: [
                {
                    checkin_date: { $lt: reservation.checkout_date },
                    checkout_date: { $gt: reservation.checkin_date },
                }
            ]
        });

        if (existingReservation) {
            return res.status(409).json({
                message: 'This bed is already reserved for the selected dates.',
                success: false,
            });
        }

        const newReservation = new Reservation({
            guest_id: new mongoose.Types.ObjectId(reservation.guest_id),
            room_number: reservation.room_number,
            bed_number: reservation.bed_number,
            checkin_date: new Date(reservation.checkin_date),
            checkout_date: new Date(reservation.checkout_date),
            hostel_id: new mongoose.Types.ObjectId(hostel._id)
        });

        // adicione reserva na coleção guest 

        // adicione reserva em guests da coleção de hostel

        await newReservation.save();

        return res.status(201).json({
            message: 'Reservation created!',
            success: true,
            data: newReservation,
        });
    } catch (error) {
        console.error("Error in createReservation controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}