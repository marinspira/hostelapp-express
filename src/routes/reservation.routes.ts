import express from 'express';
// @ts-ignore
import catchAsync from '../utils/catchAsync.js';
// @ts-ignore
import protectRoute from '../middleware/protectRoute.js';
import { ReservationController } from '../controllers/reservation.controller.ts';
import { ReservationService } from '../services/reservation.service.ts';
import { ReservationRepository } from '../repositories/reservation.repository.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';

const router = express.Router();

const reservationRepository = new ReservationRepository();
const hostelRepository = new HostelRepository();
const reservationService = new ReservationService(reservationRepository, hostelRepository);
const reservationController = new ReservationController(reservationService);

router.post('/create', protectRoute, catchAsync(reservationController.create));
router.patch('/:id/checkout', protectRoute, catchAsync(reservationController.checkout));

export default router;
