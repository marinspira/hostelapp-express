#!/usr/bin/env node

/**
 * Script de backfill para garantir que Guest.reservations contenha todas as reservas existentes
 *
 * Uso:
 *   node scripts/backfillGuestReservations.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

import connectToMongoDB from '../../db/connectToMongoDB.js';
import Reservation from '../../src/models/reservation.model.js';
import Guest from '../../src/models/guest.model.js';

dotenv.config();

async function main() {
  try {
    console.log('🚀 Starting backfill for Guest.reservations...');
    await connectToMongoDB();
    console.log('✅ Connected to MongoDB');

    const reservations = await Reservation.find({});
    console.log(`🔎 Found ${reservations.length} reservations`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const res of reservations) {
      if (!res.user_id_guest) continue;

      const updateResult = await Guest.updateOne(
        { user: res.user_id_guest },
        { $addToSet: { reservations: res._id } }
      );

      if (updateResult.matchedCount === 0) {
        console.warn(`⚠️  Guest not found for reservation ${res._id}`);
        continue;
      }

      // Note: updateResult.modifiedCount may be 0 if the reservation was already present
      if (updateResult.modifiedCount > 0) {
        addedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`\n✅ Backfill complete.`);
    console.log(`   Added: ${addedCount}`);
    console.log(`   Skipped (already present): ${skippedCount}`);
  } catch (error) {
    console.error('❌ Error during backfill:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
