import mongoose from "mongoose";
import Hostel from "../models/hostel.model.js";
import Reservation from "../models/reservation.model.js";
import Room from "../models/room.model.js";
import Guest from "../models/guest.model.js";

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
            user_id_guest: new mongoose.Types.ObjectId(String(reservation.user_id_guest)),
            room_number: reservation.room_number,
            bed_number: reservation.bed_number,
            checkin_date: new Date(reservation.checkin_date),
            checkout_date: new Date(reservation.checkout_date),
            hostel_id: new mongoose.Types.ObjectId(hostel._id)
        });

        await newReservation.save();

        // Adiciona reserva em reservation_id na coleçao rooms 
        const roomUpdateResult = await Room.updateOne(
            { name: reservation.room_number, "beds.bed_number": reservation.bed_number },
            {
                $set: {
                    "beds.$.reservation_id": newReservation._id
                }
            }
        );

        if (roomUpdateResult.matchedCount === 0) {
            return res.status(500).json({
                message: "Failed to update room with reservation ID",
                success: false,
            });
        }

        // Adiciona reserva em reservations na coleção Guest
        const guestUpdateResult = await Guest.updateOne(
            { user: reservation.user_id_guest },
            {
                $push: { reservations: newReservation._id }
            }
        );

        if (guestUpdateResult.matchedCount === 0) {
            return res.status(500).json({
                message: "Failed to update guest with reservation",
                success: false,
            });
        }

        // Adiciona reserva em guests da coleção de hostel
        const updatedHostel = await Hostel.findOneAndUpdate(
            { _id: hostel._id },
            {
                $addToSet: { user_id_guests: reservation.user_id_guest }
            },
            { new: true }
        );

        if (!updatedHostel) {
            return res.status(500).json({
                message: "Failed to update hostel with new guest",
                success: false,
            });
        }

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