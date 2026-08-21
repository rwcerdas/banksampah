import Notification from '../models/notification.model.mjs';
import mongoose from 'mongoose';

export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    const objectId = new mongoose.Types.ObjectId(userId);
    const filter = { userId: objectId };
    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
    res.json({
      data: notifications,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const clearNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });
    res.json({ success: true, message: 'Notifikasi dihapus' });
  } catch (err) {
    next(err);
  }
};
