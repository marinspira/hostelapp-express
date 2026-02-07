import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    recipients: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        read: {
          type: Boolean,
          default: false,
        },
      },
    ],
    type: {
      type: String,
      required: true,
      enum: [
        'reservation_created',
        'reservation_cancelled',
        'guest_checkedout',
        'event_created',
        'message_received',
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for efficient querying
NotificationSchema.index({ 'recipients.userId': 1, createdAt: -1 });
NotificationSchema.index({ 'recipients.read': 1 });

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;
