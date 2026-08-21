import express from 'express';
import { getWeighingReport, generateWasteBankInsight, getDLHReport } from '../controllers/wasteBankReport.controller.mjs';
import { requireAuth, wasteBankAdminOnly } from '../middleware/auth.mjs';

const router = express.Router();

const authMiddleware = [requireAuth, wasteBankAdminOnly];

// GET /api/wastebank/reports/weighing-summary?startDate=2026-01-01&endDate=2026-01-31
router.get('/weighing-summary', authMiddleware, getWeighingReport);

// POST /api/wastebank/reports/insights/ai
router.post('/insights/ai', authMiddleware, generateWasteBankInsight);

// GET /api/waste-bank/reports/dlh-summary?startDate=2026-01-01&endDate=2026-01-31
router.get('/dlh-summary', authMiddleware, getDLHReport);

export default router;
