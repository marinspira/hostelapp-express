import Hostel from "../models/hostel.model.js";
import generateUniqueUsername from "../utils/generateUniqueUsername.js";

export const createHostel = async (req, res) => {
    try {
        const user = req.user
        const { hostel } = req.body

        const existingHostel = await Hostel.findOne({ owners: user._id });

        if (existingHostel) {
            return res.status(200).json({
                message: 'Hostel already exists',
                success: true,
                data: existingHostel
            });
        } else {

            const username = await generateUniqueUsername(hostel.name);

            const newHostel = new Hostel({
                username: username,
                name: hostel.name,
                address: {
                    street: hostel.street,
                    city: hostel.city,
                    country: hostel.country,
                    zip: hostel.zip
                },
                phone: hostel.phone,
                email: hostel.email,
                website: hostel.website,
                experience_with_volunteers: hostel.experience_with_volunteers,
                owners: [user._id],
            })

            await newHostel.save();
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