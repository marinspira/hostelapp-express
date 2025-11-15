#!/usr/bin/env node

/**
 * Script to automatically checkout reservations whose checkout_date <= now
 *
 * Actions performed per reservation (inside a transaction):
 *  - set reservation.status = 'checked out'
 *  - clear the reservation_id from the Room bed
 *  - remove the reservation._id from Guest.reservations
 *  - remove guest from hostel group chat (optional behavior)
 *
 * Usage:
 *   node scripts/script_autoCheckoutReservations.js
 *
 * You can run this script periodically (e.g. every 5 minutes) via cron or a process manager.
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

import connectToMongoDB from '../../db/connectToMongoDB.js';
import Reservation from '../../models/reservation.model.js';
import Room from '../../models/room.model.js';
import Guest from '../../models/guest.model.js';
import Hostel from '../../models/hostel.model.js';
import { removeGuestFromHostelGroup } from '../../services/chat/groupChatManager.js';

dotenv.config();

async function processCheckout(reservation, session) {
  // reservation is a mongoose doc
  const reservationId = reservation._id;
  const guestUserId = reservation.user_id_guest;
  const hostelId = reservation.hostel_id;

  // 1) set reservation status to 'checked out'
  await Reservation.updateOne(
    { _id: reservationId },
    { $set: { status: 'checked out' } },
    { session }
  );

  // 2) clear room bed reservation_id
  // We assume room documents have structure with name and beds array with bed_number and reservation_id
  await Room.updateOne(
    {
      name: reservation.room_number,
      'beds.bed_number': reservation.bed_number,
    },
    { $set: { 'beds.$.reservation_id': null } },
    { session }
  );

  // 3) remove reservation id from Guest.reservations
  await Guest.updateOne(
    { user: guestUserId },
    { $pull: { reservations: reservationId } },
    { session }
  );

  // 4) optionally remove guest from hostel group chat and from hostel.user_id_guests
  try {
    // remove guest from group's participants
    await removeGuestFromHostelGroup(hostelId, guestUserId);

    // remove from hostel.user_id_guests list
    await Hostel.updateOne(
      { _id: hostelId },
      { $pull: { user_id_guests: guestUserId } },
      { session }
    );
  } catch (err) {
    // don't fail the whole transaction for group removal errors; just log
    console.error('Warning: failed to remove guest from hostel group or guest list', err);
  }
}

async function main() {
  console.log('Starting auto-checkout script...');

  await connectToMongoDB();

  const now = new Date();

  // Find reservations that should be checked out by now and are not yet checked out
  const reservationsToCheckout = await Reservation.find({
    checkout_date: { $lte: now },
    status: { $ne: 'checked out' },
  });

  console.log(`Found ${reservationsToCheckout.length} reservation(s) to checkout`);

  if (reservationsToCheckout.length === 0) {
    await mongoose.connection.close();
    console.log('No reservations to process. Exiting.');
    return;
  }

  for (const reservation of reservationsToCheckout) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await processCheckout(reservation, session);
      });
      console.log(`Processed checkout for reservation ${reservation._id}`);
    } catch (err) {
      console.error(`Failed to process reservation ${reservation._id}:`, err);
    } finally {
      session.endSession();
    }
  }

  await mongoose.connection.close();
  console.log('Auto-checkout script finished.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Error in auto-checkout script:', err);
    process.exit(1);
  });
}
