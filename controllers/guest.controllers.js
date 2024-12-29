import { getRelativeFilePath } from "../middleware/saveUploads.js";
import Guest from "../models/guest.model.js"

export const saveGuest = async (req, res) => {
    try {
        const {
            guestData
        } = req.body

        const user = req.user

        const guest = await Guest.findOne({ user: user._id });

        if (guest) {
            // Guest exists, update guest data if birthday is empty
            if (!guest.birthday || guest.birthday === null) {
                guest.birthday = guestData.birthday || guest.birthday;
                guest.phoneNumber = guestData.phoneNumber || guest.phoneNumber;
                guest.country = guestData.country || guest.country;
                guest.passaportPhoto = guestData.passaportPhoto || guest.passaportPhoto;
                guest.digitalNomad = guestData.digitalNomad || guest.digitalNomad;
                guest.smoker = guestData.smoker || guest.smoker;
                guest.pets = guestData.pets || guest.pets;
                guest.showProfileAuthorization = guestData.showProfileAuthorization || guest.showProfileAuthorization;
                await guest.save();
                return res.status(200).json({
                    message: 'Guest updated!',
                    success: true,
                    data: guest
                });
            } else {
                return res.status(400).json({ error: 'Birthday cannot be updated for existing guest!' });
            }
        } else {
            const newGuest = new Guest({
                phoneNumber: guestData.phoneNumber,
                birthday: guestData.birthday,
                country: guestData.country,
                passaportPhoto: guestData.passaportPhoto,
                digitalNomad: guestData.digitalNomad,
                smoker: guestData.smoker,
                pets: guestData.pets,
                showProfileAuthorization: guestData.showProfileAuthorization,
                user: user._id
            });

            await newGuest.save();
            return res.status(201).json({
                message: 'Guest created!',
                success: true,
                data: newGuest
            });
        }

    } catch (error) {
        console.error("Error in saveGuest controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const saveGuestProfileImages = async (req, res) => {
    try {
        const { id } = req.body;
        const imagePath = getRelativeFilePath(req, req.file)

        const user = req.user
        const guest = await Guest.findOne({ user: user._id })

        if (guest) {
            while (guest.guestPhotos.length <= id) {
                guest.guestPhotos.push(null);
            }

            guest.guestPhotos[id] = imagePath;

            await guest.save();

            return res.status(200).json({
                message: 'Guest images updated.',
                success: true
            });
        }

        const newGuest = new Guest({
            guestPhotos: [imagePath],
            user: user._id
        })

        if (newGuest) {
            await newGuest.save()

            return res.status(201).json({
                message: 'New guest created, and photos added.',
                success: true
            })
        } else {
            return res.status(400).json({ error: 'Error saving guest' })
        }
    } catch (error) {
        console.error('Error in saveGuestProfileImages: ', error.message)
        return res.status(500).json({ error: "Internal Server Error" });
    }
} 