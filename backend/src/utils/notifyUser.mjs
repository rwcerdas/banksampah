import Notification from '../models/notification.model.mjs';

export async function notifyUser({ userId, type, message, meta = {} }) {
  if (!userId) return;
  try {
    await Notification.create({ userId, type, message, meta });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

export default notifyUser;
