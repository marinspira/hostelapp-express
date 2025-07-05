import { getRelativeFilePath } from "../middleware/saveUploads.js";
import Guest from "../models/guest.model.js"
import fs from 'fs';
import path from 'path';
import User from "../models/user.model.js";
import Reservation from "../models/reservation.model.js";
import generateUniqueUsername from "../utils/generateUniqueUsername.js";

export const saveGuest = async (req, res) => {
    try {
        const { guestData } = req.body

        const user = req.user

        const guest = await Guest.findOne({ user: user._id });
        const username = await generateUniqueUsername(user.name);

        if (guest) {

            // Guest exists (guest just exists if created by google, that upload the profile photo on the authentication), update guest data if birthday is empty
            if (!guest.birthday || guest.birthday === null) {
                gguest.username = username;
                guest.birthday = guestData.birthday || guest.birthday;
                guest.phoneNumber = guestData.phoneNumber || guest.phoneNumber;
                guest.country = guestData.country || guest.country;
                guest.passaportPhoto = guestData.passaportPhoto || guest.passaportPhoto;
                guest.digitalNomad = guestData.digitalNomad || guest.digitalNomad;
                guest.smoker = guestData.smoker || guest.smoker;
                guest.pets = guestData.pets || guest.pets;
                guest.showProfileAuthorization = guestData.showProfileAuthorization || guest.showProfileAuthorization;
                await guest.save();

                user.isNewUser = false;
                await user.save()

                return res.status(200).json({
                    message: 'Guest updated!',
                    success: true,
                    data: guest
                });

            } else {
                return res.status(400).json({ error: 'Birthday cannot be updated for existing guest!' });
            }
        } else {

            // TODO: Criar username para guest

            const newGuest = new Guest({
                username: username,
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

            user.isNewUser = false;
            await user.save()

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

export const getGuest = async (req, res) => {
    try {
        const user = req.user
        const guest = await Guest.findOne({ user: user._id })

        if (!guest) {
            return res.status(404).json({
                message: 'Guest not found!',
                success: false
            })
        }

        return res.status(200).json({
            message: 'Guest retrieved successfully',
            success: true,
            data: {
                guestPhotos: guest.guestPhotos,
                phoneNumber: guest.phoneNumber,
                birthday: guest.birthday,
                country: guest.country,
                passaportPhoto: guest.passaportPhoto,
                interests: guest.interests,
                description: guest.description,
                languages: guest.languages,
                digitalNomad: guest.digitalNomad,
                smoker: guest.smoker,
                pets: guest.pets,
                instagram: guest.instagram,
                linkedin: guest.linkedin,
                twitter: guest.twitter,
                showProfileAuthorization: guest.showProfileAuthorization,
            }
        })
    } catch (error) {
        console.error('Error in getGuest controller:', error.message)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}

export const updateGuest = async (req, res) => {
    try {
        const user = req.user;
        const { guestData } = req.body;

        console.log(req.body)

        const guest = await Guest.findOne({ user: user._id });

        if (!guest) {
            return res.status(404).json({
                success: false,
                message: "Guest not found",
            });
        }

        Object.keys(guestData).forEach((key) => {
            guest[key] = guestData[key];
        });

        await guest.save();

        const {
            guestPhotos,
            phoneNumber,
            country,
            passaportPhoto,
            interests,
            languages,
            digitalNomad,
            smoker,
            pets,
            showProfileAuthorization,
            description,
            instagram,
            linkedin,
            twitter,
            username
        } = guest;

        return res.status(200).json({
            success: true,
            message: "Guest updated successfully",
            data: {
                guestPhotos,
                phoneNumber,
                country,
                passaportPhoto,
                interests,
                languages,
                digitalNomad,
                smoker,
                pets,
                showProfileAuthorization,
                description,
                instagram,
                linkedin,
                twitter,
                username
            },
        });
    } catch (error) {
        console.error("Error in updateGuest:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const searchGuest = async (req, res) => {
    const { username } = req.params;

    try {
        // Find users by email (case-insensitive)
        const usersWithEmailMatch = await User.find({
            email: { $regex: username, $options: 'i' },
            role: 'guest',
        });

        // Find guests by username
        const guestsWithUsernameMatch = await Guest.find({
            username: { $regex: username, $options: 'i' }
        }).populate('user'); // Populate user for access to name/email

        // Merge results
        const guests = [];

        // Process users matched by email
        for (const user of usersWithEmailMatch) {
            const guest = await Guest.findOne({ user: user._id });

            if (guest) {
                guests.push({
                    user_id_guest: user._id,
                    name: user.name,
                    email: user.email,
                    image: guest.guestPhotos?.[0] || null,
                    username: guest.username,
                });
            }
        }

        // Process guests matched by username
        for (const guest of guestsWithUsernameMatch) {
            // Avoid duplicates if already added via user email
            if (!guests.some(g => g.user_id_guest.toString() === guest.user._id.toString())) {
                guests.push({
                    user_id_guest: guest.user._id,
                    name: guest.user.name,
                    email: guest.user.email,
                    image: guest.guestPhotos?.[0] || null,
                    username: guest.username,
                });
            }
        }

        if (guests.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No guest or user found with the given username.',
                data: [],
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Guest(s) found successfully.',
            data: guests,
        });
    } catch (error) {
        console.error("Error in searchGuest:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const saveGuestProfileImages = async (req, res) => {
    try {
        const { imageId } = req.body;
        const imagePath = getRelativeFilePath(req, req.file)

        const user = req.user
        const guest = await Guest.findOne({ user: user._id })

        if (guest) {
            if (imageId < guest.guestPhotos.length) {
                guest.guestPhotos[imageId] = imagePath;
            } else {
                guest.guestPhotos.push(imagePath);
            }

            await guest.save();

            return res.status(200).json({
                message: 'Guest images updated.',
                success: true,
                data: {
                    imagePath
                }
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

export const deleteGuestProfileImage = async (req, res) => {
    try {
        const { imageId } = req.body;
        const user = req.user
        const guest = await Guest.findOne({ user: user._id })

        if (!guest) {
            return res.status(404).json({
                message: 'Guest not found!',
                success: false
            })
        }

        if (guest && imageId < guest.guestPhotos.length) {

            const imagePath = guest.guestPhotos[imageId];

            // Delete from files
            const fullImagePath = path.resolve(imagePath);

            fs.unlink(fullImagePath, async (err) => {
                if (err) {
                    console.error('Error deleting file: ', err);
                    return res.status(500).json({
                        message: 'Failed to delete the image file.',
                        success: false,
                    });
                }
                return
            })

            // Delete from the DB
            guest.guestPhotos.splice(imageId, 1);

            await guest.save();

            return res.status(200).json({
                message: 'Imagem removida com sucesso.',
                success: true,
                data: {
                    imageId
                }
            });
        }

        return res.status(404).json({ error: 'Imagem não encontrada.' });

    } catch (error) {
        console.error('Error in deleteGuestProfileImage: ', error.message)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}

export const getHome = async (req, res) => {
    try {
        const user = req.user
        const guest = await Guest.findOne({ user: user._id })

        if (!guest) {
            return res.status(404).json({
                message: 'Guest not found!',
                success: false
            })
        }

        const reservations = await Reservation.find({ guest_id: user._id })

        const now = new Date();

        const currentReservation = reservations.find((reservation) => {
            const checkinDate = new Date(reservation.checkin_date);
            checkinDate.setHours(0, 1, 0, 0);

            const checkoutDate = new Date(reservation.checkout_date);
            checkoutDate.setHours(10, 0, 0, 0);

            return now >= checkinDate && now < checkoutDate;
        });

        console.log(currentReservation)

        if (!currentReservation) {
            return res.status(200).json({
                success: true,
                message: "Any reservation at the moment",
                data: null
            })
        }



        return res.status(200).json({
            success: true,
            message: "Any reservation at the moment",
            data: {
                hostel: {
                    id: "",
                    img: "",
                    name: "",
                },
                otherGuests: [{
                    name: "",
                    img: ""
                }],
                hostelEvents: ["events"]
            }
        })

        console.log("reservas: ", reservations)

    } catch (error) {
        console.error('Error in getHome: ', error.message)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}