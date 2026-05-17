import express from 'express';

import { RoleScheduleController } from '../controllers/role-schedule.controller';
import protectRoute from '../middleware/protectRoute';

const router = express.Router();
const controller = new RoleScheduleController();

router.post('/hostels/:hostelId/roles', protectRoute, async (req, res, next) => {
  try {
    const result = await controller.create(req as any);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/hostels/:hostelId/roles', protectRoute, async (req, res, next) => {
  try {
    const result = await controller.list(req as any);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/roles/:roleId', protectRoute, async (req, res, next) => {
  try {
    const result = await controller.update(req as any);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.delete('/roles/:roleId', protectRoute, async (req, res, next) => {
  try {
    const result = await controller.remove(req as any);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/hostels/:hostelId/tasks/cleaning/checkouts', protectRoute, async (req, res, next) => {
  try {
    const result = await controller.createCleaningFromCheckouts(req as any);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
