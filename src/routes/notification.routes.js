import express from 'express';
import { NotificationController } from '../controllers/notification.controllers.ts';
import { NotificationService } from '../services/notification/index.ts';
import { NotificationRepository } from '../repositories/notification.repository.ts';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService(notificationRepository);
const notificationController = new NotificationController(notificationService);

router.get('/', protectRoute, notificationController.getNotifications);
router.get('/unread-count', protectRoute, notificationController.getUnreadCount);
router.put('/:id/read', protectRoute, notificationController.markAsRead);
router.put('/mark-all-read', protectRoute, notificationController.markAllAsRead);
router.delete('/:id', protectRoute, notificationController.deleteNotification);

export default router;
