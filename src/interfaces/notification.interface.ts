import type { Document } from 'mongoose';
import { Types } from 'mongoose';

import { BackendResponse } from './index.interface.ts';

export default interface INotification {
  recipient: {
    user?: Types.ObjectId | null;
    hostel?: Types.ObjectId | null;
  };
  type:
    | 'reservation_created'
    | 'reservation_cancelled'
    | 'guest_checkedout'
    | 'event_created'
    | 'message_received';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read?: boolean;
}

export interface INotificationDocument extends INotification, Document {
  _id: Types.ObjectId;
  createdAt: Date;
}

export interface ICreateNotificationResponse extends BackendResponse<INotificationDocument> {}

export interface INotificationListItemResponse extends BackendResponse<INotificationDocument[]> {}

export interface INotificationByIdResponse extends BackendResponse<INotificationDocument> {}

export interface IUnreadCountResponse extends BackendResponse<{ unreadCount: number }> {}

export interface INotificationData {
  [key: string]: unknown;
  reservationId?: string;
  roomNumber?: string;
  bedNumber?: string;
  guestId?: string;
  guestName?: string;
  hostelId?: string;
  hostelName?: string;
  checkinDate?: Date;
  checkoutDate?: Date;
}
