import api from '@/utils/api';
import { apiUrl } from '@/utils/apiUrl';

// ============================================
// CUSTOMER API
// ============================================

export const getCustomers = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`customers?${queryString}`));
    return response.data;
};

export const getCustomerById = async (id) => {
    const response = await api.get(apiUrl(`customers/${id}`));
    return response.data;
};

export const getMyProfile = async () => {
    const response = await api.get(apiUrl('customers/me'));
    return response.data;
};

export const getMyTransactions = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`customers/me/transactions?${queryString}`));
    return response.data;
};

export const createCustomer = async (customerData) => {
    const response = await api.post(apiUrl('customers'), customerData);
    return response.data;
};

export const registerNasabah = async (payload) => {
    const response = await api.post(apiUrl('customers/register'), payload);
    return response.data;
};

export const updateCustomer = async (id, customerData) => {
    const response = await api.put(apiUrl(`customers/${id}`), customerData);
    return response.data;
};

export const changePassword = async (id, newPassword) => {
    const response = await api.put(apiUrl(`customers/${id}/password`), { newPassword });
    return response.data;
};

export const linkAccount = async (id, data) => {
    const response = await api.post(apiUrl(`customers/${id}/link-account`), data);
    return response.data;
};

export const deleteCustomer = async (id) => {
    const response = await api.delete(apiUrl(`customers/${id}`));
    return response.data;
};

export const getCustomerTransactions = async (customerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`customers/${customerId}/transactions?${queryString}`));
    return response.data;
};

export const getCustomerInsights = async (customerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`customers/${customerId}/transaction-insights?${queryString}`));
    return response.data;
};

export const searchNik = async () => ({ success: true, data: [] });

// ============================================
// CATEGORY API
// ============================================

export const getCategories = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`categories?${queryString}`));
    return response.data;
};

export const createCategory = async (categoryData) => {
    const response = await api.post(apiUrl('categories'), categoryData);
    return response.data;
};

export const updateCategory = async (id, categoryData) => {
    const response = await api.put(apiUrl(`categories/${id}`), categoryData);
    return response.data;
};

export const deleteCategory = async (id) => {
    const response = await api.delete(apiUrl(`categories/${id}`));
    return response.data;
};

// ============================================
// ITEM API
// ============================================

export const getItems = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`items?${queryString}`));
    return response.data;
};

export const createItem = async (itemData) => {
    const response = await api.post(apiUrl('items'), itemData);
    return response.data;
};

export const updateItem = async (id, itemData) => {
    const response = await api.put(apiUrl(`items/${id}`), itemData);
    return response.data;
};

export const deleteItem = async (id) => {
    const response = await api.delete(apiUrl(`items/${id}`));
    return response.data;
};

export const bulkImportItems = async (payload) => {
    const response = await api.post(apiUrl('items/bulk-import'), payload);
    return response.data;
};

// ============================================
// TRANSACTION API
// ============================================

export const getTransactions = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`transactions?${queryString}`));
    return response.data;
};

export const getTransactionById = async (id) => {
    const response = await api.get(apiUrl(`transactions/${id}`));
    return response.data;
};

export const createTransaction = async (transactionData) => {
    const response = await api.post(apiUrl('transactions'), transactionData, {
        headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
};

export const cancelTransaction = async (id, reason) => {
    const response = await api.put(apiUrl(`transactions/${id}/cancel`), {
        cancelReason: reason
    });
    return response.data;
};

export const voidTransaction = async (id, reason) => {
    const response = await api.put(apiUrl(`transactions/${id}/void`), {
        reason: reason
    });
    return response.data;
};

export const selfChangePassword = async (newPassword, confirmPassword) => {
    const response = await api.put(apiUrl('customers/me/change-password'), {
        newPassword,
        confirmPassword
    });
    return response.data;
};

// ============================================
// WITHDRAWAL API
// ============================================

export const getWithdrawals = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`withdrawals?${queryString}`));
    return response.data;
};

export const createWithdrawal = async (withdrawalData) => {
    const response = await api.post(apiUrl('withdrawals'), withdrawalData);
    return response.data;
};

export const updateWithdrawalStatus = async (id, data) => {
    const response = await api.put(apiUrl(`withdrawals/${id}/status`), data);
    return response.data;
};

export const uploadWithdrawalProof = async (formData) => {
    const response = await api.post(apiUrl('withdrawals/upload-proof'), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

// ============================================
// DASHBOARD API
// ============================================

export const getDashboardStats = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`dashboard/stats?${queryString}`));
    return response.data;
};

export const getWeightTrend = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`dashboard/weight-trend?${queryString}`));
    return response.data;
};

export const getValueTrend = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`dashboard/value-trend?${queryString}`));
    return response.data;
};

export const getCategoryBreakdown = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`dashboard/category-breakdown?${queryString}`));
    return response.data;
};

export const getActiveCustomersTrend = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`dashboard/active-customers-trend?${queryString}`));
    return response.data;
};

export const getTopCustomers = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`dashboard/top-customers?${queryString}`));
    return response.data;
};

export const getRTBreakdown = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`dashboard/rt-breakdown?${queryString}`));
    return response.data;
};

// ============================================
// REPORTS API
// ============================================

export const getMonthlyReport = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`reports/monthly?${queryString}`));
    return response.data;
};

export const downloadMonthlyReportExcel = async (month, year) => {
    const params = new URLSearchParams({ month, year, format: 'excel' }).toString();
    const response = await api.get(apiUrl(`reports/export?${params}`), {
        responseType: 'blob'
    });
    return response.data;
};

export const downloadMonthlyReportPdf = async (month, year) => {
    const params = new URLSearchParams({ month, year, format: 'pdf' }).toString();
    const response = await api.get(apiUrl(`reports/export?${params}`), {
        responseType: 'blob'
    });
    return response.data;
};

// ============================================
// SETTINGS API
// ============================================

export const getSettings = async () => {
    const response = await api.get(apiUrl('settings'));
    return response.data;
};

export const updateSettings = async (data) => {
    const response = await api.put(apiUrl('settings'), data);
    return response.data;
};

export const closingBook = async (year) => {
    const response = await api.post(apiUrl('closing'), { year });
    return response.data;
};

// ============================================
// TRANSFER API
// ============================================

export const transferBalance = async (data) => {
    const response = await api.post(apiUrl('transfer'), data);
    return response.data;
};

export const getMyTransferHistory = async () => {
    const response = await api.get(apiUrl('transfers/me'));
    return response.data;
    return response.data;
};

export const getAllTransfers = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    // Use the admin endpoint '/admin/transfers'
    const response = await api.get(apiUrl(`transfers?${queryString}`));
    return response.data;
};

// ============================================
// CASH MANAGEMENT API
// ============================================

export const getCashSummary = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`cash/summary?${queryString}`));
    return response.data;
};

// ============================================
// EDUCATION API
// ============================================

export const getEducationArticles = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`education?${queryString}`));
    return response.data;
};

export const getEducationArticleById = async (id) => {
    const response = await api.get(apiUrl(`education/${id}`));
    return response.data;
};

export const createEducationArticle = async (data) => {
    const response = await api.post(apiUrl('education'), data);
    return response.data;
};

export const updateEducationArticle = async (id, data) => {
    const response = await api.put(apiUrl(`education/${id}`), data);
    return response.data;
};

export const deleteEducationArticle = async (id) => {
    const response = await api.delete(apiUrl(`education/${id}`));
    return response.data;
};

export const uploadEducationImage = async (formData) => {
    const response = await api.post(apiUrl('education/upload-image'), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

// ============================================
// COLLECTOR API (Master Data Pengepul)
// ============================================

export const getCollectors = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(apiUrl(`collectors?${queryString}`));
    return response.data;
};

export const getCollectorById = async (id) => {
    const response = await api.get(apiUrl(`collectors/${id}`));
    return response.data;
};

export const createCollector = async (data) => {
    const response = await api.post(apiUrl('collectors'), data);
    return response.data;
};

export const updateCollector = async (id, data) => {
    const response = await api.put(apiUrl(`collectors/${id}`), data);
    return response.data;
};

export const deleteCollector = async (id) => {
    const response = await api.delete(apiUrl(`collectors/${id}`));
    return response.data;
};

// ============================================
// COLLECTOR ITEM PRICES API
// ============================================

export const getCollectorItemPrices = async (collectorId) => {
    const response = await api.get(apiUrl(`collectors/${collectorId}/prices`));
    return response.data;
};

/**
 * Batch update harga item untuk satu pengepul
 * @param {string} collectorId
 * @param {Array<{itemId: string, price: number|null}>} prices
 */
export const setCollectorItemPrices = async (collectorId, prices) => {
    const response = await api.put(apiUrl(`collectors/${collectorId}/prices`), { prices });
    return response.data;
};

export const deleteCollectorItemPrice = async (collectorId, itemId) => {
    const response = await api.delete(apiUrl(`collectors/${collectorId}/prices/${itemId}`));
    return response.data;
};

export default {
    // Customers
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerTransactions,
    getCustomerInsights,
    searchNik,

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
    getTransactions,
    getTransactionById,
    createTransaction,
    voidTransaction,
    cancelTransaction,

    // Withdrawals
    getWithdrawals,
    createWithdrawal,
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
    downloadMonthlyReportExcel,
    downloadMonthlyReportPdf,

    // Settings
    getSettings,
    updateSettings,

    uploadSettingsImage: async (formData) => {
        const response = await api.post(apiUrl('settings/upload-image'), formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Transfers
    transferBalance,
    getMyTransferHistory,
    getAllTransfers,

    // Cash Management
    getCashSummary,

    // Education
    getEducationArticles,
    getEducationArticleById,
    createEducationArticle,
    updateEducationArticle,
    deleteEducationArticle,
    uploadEducationImage,

    // Collectors
    getCollectors,
    getCollectorById,
    createCollector,
    updateCollector,
    deleteCollector,

    // Collector Prices
    getCollectorItemPrices,
    setCollectorItemPrices,
    deleteCollectorItemPrice,
};

