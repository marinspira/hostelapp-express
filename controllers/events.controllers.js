import Hostel from "../models/hostel.model.js";
import Event from "../models/event.model.js";
import { getRelativeFilePath } from "../middleware/saveUploads.js";

export const createEvent = async (req, res) => {
    const user = req.user
    const hostel = await Hostel.findOne({ user_id_owners: user._id });

    const event = req.body.event
    const imagePath = getRelativeFilePath(req, req.file)

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
            street: event.hostel_location === true ? hostel.address.street : event.street,
            city: event.hostel_location === true ? hostel.address.city : event.city,
            zip: event.hostel_location === true ? hostel.address.zip : event.zip
        },
        hostel_id: hostel._id,
        img: imagePath
    });
    await newEvent.save()

    return res.status(201).json({
        success: true,
    });
}

export const getAllEvents = async (req, res) => {
    const user = req.user
    const hostel = await Hostel.findOne({ user_id_owners: user._id });

    if (!hostel) {
        return res.status(400).json({
            message: 'Hostel does not exist!',
            success: false,
        });
    }

    const event = await Event.find({ hostel_id: hostel._id })

    return res.status(200).json({
        message: "Event found successfully",
        success: true,
        data: event
    })
}