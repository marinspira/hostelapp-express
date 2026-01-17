import { Response } from 'express';

import { ReservationService } from '../services/reservation/index.ts';
import { AuthenticatedRequest } from '../interfaces/index.ts';

export class ReservationController {
  constructor(private readonly _service: ReservationService) {}

  create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      // TODO:
      // - fazer um job que remova o guest do grupo quando o checkout_date passar
      const data = req.body;
      const reservation = await this._service.create(data.reservation, user._id.toString());
      return res.status(201).json(reservation);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  };

  findAll = async (_req: AuthenticatedRequest, res: Response) => {
    const reservations = await this._service.getReservations();
    return res.json(reservations);
  };

  findById = async (req: AuthenticatedRequest, res: Response) => {
    const reservation = await this._service.getReservationById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    return res.json(reservation);
  };

  update = async (req: AuthenticatedRequest, res: Response) => {
    const updated = await this._service.updateReservation(req.params.id, req.body);

    if (!updated) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    return res.json(updated);
  };

  delete = async (req: AuthenticatedRequest, res: Response) => {
    const deleted = await this._service.deleteReservation(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    return res.status(204).send();
  };
}
