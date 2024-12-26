import Guest from "../models/guest.model.js"

export const saveGuest = async (req, res) => {
    try {
        const {
            guestData
        } = req.body

        const user = req.user

        const guest = await Guest.findOne({ user: user._id });

        if (guest.birthday !== null) {
            return res.status(400).json({
                message: 'Guest already exists!'
            })
        }

        const newGuest = new Guest({
            guestPhotos: Array.isArray(guestData.guestPhotos)
                ? guestData.guestPhotos.map(Buffer.from)
                : [],
            phoneNumber: guestData.phoneNumber,
            birthday: guestData.birthday,
            country: guestData.country,
            passaportPhoto: guestData.passaportPhoto,
            digitalNomad: guestData.digitalNomad,
            smoker: guestData.smoker,
            pets: guestData.pets,
            showProfileAuthorization: guestData.showProfileAuthorization,
            user: user._id
        })

        if (newGuest) {
            await newGuest.save()

            res.status(201).json({
                message: 'Guest saved!'
            })
        } else {
            res.status(400).json({ error: 'Error saving guest' })
        }

    } catch (error) {
        console.error("Error in saveGuest controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}