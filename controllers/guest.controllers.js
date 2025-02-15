import { getRelativeFilePath } from "../middleware/saveUploads.js";
import Guest from "../models/guest.model.js"
import fs from 'fs';
import path from 'path';

export const saveGuest = async (req, res) => {
    try {
        const { guestData } = req.body

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

        return res.status(200).json({
            success: true,
            message: "Guest updated successfully",
            data: guest,
        });
    } catch (error) {
        console.error("Error in updateGuest:", error.message);
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