import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
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
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
NotificationSchema.index({ 'recipient.user': 1, createdAt: -1 });
NotificationSchema.index({ read: 1 });

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;
