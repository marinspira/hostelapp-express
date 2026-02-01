import express from 'express';
import { NotificationController } from '../controllers/notification.controller.ts';
import { NotificationService } from '../services/notification.service.ts';
import { NotificationRepository } from '../repositories/notification.repository.ts';
// @ts-ignore
import protectRoute from '../middleware/protectRoute.js';
// @ts-ignore
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService(notificationRepository);
const notificationController = new NotificationController(notificationService);

router.get('/', protectRoute, catchAsync(notificationController.getNotifications));
router.get('/unread-count', protectRoute, catchAsync(notificationController.getUnreadCount));
router.put('/:id/read', protectRoute, catchAsync(notificationController.markAsRead));
router.put('/mark-all-read', protectRoute, catchAsync(notificationController.markAllAsRead));
router.delete('/:id', protectRoute, catchAsync(notificationController.deleteNotification));

export default router;
