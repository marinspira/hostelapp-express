import cron from 'node-cron';
import mongoose from 'mongoose';
import type { ClientSession } from 'mongoose';

import connectToMongoDB from '../db/connect';
import Reservation from '../models/reservation.model';
import Guest from '../models/guest.model';
import Hostel from '../models/hostel.model';

interface IReservation {
  _id: mongoose.Types.ObjectId;
  user_id_guest: mongoose.Types.ObjectId;
  hostel_id: mongoose.Types.ObjectId;
  room: string;
  bed: string;
}

async function processAutomaticCheckout(
  reservation: IReservation,
  session: ClientSession
): Promise<void> {
  const reservationId = reservation._id;
  const guestUserId = reservation.user_id_guest;
  const hostelId = reservation.hostel_id;

  console.log(`Processing automatic checkout for reservation ${reservationId}`);

  try {
    // 1) Update reservation status to 'checked out'
    await Reservation.updateOne(
      { _id: reservationId },
      {
        $set: {
          status: 'checked out',
          checkout_processed_at: new Date(),
        },
      },
      { session }
    );

    // 2) Remove reservation_id from guest's reservations array
    await Guest.updateOne(
      { user: guestUserId },
      { $pull: { reservations: reservationId } },
      { session }
    );

    // 3) Remove guest from hostel's guest list and chat group
    try {
      // TODO: implement chat group removal when chat feature is ready
      // await removeGuestFromHostelGroup(hostelId, guestUserId);

      await Hostel.updateOne(
        { _id: hostelId },
        { $pull: { user_id_guests: guestUserId } },
        { session }
      );
    } catch (err) {
      console.error('Warning: failed to remove guest from hostel group or guest list', err);
    }

    console.log(`Successfully processed automatic checkout for reservation ${reservationId}`);
  } catch (error) {
    console.error(`Error processing checkout for reservation ${reservationId}:`, error);
    throw error;
  }
}

async function runAutomaticCheckout() {
  console.log('🔄 Starting automatic checkout job...');

  try {
    if (mongoose.connection.readyState !== 1) {
      await connectToMongoDB();
    }

    const today = new Date();
    today.setHours(11, 0, 0, 0); // 11:00:00.000

    const reservationsToCheckout = await Reservation.find({
      checkout_date: { $lte: today },
      status: 'in house',
    }).populate('hostel_id', 'name');

    console.log(
      `📋 Found ${reservationsToCheckout.length} reservation(s) to automatically checkout`
    );

    if (reservationsToCheckout.length === 0) {
      console.log('✅ No reservations to process.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const reservation of reservationsToCheckout) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const reservationData: IReservation = {
            _id: reservation._id,
            user_id_guest: reservation.user_id_guest,
            hostel_id: reservation.hostel_id,
            room: reservation.room,
            bed: reservation.bed,
          };
          await processAutomaticCheckout(reservationData, session);
        });
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to process reservation ${reservation._id}:`, error);
        errorCount++;
      } finally {
        await session.endSession();
      }
    }
    // TODO: send this notification to the hostel
    console.log(`✅ Automatic checkout completed: ${successCount} success, ${errorCount} errors`);
  } catch (error) {
    console.error('💥 Fatal error in automatic checkout job:', error);
  }
}

const cronJob = cron.schedule(
  '0 11 * * *',
  () => {
    console.log('⏰ Automatic checkout cron job triggered at:', new Date().toISOString());
    runAutomaticCheckout().catch(error => {
      console.error('Error in scheduled automatic checkout:', error);
    });
  },
  {
    timezone: 'UTC',
  }
);

export function startAutomaticCheckoutJob() {
  console.log('🚀 Starting automatic checkout cron job (runs daily at 11:00 UTC)');
  cronJob.start();
  return cronJob;
}

export function stopAutomaticCheckoutJob() {
  console.log('🛑 Stopping automatic checkout cron job');
  cronJob.stop();
}

// if manual run, run once and close connection
// In CommonJS, check if this file is being run directly
if (require.main === module) {
  console.log('🔄 Running automatic checkout job manually...');
  runAutomaticCheckout()
    .then(() => {
      console.log('Manual execution completed. Closing connection...');
      return mongoose.connection.close();
    })
    .catch(error => {
      console.error('Error running automatic checkout manually:', error);
      mongoose.connection.close();
      process.exit(1);
    });
}

export { runAutomaticCheckout };
