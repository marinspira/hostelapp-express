import mongoose from "mongoose";
import Hostel from "../models/hostel.model.js";
import Room from "../models/room.model.js";

export const createRoom = async (req, res) => {
    try {
        const user = req.user
        const { room } = req.body

        const hostel = await Hostel.findOne({ owners: user._id });

        if (!hostel) {
            return res.status(400).json({
                message: 'Hostel does not exist!',
                success: false,
            });
        }

        // Verificar se já existe um quarto com o mesmo nome no hostel
        const existingRoom = await Room.findOne({
            name: room.name,
            hostel: hostel._id,
        });

        if (existingRoom) {
            return res.status(400).json({
                message: 'A room with the same name already exists in this hostel.',
                success: false,
            });
        }

        const capacity = parseInt(room.capacity, 10);

        if (isNaN(capacity) || capacity <= 0) {
            return res.status(400).json({
                message: 'Invalid capicity number',
                success: false,
            });
        }

        // Geração dinâmica dos beds
        const beds = [];
        for (let i = 0; i < capacity; i++) {
            let bedNumber;
            if (room.organization_by === 'Por letras') {
                bedNumber = String.fromCharCode(65 + i); // 65 é A
            } else {
                bedNumber = String(i + 1);
            }

            beds.push({
                bed_number: bedNumber,
                reservation_id: null,
            });
        }

        const newRoom = new Room({
            type: room.type,
            name: room.name,
            capacity,
            organization_by: room.organization_by,
            beds,
            hostel: hostel._id,
        });

        await newRoom.save();

        return res.status(201).json({
            message: 'Room created!',
            success: true,
            data: newRoom,
        });
    } catch (error) {
        console.error("Error in createRoom controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const getAllRooms = async (req, res) => {
    try {
        const user = req.user
        const hostel = await Hostel.findOne({ owners: user._id });

        if (!hostel) {
            return res.status(400).json({
                message: 'Hostel not found!',
                success: false,
            });
        }

        const today = new Date();

        const rooms = await Room.aggregate([
            {
                $match: {
                    hostel: new mongoose.Types.ObjectId(hostel._id),
                },
            },
            {
                $unwind: "$beds",
            },
            {
                $lookup: {
                    from: "reservations",
                    let: {
                        roomName: "$name",
                        bedNumber: "$beds.bed_number",
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$room_number", "$$roomName"] },
                                        { $eq: ["$bed_number", "$$bedNumber"] },
                                        { $lte: ["$checkin_date", today] },
                                        { $gte: ["$checkout_date", today] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: "reservation",
                },
            },
            {
                $unwind: {
                    path: "$reservation",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "guests",
                    localField: "reservation.guest",
                    foreignField: "user",
                    as: "guest",
                },
            },
            {
                $unwind: {
                    path: "$guest",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $group: {
                    _id: "$_id",
                    name: { $first: "$name" },
                    type: { $first: "$type" },
                    capacity: { $first: "$capacity" },
                    organization_by: { $first: "$organization_by" },
                    hostel: { $first: "$hostel" },
                    beds: {
                        $push: {
                            bed_number: "$beds.bed_number",
                            reservation_id: "$beds.reservation_id",
                            guestPhoto: { $arrayElemAt: ["$guest.guestPhotos", 0] },
                        },
                    },
                },
            },
            {
                $sort: { name: 1 }, // ordena pelos nomes dos quartos
            },
        ]);

        console.log(rooms)

        return res.status(200).json({
            message: 'Rooms retrieved successfully!',
            success: true,
            data: rooms,
        });

    } catch (error) {
        console.error("Error in getRooms controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}