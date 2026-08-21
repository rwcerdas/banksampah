import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const routeFile = path.resolve(currentDir, '../../routes/bank.routes.mjs');
const routeSource = fs.readFileSync(routeFile, 'utf8');

const expectedRoutes = [
    ['get', '/settings'],
    ['put', '/settings'],
    ['post', '/closing'],
    ['post', '/customers/register'],
    ['get', '/customers/search'],
    ['get', '/customers/me'],
    ['get', '/customers/me/transactions'],
    ['put', '/customers/:id/password'],
    ['put', '/customers/me/change-password'],
    ['post', '/customers/:id/link-account'],
    ['get', '/customers'],
    ['get', '/customers/:id'],
    ['get', '/customers/:id/transactions'],
    ['get', '/customers/:id/transaction-insights'],
    ['post', '/customers'],
    ['put', '/customers/:id'],
    ['delete', '/customers/:id'],
    ['get', '/categories'],
    ['post', '/categories'],
    ['put', '/categories/:id'],
    ['delete', '/categories/:id'],
    ['get', '/items'],
    ['post', '/items'],
    ['put', '/items/:id'],
    ['delete', '/items/:id'],
    ['post', '/items/bulk-import'],
    ['post', '/transactions'],
    ['get', '/transactions'],
    ['get', '/transactions/:id'],
    ['put', '/transactions/:id/void'],
    ['put', '/transactions/:id/cancel'],
    ['get', '/withdrawals'],
    ['post', '/withdrawals'],
    ['put', '/withdrawals/:id/status'],
    ['get', '/dashboard/stats'],
    ['get', '/dashboard/weight-trend'],
    ['get', '/dashboard/value-trend'],
    ['get', '/dashboard/category-breakdown'],
    ['get', '/dashboard/rt-breakdown'],
    ['get', '/dashboard/active-customers-trend'],
    ['get', '/dashboard/top-customers'],
    ['get', '/reports/monthly'],
    ['post', '/transfer'],
    ['get', '/transfers/me'],
    ['get', '/transfers'],
    ['get', '/education'],
    ['get', '/education/:id'],
    ['post', '/education'],
    ['put', '/education/:id'],
    ['delete', '/education/:id'],
    ['get', '/cash/summary'],
    ['get', '/cash/transactions'],
    ['post', '/cash/transactions'],
];

const expectedExports = [
    'registerNasabah',
    'changeNasabahPassword',
    'selfChangePassword',
    'linkNasabahToUser',
    'getCustomerProfile',
    'getMyTransactions',
    'getCustomers',
    'getCustomerById',
    'createCustomer',
    'updateCustomer',
    'deleteCustomer',
    'getCategories',
    'createCategory',
    'updateCategory',
    'deleteCategory',
    'getItems',
    'createItem',
    'updateItem',
    'deleteItem',
    'bulkImportItems',
    'createTransaction',
    'voidTransaction',
    'getTransactions',
    'getTransactionById',
    'cancelTransaction',
    'updateWithdrawalStatus',
    'createWithdrawal',
    'getWithdrawals',
    'closingBook',
    'getDashboardStats',
    'getWeightTrend',
    'getValueTrend',
    'getCategoryBreakdown',
    'getRTBreakdown',
    'getActiveCustomersTrend',
    'getTopCustomers',
    'getMonthlyReport',
    'getSettings',
    'getCustomerTransactionHistory',
    'getCustomerTransactionInsights',
    'lookupRecipient',
    'transferBalance',
    'getMyTransferHistory',
    'getAllTransfers',
    'updateSettings',
    'getEducationArticles',
    'getEducationArticleById',
    'createEducationArticle',
    'updateEducationArticle',
    'deleteEducationArticle',
];

describe('Waste Bank route contract', () => {
    it.each(expectedRoutes)('%s %s remains registered', (method, route) => {
        const routePattern = new RegExp(
            `router\\.${method}\\(\\s*['"]${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`
        );
        expect(routeSource).toMatch(routePattern);
    });

    it('keeps sensitive mutations behind the waste-bank admin middleware', () => {
        expect(routeSource).toContain("router.post('/transactions', authMiddleware, createTransaction)");
        expect(routeSource).toContain("router.put('/transactions/:id/void', authMiddleware, voidTransaction)");
        expect(routeSource).toContain("router.put('/withdrawals/:id/status', authMiddleware, updateWithdrawalStatus)");
        expect(routeSource).toContain("router.put('/settings', authMiddleware, updateSettings)");
    });
});

describe('Waste Bank controller export contract', () => {
    it('keeps every controller export used by the router', async () => {
        const controller = await import('../wasteBank.controller.mjs');

        for (const exportName of expectedExports) {
            expect(controller[exportName], `${exportName} must remain exported`).toBeTypeOf('function');
        }
    });
});
