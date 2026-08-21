import express from 'express';
import { requireAuth } from '../middleware/auth.mjs';
import {
  getNotifications,
  markNotificationRead,
  clearNotifications,
} from '../controllers/notification.controller.mjs';

const router = express.Router();
router.use(requireAuth);

router.get('/', getNotifications);
router.put('/:id/read', markNotificationRead);
router.delete('/', clearNotifications);

export default router;
