import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import { ReservationController } from '../controllers/reservation.controllers.ts';
import { ReservationService } from '../services/reservation/index.ts';
import { ReservationRepository } from '../repositories/reservation.repository.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

// Create instances of repository, service, and controller
const reservationRepository = new ReservationRepository();
const hostelRepository = new HostelRepository();
const reservationService = new ReservationService(reservationRepository, hostelRepository);
const reservationController = new ReservationController(reservationService);

router.post('/create', protectRoute, catchAsync(reservationController.create));

export default router;
