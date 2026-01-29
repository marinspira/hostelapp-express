import { getRelativeFilePath } from '../middleware/saveUploads.js';
import Guest from '../models/guest.model.ts';
import Hostel from '../models/hostel.model.ts';
import Reservation from '../models/reservation.model.ts';
import User from '../models/user.model.ts';
import countries from '../utils/coutries.js';
import generateUniqueUsername from '../utils/generateUniqueUsername.js';
import { ensureHostelGroupChat } from '../services/chat/groupChatManager.js';

export const createHostel = async (req, res) => {
  const user = req.user;
  const hostel =
    typeof req.body.hostel === 'string' ? JSON.parse(req.body.hostel) : req.body.hostel;

  if (!hostel || !hostel.name || hostel.name.trim() === '') {
    return res.status(400).json({
      message: 'Hostel name is required',
      success: false,
    });
  }

  const imagePath = getRelativeFilePath(req, req.file);

  const existingHostel = await Hostel.findOne({ user_id_owners: user._id });

  const countryData = countries.find(c => c.country === hostel.country);
  const currency = countryData ? countryData.currency : 'EUR';

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
        zip: hostel.zip,
      },
      currency: currency,
      phone: hostel.phone,
      email: hostel.email,
      website: hostel.website,
      experience_with_volunteers: hostel.experience_with_volunteers,
      user_id_owners: [user._id],
    });
    await newHostel.save();

    User.isNewUser = false;
    await User.save();

    await ensureHostelGroupChat(newHostel._id);

    return res.status(201).json({
      message: 'Hostel created!',
      success: true,
      data: newHostel,
    });
  }
};

export const getHostel = async (req, res) => {
  const user = req.user;
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
    data: existingHostel,
  });
};

export const getAllGuests = async (req, res) => {
  const user = req.user;
  const existingHostel = await Hostel.findOne({ user_id_owners: user._id });

  if (!existingHostel) {
    return res.status(409).json({
      message: 'Hostel not found',
      success: false,
    });
  }

  // Get current reservations (in house and walking in status)
  const currentReservations = await Reservation.find({
    hostel_id: existingHostel._id,
    status: { $in: ['in house', 'walking in'] },
  })
    .populate({
      path: 'user_id_guest',
      select: 'email',
    })
    .sort({ checkin_date: -1 }); // Sort by most recent checkin date

  if (!currentReservations.length) {
    return res.status(200).json({
      message: 'No current guests found',
      success: true,
      data: [],
    });
  }

  // Group reservations by guest and keep only the most recent one for each guest
  const guestReservationsMap = new Map();
  const currentDate = new Date();

  currentReservations.forEach(reservation => {
    const guestId = reservation.user_id_guest._id.toString();
    const existingReservation = guestReservationsMap.get(guestId);

    if (!existingReservation) {
      guestReservationsMap.set(guestId, reservation);
    } else {
      // Compare dates to find the reservation closest to current date
      const currentReservationDate = new Date(reservation.checkin_date);
      const existingReservationDate = new Date(existingReservation.checkin_date);

      // Keep the reservation that is closest to current date (most recent checkin)
      if (currentReservationDate > existingReservationDate) {
        guestReservationsMap.set(guestId, reservation);
      }
    }
  });

  const uniqueReservations = Array.from(guestReservationsMap.values());

  // Get guest details for unique reservations
  const guestUserIds = uniqueReservations.map(reservation => reservation.user_id_guest._id);

  const guestsData = await Guest.find({ user: { $in: guestUserIds } }).populate({
    path: 'user',
    select: 'email',
  });

  const guests = uniqueReservations.map(reservation => {
    const guestData = guestsData.find(
      guest => guest.user._id.toString() === reservation.user_id_guest._id.toString()
    );

    return {
      userId: reservation.user_id_guest._id,
      name: guestData?.name || 'Unknown',
      email: reservation.user_id_guest.email,
      firstPhoto: guestData?.guestPhotos?.[0] || null,
      roomNumber: reservation.room,
      bedNumber: reservation.bed,
      checkinDate: reservation.checkin_date,
      checkoutDate: reservation.checkout_date,
      reservationId: reservation._id,
    };
  });

  return res.status(200).json({
    message: 'Guests',
    success: true,
    data: guests,
  });
};
