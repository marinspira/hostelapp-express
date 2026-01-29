import { Response } from 'express';

import { NotificationService } from '../services/notification.service.ts';
import { AuthenticatedRequest } from '../interfaces/index.ts';
// @ts-ignore
import Hostel from '../models/hostel.model.ts';

export class NotificationController {
  constructor(private readonly _service: NotificationService) {}

  getNotifications = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated', success: false });
      }

      // Check if user is a hostel owner
      const hostel = await Hostel.findOne({ user_id_owners: user._id });

      let notifications;
      if (hostel) {
        notifications = await this._service.getNotificationsForHostel(hostel._id.toString());
      } else {
        notifications = await this._service.getNotificationsForUser(user._id.toString());
      }

      return res.json({
        success: true,
        data: notifications,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error fetching notifications',
        error: error.message,
        success: false,
      });
    }
  };

  markAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated', success: false });
      }

      const { id } = req.params;
      const notification = await this._service.markAsRead(id);

      if (!notification) {
        return res.status(404).json({
          message: 'Notification not found',
          success: false,
        });
      }

      return res.json({
        success: true,
        data: notification,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error marking notification as read',
        error: error.message,
        success: false,
      });
    }
  };

  markAllAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated', success: false });
      }

      // Check if user is a hostel owner
      const hostel = await Hostel.findOne({ user_id_owners: user._id });

      if (hostel) {
        await this._service.markAllAsReadForHostel(hostel._id.toString());
      } else {
        await this._service.markAllAsReadForUser(user._id.toString());
      }

      return res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error marking all notifications as read',
        error: error.message,
        success: false,
      });
    }
  };

  getUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated', success: false });
      }

      // Check if user is a hostel owner
      const hostel = await Hostel.findOne({ user_id_owners: user._id });

      let count;
      if (hostel) {
        count = await this._service.getUnreadCount(undefined, hostel._id.toString());
      } else {
        count = await this._service.getUnreadCount(user._id.toString());
      }

      return res.json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error getting unread count',
        error: error.message,
        success: false,
      });
    }
  };

  deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated', success: false });
      }

      const { id } = req.params;
      const notification = await this._service.deleteNotification(id);

      if (!notification) {
        return res.status(404).json({
          message: 'Notification not found',
          success: false,
        });
      }

      return res.json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error deleting notification',
        error: error.message,
        success: false,
      });
    }
  };
}
