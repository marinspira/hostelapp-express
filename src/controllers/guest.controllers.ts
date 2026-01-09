import fs from 'fs';
import path from 'path';

// @ts-ignore
import type { Response } from 'express';

// @ts-ignore
import { getRelativeFilePath } from '../middleware/saveUploads.js';
// @ts-ignore
import Guest from '../models/guest.model.ts';
// @ts-ignore
import User from '../models/user.model.ts';
// @ts-ignore
import Reservation from '../models/reservation.model.ts';
import { AuthenticatedRequest } from '../interfaces/index.ts';
import { IUserDocument } from '../interfaces/user.ts';
// @ts-ignore
import generateUniqueUsername from '../utils/generateUniqueUsername.js';
import { BackendResponse } from '../interfaces/response.ts';
import { IGuestDocument } from '../interfaces/guest.ts';

import { UploadedFile } from './events.controllers.ts';

interface CreateGuestRequest extends AuthenticatedRequest {
  body: {
    guest: string;
  };
  file: UploadedFile;
  user: IUserDocument;
}

export const saveGuest = async (
  req: CreateGuestRequest,
  res: Response<BackendResponse<IGuestDocument>>
) => {
  const user = req.user;
  const guest = typeof req.body.guest === 'string' ? JSON.parse(req.body.guest) : req.body.guest;

  if (!guest || !guest.name || guest.name.trim() === '') {
    return res.status(400).json({
      message: 'Guest name is required',
      success: false,
    });
  }

  const imagePath = getRelativeFilePath(req, req.file);

  let existingGuest = await Guest.findOne({ user: user._id });

  if (existingGuest) {
    return res.status(409).json({
      message: 'Guest already exists',
      success: false,
    });
  } else {
    const username = await generateUniqueUsername(guest.name);

    const newGuest = new Guest({
      name: guest.name,
      username: username,
      profile: imagePath,
      guestPhotos: guest.guestPhotos,
      phone: guest.phone,
      birthday: guest.birthday,
      country: guest.country,
      passaportPhoto: guest.passaportPhoto,
      interests: guest.interests,
      description: guest.description,
      languages: guest.languages,
      digitalNomad: guest.digitalNomad,
      smoker: guest.smoker,
      pets: guest.pets,
      showProfileAuthorization: guest.showProfileAuthorization,
      user: user._id,
    });
    await newGuest.save();

    user.isNewUser = false;
    await user.save();

    return res.status(201).json({
      message: 'Guest profile created successfully!',
      success: true,
      data: newGuest,
    });
  }
};

export const getGuest = async (req: AuthenticatedRequest, res: Response<BackendResponse<any>>) => {
  const user = req.user;
  const guest = await Guest.findOne({ user: user._id });

  if (!guest) {
    return res.status(404).json({
      message: 'Guest not found!',
      success: false,
    });
  }

  return res.status(200).json({
    message: 'Guest retrieved successfully',
    success: true,
    data: {
      guestPhotos: guest.guestPhotos,
      phone: guest.phone,
      birthday: guest.birthday,
      country: guest.country,
      passaportPhoto: guest.passaportPhoto,
      interests: guest.interests,
      description: guest.description,
      languages: guest.languages,
      digitalNomad: guest.digitalNomad,
      smoker: guest.smoker,
      pets: guest.pets,
      showProfileAuthorization: guest.showProfileAuthorization,
    },
  });
};

interface UpdateGuestRequest extends AuthenticatedRequest {
  body: {
    guestData: any;
  };
}

export const updateGuest = async (req: UpdateGuestRequest, res: Response<BackendResponse<any>>) => {
  const user = req.user;
  const { guestData } = req.body;

  const guest = await Guest.findOne({ user: user._id });

  if (!guest) {
    return res.status(404).json({
      success: false,
      message: 'Guest not found',
    });
  }

  // Type-safe property updates
  const allowedFields = [
    'name',
    'username',
    'profile',
    'guestPhotos',
    'phone',
    'birthday',
    'country',
    'passaportPhoto',
    'interests',
    'description',
    'languages',
    'digitalNomad',
    'smoker',
    'pets',
    'instagram',
    'linkedin',
    'twitter',
    'showProfileAuthorization',
  ];

  Object.keys(guestData).forEach(key => {
    if (allowedFields.includes(key)) {
      (guest as any)[key] = guestData[key];
    }
  });

  await guest.save();

  const {
    guestPhotos,
    phone,
    country,
    passaportPhoto,
    interests,
    languages,
    digitalNomad,
    smoker,
    pets,
    showProfileAuthorization,
    description,
    username,
  } = guest;

  return res.status(200).json({
    success: true,
    message: 'Guest updated successfully',
    data: {
      guestPhotos,
      phone,
      country,
      passaportPhoto,
      interests,
      languages,
      digitalNomad,
      smoker,
      pets,
      showProfileAuthorization,
      description,
      username,
    },
  });
};

interface SearchGuestRequest extends AuthenticatedRequest {
  params: {
    username: string;
  };
}

export const searchGuest = async (req: SearchGuestRequest, res: Response<BackendResponse<any>>) => {
  const { username } = req.params;

  // Find users by email (case-insensitive)
  const usersWithEmailMatch = await User.find({
    email: { $regex: username, $options: 'i' },
    role: 'guest',
  });

  // Find guests by username
  const guestsWithUsernameMatch = await Guest.find({
    username: { $regex: username, $options: 'i' },
  }).populate('user');

  // Merge results
  const guests = [];

  // Process users matched by email
  for (const user of usersWithEmailMatch) {
    const guest = await Guest.findOne({ user: user._id });

    if (guest) {
      guests.push({
        user_id_guest: user._id,
        name: guest.name,
        email: user.email,
        image: guest.guestPhotos?.[0] || null,
        username: guest.username,
      });
    }
  }

  // Process guests matched by username
  for (const guest of guestsWithUsernameMatch) {
    // Type guard to ensure user is populated
    if (guest.user && typeof guest.user === 'object' && 'email' in guest.user) {
      const populatedUser = guest.user as unknown as IUserDocument;
      // Avoid duplicates if already added via user email
      if (!guests.some(g => g.user_id_guest.toString() === populatedUser._id.toString())) {
        guests.push({
          user_id_guest: populatedUser._id,
          name: guest.name,
          email: populatedUser.email,
          image: guest.guestPhotos?.[0] || null,
          username: guest.username,
        });
      }
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
};

interface SaveGuestProfileImagesRequest extends AuthenticatedRequest {
  body: {
    imageId: number;
  };
  file: UploadedFile;
}

export const saveGuestProfileImages = async (
  req: SaveGuestProfileImagesRequest,
  res: Response<BackendResponse<any>>
) => {
  const { imageId } = req.body;
  const imagePath = getRelativeFilePath(req, req.file);

  const user = req.user;
  const guest = await Guest.findOne({ user: user._id });

  console.log('Image path to save:', imagePath);
  console.log(guest);

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
        imagePath,
      },
    });
  }

  const newGuest = new Guest({
    guestPhotos: [imagePath],
    user: user._id,
  });

  if (newGuest) {
    await newGuest.save();

    return res.status(201).json({
      message: 'New guest created, and photos added.',
      success: true,
      data: {
        imagePath,
      },
    });
  } else {
    return res.status(400).json({
      message: 'Error saving guest',
      success: false,
    });
  }
};

interface DeleteGuestProfileImageRequest extends AuthenticatedRequest {
  body: {
    imageId: number;
  };
}

export const deleteGuestProfileImage = async (
  req: DeleteGuestProfileImageRequest,
  res: Response<BackendResponse<any>>
) => {
  const { imageId } = req.body;
  const user = req.user;
  const guest = await Guest.findOne({ user: user._id });

  if (!guest) {
    return res.status(404).json({
      message: 'Guest not found!',
      success: false,
    });
  }

  if (guest && imageId < guest.guestPhotos.length) {
    const imagePath = guest.guestPhotos[imageId];

    // Delete from files
    const fullImagePath = path.resolve(imagePath);

    fs.unlink(fullImagePath, async err => {
      if (err) {
        console.error('Error deleting file: ', err);
        return res.status(500).json({
          message: 'Failed to delete the image file.',
          success: false,
        });
      }
      return;
    });

    // Delete from the DB
    guest.guestPhotos.splice(imageId, 1);

    await guest.save();

    return res.status(200).json({
      message: 'Image successfully deleted',
      success: true,
      data: {
        imageId,
      },
    });
  }

  return res.status(404).json({
    message: 'Image not found.',
    success: false,
  });
};

export const getHome = async (req: AuthenticatedRequest, res: Response<BackendResponse<any>>) => {
  const user = req.user;
  const guest = await Guest.findOne({ user: user._id });

  if (!guest) {
    return res.status(404).json({
      message: 'Guest not found!',
      success: false,
    });
  }

  const reservations = await Reservation.find({
    user_id_guest: user._id,
  }).populate({
    path: 'hostel_id',
    select: 'name logo _id',
  });

  const now = new Date();

  const currentReservation = reservations.find((reservation: any) => {
    const checkinDate = new Date(reservation.checkin_date);
    checkinDate.setHours(0, 1, 0, 0);

    const checkoutDate = new Date(reservation.checkout_date);
    checkoutDate.setHours(10, 0, 0, 0);

    return now >= checkinDate && now < checkoutDate;
  });

  console.log(currentReservation);

  if (!currentReservation) {
    return res.status(200).json({
      success: true,
      message: 'No current reservation',
      data: null,
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Current reservation retrieved successfully',
    data: {
      hostel: {
        id: (currentReservation.hostel_id as any)?._id,
        img: (currentReservation.hostel_id as any)?.logo || '',
        name: (currentReservation.hostel_id as any)?.name || '',
      },
      reservation: {
        id: currentReservation._id,
        room: currentReservation.room_number,
        bed: currentReservation.bed_number,
        checkinDate: currentReservation.checkin_date,
        checkoutDate: currentReservation.checkout_date,
        status: currentReservation.status,
      },
      otherGuests: [
        {
          name: '',
          img: '',
        },
      ],
      hostelEvents: ['events'],
    },
  });
};

export const getCurrentStay = async (
  req: AuthenticatedRequest,
  res: Response<BackendResponse<any>>
) => {
  console.log('Getting current stay for guest...');
  try {
    const user = req.user;
    const guest = await Guest.findOne({ user: user._id });

    if (!guest) {
      return res.status(404).json({
        message: 'Guest not found!',
        success: false,
      });
    }

    const now = new Date();

    // Busca reservas ativas
    const activeReservations = await Reservation.find({
      user_id_guest: user._id,
      checkin_date: { $lte: now },
      checkout_date: { $gt: now },
      status: { $in: ['walking in', 'in house'] },
    }).populate('hostel_id');

    console.log('Active reservations found:', activeReservations);

    if (activeReservations.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Guest is not currently staying at any hostel',
        data: {
          isCurrentlyStaying: false,
          activeReservations: [],
        },
      });
    }

    const formattedReservations = activeReservations.map((reservation: any) => ({
      reservationId: reservation._id,
      hostel: {
        id: reservation.hostel_id?._id,
        name: reservation.hostel_id?.name,
        logo: reservation.hostel_id?.logo,
        address: reservation.hostel_id?.address,
        phone: reservation.hostel_id?.phone,
        email: reservation.hostel_id?.email,
      },
      room: reservation.room_number,
      bed: reservation.bed_number,
      checkinDate: reservation.checkin_date,
      checkoutDate: reservation.checkout_date,
      status: reservation.status,
      daysRemaining: Math.ceil(
        (new Date(reservation.checkout_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    return res.status(200).json({
      success: true,
      message: 'Guest is currently staying at hostel(s)',
      data: {
        isCurrentlyStaying: true,
        activeReservations: formattedReservations,
        totalActiveStays: formattedReservations.length,
      },
    });
  } catch (error) {
    console.error('Error checking current stay:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null,
    });
  }
};
