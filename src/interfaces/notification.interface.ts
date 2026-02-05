import type { Document } from 'mongoose';
import { Types } from 'mongoose';

import { BackendResponse } from './index.interface.ts';

export default interface INotification {
  recipients: Types.ObjectId[];
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

export interface INotificationCreateReservationData {
  reservationId?: string;
  room?: string;
  bed?: string;
  guestId?: string;
  hostelId?: string;
  checkin_date?: Date;
  checkout_date?: Date;
}
