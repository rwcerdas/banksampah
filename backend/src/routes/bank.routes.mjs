import express from 'express';
import {
    // Customers
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    // Categories
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,

    // Items
    getItems,
    createItem,
    updateItem,
    deleteItem,
    bulkImportItems,

    // Transactions
    createTransaction,
    voidTransaction,
    getTransactions,
    getTransactionById,
    cancelTransaction,
    registerNasabah,
    changeNasabahPassword,
    selfChangePassword,
    linkNasabahToUser, // Added import
    getCustomerProfile, // Added import
    getMyTransactions, // Added import

    // Withdrawals
    createWithdrawal,
    getWithdrawals,
    updateWithdrawalStatus,

    // Dashboard
    getDashboardStats,
    getWeightTrend,
    getValueTrend,
    getCategoryBreakdown,
    getRTBreakdown,
    getActiveCustomersTrend,
    getTopCustomers,

    // Reports
    getMonthlyReport,

    // Settings
    getSettings,
    updateSettings,
    closingBook, // Added closingBook

    // Customer Transaction History & Insights
    getCustomerTransactionHistory,
    getCustomerTransactionInsights,

    // Transfers
    transferBalance,
    getMyTransferHistory,
    getAllTransfers,
    lookupRecipient, // New: recipient lookup for secure transfers

    // Education
    getEducationArticles,
    getEducationArticleById,
    createEducationArticle,
    updateEducationArticle,
    deleteEducationArticle
} from '../controllers/wasteBank.controller.mjs';
import { requireAuth, wasteBankAdminOnly } from '../middleware/auth.mjs';

const router = express.Router();

// All routes require superadmin or admin-banksampah role
const authMiddleware = [requireAuth, wasteBankAdminOnly];

// ... (existing routes)

// ============================================
// SETTINGS ROUTES
// ============================================
router.get('/settings', requireAuth, getSettings);
router.put('/settings', authMiddleware, updateSettings);
router.post('/closing', authMiddleware, closingBook); // New Closing Route

// ============================================
// CUSTOMER ROUTES
// ============================================
router.post('/customers/register', authMiddleware, registerNasabah);
router.get('/customers/search', requireAuth, lookupRecipient); // Moved here to avoid conflict with :id
router.get('/customers/me', requireAuth, getCustomerProfile); // Allow all users to check their own profile
router.get('/customers/me/transactions', requireAuth, getMyTransactions); // New transaction history route
router.put('/customers/:id/password', authMiddleware, changeNasabahPassword);
router.put('/customers/me/change-password', requireAuth, selfChangePassword); // Self-service: nasabah ganti password sendiri
router.post('/customers/:id/link-account', authMiddleware, linkNasabahToUser); // New link account route
router.get('/customers', authMiddleware, getCustomers);
router.get('/customers/:id', authMiddleware, getCustomerById);
router.get('/customers/:id/transactions', authMiddleware, getCustomerTransactionHistory);
router.get('/customers/:id/transaction-insights', authMiddleware, getCustomerTransactionInsights);
router.post('/customers', authMiddleware, createCustomer);
router.put('/customers/:id', authMiddleware, updateCustomer);
router.delete('/customers/:id', authMiddleware, deleteCustomer);

// ============================================
// CATEGORY ROUTES
// ============================================
router.get('/categories', authMiddleware, getCategories);
router.post('/categories', authMiddleware, createCategory);
router.put('/categories/:id', authMiddleware, updateCategory);
router.delete('/categories/:id', authMiddleware, deleteCategory);

// ============================================
// ITEM ROUTES
// ============================================
router.get('/items', requireAuth, getItems);
router.post('/items', authMiddleware, createItem);
router.put('/items/:id', authMiddleware, updateItem);
router.delete('/items/:id', authMiddleware, deleteItem);
router.post('/items/bulk-import', authMiddleware, bulkImportItems);

// ============================================
// TRANSACTION ROUTES
// ============================================
router.post('/transactions', authMiddleware, createTransaction);
router.get('/transactions', authMiddleware, getTransactions);
router.get('/transactions/:id', authMiddleware, getTransactionById);
router.put('/transactions/:id/void', authMiddleware, voidTransaction);
router.put('/transactions/:id/cancel', authMiddleware, cancelTransaction);

// ============================================
// WITHDRAWAL ROUTES
// ============================================
router.get('/withdrawals', requireAuth, getWithdrawals);
router.post('/withdrawals', requireAuth, createWithdrawal);
router.put('/withdrawals/:id/status', authMiddleware, updateWithdrawalStatus);

import { uploadWithdrawalProof } from '../middleware/uploadWithdrawalProof.mjs';
router.post('/withdrawals/upload-proof', authMiddleware, uploadWithdrawalProof.single('proof'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    // Return relative path so frontend can construct full URL
    // Assumes static serving is setup for /uploads
    const relativePath = `/uploads/proofs/${req.file.filename}`;
    res.json({ success: true, url: relativePath });
});

// ============================================
// DASHBOARD ROUTES
// ============================================
router.get('/dashboard/stats', authMiddleware, getDashboardStats);
router.get('/dashboard/weight-trend', authMiddleware, getWeightTrend);
router.get('/dashboard/value-trend', authMiddleware, getValueTrend);
router.get('/dashboard/category-breakdown', authMiddleware, getCategoryBreakdown);
router.get('/dashboard/rt-breakdown', authMiddleware, getRTBreakdown);
router.get('/dashboard/active-customers-trend', authMiddleware, getActiveCustomersTrend);
router.get('/dashboard/top-customers', authMiddleware, getTopCustomers);

// ============================================
// REPORT ROUTES
// ============================================
router.get('/reports/monthly', authMiddleware, getMonthlyReport);

// ============================================
// SETTINGS ROUTES
// ============================================
router.get('/settings', requireAuth, getSettings);
router.put('/settings', authMiddleware, updateSettings);

import { uploadSettingsImage } from '../middleware/uploadSettingsImage.mjs';
router.post('/settings/upload-image', authMiddleware, uploadSettingsImage.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    const relativePath = `/uploads/settings/${req.file.filename}`;
    res.json({ success: true, url: relativePath });
});

// ============================================
// TRANSFER ROUTES
// ============================================
router.get('/customers/lookup/:accountNumber', requireAuth, lookupRecipient); // Legacy support
router.post('/transfer', requireAuth, transferBalance);
router.get('/transfers/me', requireAuth, getMyTransferHistory);
router.get('/transfers', authMiddleware, getAllTransfers); // Admin only

// ============================================
// EDUCATION ROUTES
// ============================================
import { uploadEducationImage } from '../middleware/uploadEducationImage.mjs';

router.post('/education/upload-image', authMiddleware, uploadEducationImage.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    const relativePath = `/uploads/education/${req.file.filename}`;
    res.json({ success: true, url: relativePath });
});

router.get('/education', requireAuth, getEducationArticles);
router.get('/education/:id', requireAuth, getEducationArticleById);
router.post('/education', authMiddleware, createEducationArticle);
router.put('/education/:id', authMiddleware, updateEducationArticle);
router.delete('/education/:id', authMiddleware, deleteEducationArticle);

// ============================================
// CASH MANAGEMENT ROUTES (KAS PENGURUS)
// ============================================
import {
    getCashSummary,
    getTransactions as getCashTransactions,
    createTransaction as createCashTransaction
} from '../controllers/wasteBankCash.controller.mjs';

import { uploadCashProof } from '../middleware/uploadCashProof.mjs';

router.get('/cash/summary', authMiddleware, getCashSummary);
router.get('/cash/transactions', authMiddleware, getCashTransactions);
router.post('/cash/transactions', authMiddleware, uploadCashProof.single('proof'), createCashTransaction);

export default router;
