import type { Document } from 'mongoose';
import { Types } from 'mongoose';

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
  data?: any;
  read?: boolean;
}

export interface INotificationDocument extends INotification, Document {
  _id: Types.ObjectId;
  createdAt: Date;
}
