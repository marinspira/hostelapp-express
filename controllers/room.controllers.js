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
                assigned_by: null,
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