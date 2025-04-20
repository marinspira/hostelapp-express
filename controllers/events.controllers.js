import Hostel from "../models/hostel.model.js";
import Event from "../models/event.model.js";

export const createEvent = async (req, res) => {
    try {
        const user = req.user
        const hostel = await Hostel.findOne({ owners: user._id });
        const { event } = req.body

        if (!hostel) {
            return res.status(400).json({
                message: 'Hostel does not exist!',
                success: false,
            });
        }

        const newEvent = new Event({
            name: event.name,
            description: event.description,
            price: event.price,
            hostel_location: event.hostel_location,
            date: event.date,
            spots_available: event.spots_available,
            limited_spots: event.limited_spots,
            paid_event: event.paid_event,
            payment_to_hostel: event.payment_to_hostel,
            payment_methods: event.payment_methods,
            status: hostel ? "aprovado" : "pendente",
            address: {
                street: hostel.street,
                city: hostel.city,
                country: hostel.country,
                zip: hostel.zip
            },
            hostel_id: hostel._id
        });
        await newEvent.save()

        return res.status(201).json({
            success: true,
        });
    } catch (error) {
        console.error("Error in createEvent controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const getEvent = async (req, res) => {
    try {
        const user = req.user
        const hostel = await Hostel.findOne({ owners: user._id });

        if (!hostel) {
            return res.status(400).json({
                message: 'Hostel does not exist!',
                success: false,
            });
        }

        const event = await Event.findOne({ hostel_id: hostel._id })

        return res.status(200).json({
            message: "Event found successfully",
            success: true,
            data: event
        })

    } catch (error) {
        console.error("Error in getEvent controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}