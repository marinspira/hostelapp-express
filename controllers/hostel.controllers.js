import { getRelativeFilePath } from "../middleware/saveUploads.js";
import Chat from "../models/chat.model.js";
import Event from "../models/event.model.js";
import Guest from "../models/guest.model.js";
import Hostel from "../models/hostel.model.js";
import Room from "../models/room.model.js";
import User from "../models/user.model.js";
import { countryCurrencyMap } from "../utils/currencies.js";
import generateUniqueUsername from "../utils/generateUniqueUsername.js";

export const createHostel = async (req, res) => {
    try {
        const user = req.user
        const hostel = req.body.hostel
        const imagePath = getRelativeFilePath(req, req.file)

        const existingHostel = await Hostel.findOne({ user_id_owners: user._id });

        const currency = countryCurrencyMap[hostel.country] || "EUR";

        if (existingHostel) {
            return res.status(409).json({
                message: 'Hostel already exists',
                success: false,
            });
        } else {
            const username = await generateUniqueUsername(hostel.name);

            const newHostel = new Hostel({
                username: username,
                name: hostel.name,
                logo: imagePath,
                address: {
                    street: hostel.street,
                    city: hostel.city,
                    country: hostel.country,
                    zip: hostel.zip
                },
                currency: currency,
                phone: hostel.phone,
                email: hostel.email,
                website: hostel.website,
                experience_with_volunteers: hostel.experience_with_volunteers,
                user_id_owners: [user._id],
            })
            await newHostel.save();

            user.isNewUser = false;
            await user.save()

            const chat = new Chat({
                participants: [
                    { hostel: newHostel._id },
                ],
                group: true
            });
            await chat.save();

            return res.status(201).json({
                message: 'Hostel created!',
                success: true,
                data: newHostel
            });
        }
    } catch (error) {
        console.error("Error in createHostel controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const getHostel = async (req, res) => {
    try {
        const user = req.user
        const existingHostel = await Hostel.findOne({ user_id_owners: user._id });

        if (!existingHostel) {
            return res.status(409).json({
                message: 'Hostel not found',
                success: false,
            });
        }

        return res.status(200).json({
            message: 'Hostel found succefully!',
            success: true,
            data: existingHostel
        });

    } catch (error) {
        console.error("Error in getHostel controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const getAllGuests = async (req, res) => {
    try {
        const user = req.user
        const existingHostel = await Hostel.findOne({ user_id_owners: user._id });

        if (!existingHostel) {
            return res.status(409).json({
                message: 'Hostel not found',
                success: false,
            });
        }

        const user_id_guests = existingHostel.user_id_guests || [];

        if (!user_id_guests.length) {
            return res.status(200).json({
                message: 'No guests found',
                success: true,
                data: []
            });
        }

        // TODO: Ordernar por data de reserva

        const filteredGuestsData = await Guest.find({ user: { $in: user_id_guests } })
            .select("guestPhotos user")
            .populate({
                path: "user",
                select: "name"
            });

        const guests = filteredGuestsData.map((guest) => ({
            userId: guest.user._id,
            name: guest.user.name,
            firstPhoto: guest.guestPhotos?.[0] || null
        }));

        return res.status(200).json({
            message: 'Guests',
            success: true,
            data: guests
        });

    } catch (error) {
        console.error("Error in getAllGuests controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const getHomeScreen = async (req, res) => {
    try {
        const user = req.user
        const existingHostel = await Hostel.findOne({ user_id_owners: user._id });

        if (!existingHostel) {
            return res.status(409).json({
                message: 'Hostel not found',
                success: false,
            });
        }

        const rooms = await Room.find({ hostel: existingHostel._id })
            .sort({ date: -1 })
            .limit(3)
            .select('_id type name capacity beds');

        const events = await Event.find({ hostel_id: existingHostel._id })
            .sort({ date: -1 })
            .limit(3)
            .select('_id img name date price photos_last_event attendees');

        return res.status(200).json({
            message: 'Home content',
            success: true,
            data: {
                events,
                rooms
            }
        });

    } catch (error) {
        console.error("Error in getHomeScreen controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}