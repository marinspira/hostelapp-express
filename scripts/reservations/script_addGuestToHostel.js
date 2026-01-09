#!/usr/bin/env node

/**
 * Script para adicionar o guest (identificado por email ou userId) ao hostel específico
 * Hostel alvo: 67f66d5abe12f3f4010e7a08
 *
 * Uso:
 *   node script/script_addLoggedGuestToHostel.js --email=guest@example.com
 *   node script/script_addLoggedGuestToHostel.js --userId=60d0fe4f5311236168a109ca
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

import connectToMongoDB from '../../db/connectToMongoDB.js';
import User from '../../src/models/user.model.ts';
import Guest from '../../src/models/guest.model.ts';
import Hostel from '../../src/models/hostel.model.ts';
import Reservation from '../../src/models/reservation.model.ts';
import Room from '../../src/models/room.model.ts';
import { addGuestToHostelGroup } from '../../services/chat/groupChatManager.js';

dotenv.config();

const TARGET_HOSTEL_ID = '67f66d5abe12f3f4010e7a08';

function parseArguments() {
  const args = process.argv.slice(2);
  const params = {};

  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      params[key] = value;
    }
  });

  return params;
}

async function findUser(params) {
  if (params.email) {
    return await User.findOne({ email: params.email });
  }
  if (params.userId) {
    if (!mongoose.Types.ObjectId.isValid(params.userId)) {
      throw new Error('ID de usuário inválido');
    }
    return await User.findById(params.userId);
  }
  throw new Error('É necessário passar --email ou --userId');
}

async function main() {
  try {
    const params = parseArguments();

    // Conecta ao MongoDB antes de fazer queries
    await connectToMongoDB();

    const user = await findUser(params);

    if (!user) {
      console.error('Usuário não encontrado');
      process.exit(1);
    }

    const guest = await Guest.findOne({ user: user._id });
    if (!guest) {
      console.error('Perfil de guest não encontrado para este usuário');
      process.exit(1);
    }

    // Find an available room and bed in the target hostel
    const room = await Room.findOne({
      hostel: new mongoose.Types.ObjectId(TARGET_HOSTEL_ID),
      'beds.reservation_id': null,
    }).lean();

    if (!room) {
      console.error('Nenhum quarto com cama disponível encontrado no hostel alvo');
      process.exit(1);
    }

    const availableBed = room.beds.find(b => !b.reservation_id);
    if (!availableBed) {
      console.error('Nenhuma cama disponível encontrada no quarto selecionado');
      process.exit(1);
    }

    // Build dates: checkin = yesterday, checkout = today + 2 days
    const now = new Date();
    const checkin = new Date(now);
    checkin.setDate(now.getDate() - 1);
    checkin.setHours(14, 0, 0, 0);

    const checkout = new Date(now);
    checkout.setDate(now.getDate() + 2);
    checkout.setHours(10, 0, 0, 0);

    // Insert reservation directly to avoid triggering any potentially broken post-save middleware
    const reservationDoc = {
      user_id_guest: user._id,
      room_number: room.name,
      bed_number: availableBed.bed_number,
      checkin_date: checkin,
      checkout_date: checkout,
      hostel_id: new mongoose.Types.ObjectId(TARGET_HOSTEL_ID),
      created_at: new Date(),
      status: 'walking in',
    };

    const insertResult = await Reservation.collection.insertOne(reservationDoc);
    const reservationId = insertResult.insertedId;

    // Update the room bed to point to this reservation
    await Room.updateOne(
      { name: room.name, 'beds.bed_number': availableBed.bed_number },
      { $set: { 'beds.$.reservation_id': reservationId } }
    );

    // Add reservation id to guest.reservations
    await Guest.updateOne({ user: user._id }, { $addToSet: { reservations: reservationId } });

    // Ensure guest appears in the hostel guest list
    const updatedHostel = await Hostel.findOneAndUpdate(
      { _id: TARGET_HOSTEL_ID },
      { $addToSet: { user_id_guests: user._id } },
      { new: true }
    );

    if (!updatedHostel) {
      console.error('Hostel alvo não encontrado');
      process.exit(1);
    }

    console.log(
      `✅ Reservation created (${reservationId}) for guest ${user.email} at hostel ${updatedHostel.name}`
    );

    // Add guest to group chat
    await addGuestToHostelGroup(TARGET_HOSTEL_ID, user._id);
    console.log('✅ Guest added to hostel group chat');

    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
