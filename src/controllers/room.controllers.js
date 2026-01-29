import mongoose from 'mongoose';

import Hostel from '../models/hostel.model.ts';
import Reservation from '../models/reservation.model.ts';
import Room from '../models/room.model.ts';

export const createRoom = async (req, res) => {
  const user = req.user;
  const { room } = req.body;

  const hostel = await Hostel.findOne({ user_id_owners: user._id });

  if (!hostel) {
    return res.status(400).json({
      message: 'Hostel does not exist!',
      success: false,
    });
  }

  const existingRoom = await Room.findOne({
    name: room.name,
    hostel: hostel._id,
  });

  if (existingRoom) {
    return res.status(400).json({
      message: 'A room with the same name already exists in this hostel.',
      success: false,
    });
  }

  const capacity = parseInt(room.capacity, 10);

  if (isNaN(capacity) || capacity <= 0) {
    return res.status(400).json({
      message: 'Invalid capicity number',
      success: false,
    });
  }

  const beds = [];
  for (let i = 0; i < capacity; i++) {
    let bedNumber;
    if (room.organization_by === 'Por letras') {
      bedNumber = String.fromCharCode(65 + i);
    } else {
      bedNumber = String(i + 1);
    }

    beds.push({
      bed: bedNumber,
      reservation_id: null,
    });
  }

  const newRoom = new Room({
    type: room.type,
    name: room.name,
    capacity,
    organization_by: room.organization_by,
    beds,
    hostel: hostel._id,
  });

  await newRoom.save();

  hostel.rooms.push(newRoom._id);
  await hostel.save();

  return res.status(201).json({
    message: 'Room created!',
    success: true,
    data: newRoom,
  });
};

export const getAllRooms = async (req, res) => {
  const user = req.user;
  const hostel = await Hostel.findOne({ user_id_owners: user._id });

  if (!hostel) {
    return res.status(400).json({
      message: 'Hostel not found!',
      success: false,
    });
  }

  const today = new Date();

  const rooms = await Room.aggregate([
    {
      $match: {
        hostel: new mongoose.Types.ObjectId(hostel._id),
      },
    },
    {
      $unwind: '$beds',
    },
    {
      $lookup: {
        from: 'reservations',
        let: {
          roomName: '$name',
          bedNumber: '$beds.bed',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$room', '$$roomName'] },
                  { $eq: ['$bed', '$$bedNumber'] },
                  { $lte: ['$checkin_date', today] },
                  { $gte: ['$checkout_date', today] },
                ],
              },
            },
          },
        ],
        as: 'reservation',
      },
    },
    {
      $unwind: {
        path: '$reservation',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'guests',
        localField: 'reservation.guest',
        foreignField: 'user',
        as: 'guest',
      },
    },
    {
      $unwind: {
        path: '$guest',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        name: { $first: '$name' },
        type: { $first: '$type' },
        capacity: { $first: '$capacity' },
        organization_by: { $first: '$organization_by' },
        hostel: { $first: '$hostel' },
        beds: {
          $push: {
            bed: '$beds.bed',
            reservation_id: '$beds.reservation_id',
            guestPhoto: { $arrayElemAt: ['$guest.guestPhotos', 0] },
          },
        },
      },
    },
    {
      $sort: { name: 1 },
    },
  ]);

  console.log(rooms);

  return res.status(200).json({
    message: 'Rooms retrieved successfully!',
    success: true,
    data: rooms,
  });
};

export const getBedsAvailable = async (req, res) => {
  const user = req.user;
  const hostel = await Hostel.findOne({ user_id_owners: user._id });

  const { checkin_date, checkout_date } = req.query;

  console.log('checkinDate');

  const checkinDate = new Date(checkin_date);
  const checkoutDate = new Date(checkout_date);
  console.log(checkinDate);

  if (!hostel) {
    return res.status(400).json({
      message: 'Hostel not found!',
      success: false,
    });
  }

  if (!checkin_date || !checkout_date) {
    return res.status(400).json({
      message: 'Checkin and checkout dates are required',
      success: false,
    });
  }

  const reservations = await Reservation.find({
    hostel_id: hostel._id,
    $or: [
      {
        checkin_date: { $lt: checkoutDate },
        checkout_date: { $gt: checkinDate },
      },
    ],
  });

  const rooms = await Room.find({ hostel: hostel._id });

  const occupiedBeds = reservations.map(res => ({
    room: res.room,
    bed: res.bed,
  }));

  const bedsAvailable = rooms.map(room => {
    const availableBeds = room.beds.filter(bed => {
      return !occupiedBeds.some(occ => occ.room === room.name && occ.bed === bed.bed);
    });

    return {
      room: room.name,
      beds: availableBeds.map(b => b.bed),
    };
  });

  return res.status(200).json({
    message: 'Available beds retrieved successfully!',
    success: true,
    data: bedsAvailable,
  });
};
