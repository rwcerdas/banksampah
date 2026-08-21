import { ref } from 'vue';
import api from '@/utils/api';
import { apiUrl } from '@/utils/apiUrl';

/**
 * Composable for generating AI insights for waste bank reports
 */
export function useWasteBankInsights() {
    const insight = ref('');
    const loading = ref(false);
    const error = ref(null);
    const audience = ref('management'); // 'management' or 'public'

    /**
     * Generate AI insight for a given date range
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise<string>} - Generated insight text
     */
    async function generateInsight(startDate, endDate) {
        loading.value = true;
        error.value = null;
        insight.value = '';

        try {
            const { data } = await api.post(
                apiUrl('reports/insights/ai'),
                {
                    startDate,
                    endDate,
                    audience: audience.value
                },
                {
                    timeout: 60000 // 60 seconds timeout for AI generation
                }
            );

            if (data.success) {
                insight.value = data.data;
                return data.data;
            } else {
                throw new Error(data.message || 'Failed to generate insight');
            }
        } catch (err) {
            console.error('Error generating waste bank insight:', err);
            error.value = err.response?.data?.message || err.message || 'Gagal menggenerate AI insight';
            throw err;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Clear insight data
     */
    function clearInsight() {
        insight.value = '';
        error.value = null;
    }

    return {
        insight,
        loading,
        error,
        audience,
        generateInsight,
        clearInsight
    };
}
