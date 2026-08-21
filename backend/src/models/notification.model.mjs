import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['system', 'transfer_in', 'transfer_out', 'withdrawal'],
    default: 'system',
  },
  message: { type: String, required: true },
  meta: { type: Object, default: {} },
  read: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Notification', NotificationSchema);
