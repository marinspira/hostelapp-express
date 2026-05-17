import express from 'express';

import { TaskController } from '../controllers/task.controller';
import protectRoute from '../middleware/protectRoute';
import { upload } from '../middleware/saveUploads';

const router = express.Router();
const taskController = new TaskController();

router.post('/hostels/:hostelId/tasks', protectRoute, async (req, res, next) => {
  try {
    const result = await taskController.create(req as any);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/hostels/:hostelId/tasks', protectRoute, async (req, res, next) => {
  try {
    const result = await taskController.listByHostel(req as any);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/hostels/:hostelId/tasks/me', protectRoute, async (req, res, next) => {
  try {
    const result = await taskController.listMine(req as any);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/tasks/:taskId', protectRoute, async (req, res, next) => {
  try {
    const result = await taskController.getById(req as any);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/tasks/:taskId', protectRoute, async (req, res, next) => {
  try {
    const result = await taskController.update(req as any);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/tasks/:taskId/status', protectRoute, async (req, res, next) => {
  try {
    const result = await taskController.updateStatus(req as any);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/tasks/:taskId/start', protectRoute, async (req, res, next) => {
  try {
    const result = await taskController.start(req as any);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/tasks/:taskId/complete', protectRoute, async (req, res, next) => {
  try {
    const result = await taskController.complete(req as any);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/tasks/:taskId/proof-photos', protectRoute, upload.array('photos', 6), async (req, res, next) => {
  try {
    const result = await taskController.addProofPhotos(req as any);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/tasks/:taskId/approve', protectRoute, async (req, res, next) => {
  try {
    const result = await taskController.approve(req as any);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/tasks/:taskId/reject', protectRoute, async (req, res, next) => {
  try {
    const result = await taskController.reject(req as any);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.delete('/tasks/:taskId', protectRoute, async (req, res, next) => {
  try {
    const result = await taskController.cancel(req as any);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
