import express from 'express';
import {
    getCollectors,
    getCollectorById,
    createCollector,
    updateCollector,
    deleteCollector,
    getCollectorItemPrices,
    setCollectorItemPrices,
    deleteCollectorItemPrice,
} from '../controllers/wasteBankCollector.controller.mjs';
import { requireAuth, wasteBankAdminOnly } from '../middleware/auth.mjs';

const router = express.Router();
const authMiddleware = [requireAuth, wasteBankAdminOnly];

// ============================================
// COLLECTOR CRUD
// ============================================
router.get('/', requireAuth, getCollectors);
router.get('/:id', authMiddleware, getCollectorById);
router.post('/', authMiddleware, createCollector);
router.put('/:id', authMiddleware, updateCollector);
router.delete('/:id', authMiddleware, deleteCollector);

// ============================================
// COLLECTOR PRICE MANAGEMENT PER ITEM
// Endpoint: /api/waste-bank/collectors/:collectorId/prices
// ============================================
router.get('/:collectorId/prices', authMiddleware, getCollectorItemPrices);
router.put('/:collectorId/prices', authMiddleware, setCollectorItemPrices);
router.delete('/:collectorId/prices/:itemId', authMiddleware, deleteCollectorItemPrice);

export default router;
