import api from '@/utils/api';

/**
 * Waste Bank Report Service
 */

export const getWeighingReport = async (startDate, endDate) => {
    const response = await api.get('/api/reports/weighing-summary', {
        params: { startDate, endDate }
    });
    return response.data;
};

/**
 * Get DLH report — grouped by collector.
 * @param {string} startDate
 * @param {string} endDate
 * @param {string} [collectorId]  ObjectId of collector, or 'all' / omit for all collectors
 */
export const getDLHReport = async (startDate, endDate, collectorId) => {
    const params = { startDate, endDate };
    if (collectorId && collectorId !== 'all') params.collectorId = collectorId;
    const response = await api.get('/api/reports/dlh-summary', { params });
    return response.data;
};

export default {
    getWeighingReport,
    getDLHReport
};

