import { ref, computed, watch } from 'vue';
import * as bankService from '@/services/bankService';

export function useTransactions(customerId) {
    const transactions = ref([]);
    const loadingTransactions = ref(false);

    // Date Filtering
    const currentDate = new Date();
    const selectedMonth = ref(currentDate.getMonth() + 1);
    const selectedYear = ref(currentDate.getFullYear());

    // Helper to determine type
    const getInferredType = (t) => {
        if (t.type) {
            const type = t.type.toUpperCase();
            if (['INCOME', 'IN', 'DEPOSIT', 'TOPUP'].includes(type)) return 'INCOME';
            if (['WITHDRAW', 'OUT', 'EXPENSE'].includes(type)) return 'OUT';
        }
        // Fallback logic
        if (t.items && t.items.length > 0) return 'INCOME'; // Waste deposit
        return 'INCOME'; // Default safe assumption
    };

    const fetchTransactions = async () => {
        loadingTransactions.value = true;
        try {
            const res = await bankService.getMyTransactions({
                month: selectedMonth.value,
                year: selectedYear.value,
                limit: 100
            });
            transactions.value = res || [];
        } catch (e) {
            console.error('Failed to load transactions:', e);
            transactions.value = [];
        } finally {
            loadingTransactions.value = false;
        }
    };

    // Watchers for refetching
    watch([selectedMonth, selectedYear], () => {
        fetchTransactions();
    });

    // --- Computed Properties ---

    const homeStats = computed(() => {
        const incomeTrx = transactions.value.filter(t => getInferredType(t) === 'INCOME');
        const totalWeight = incomeTrx.reduce((sum, t) => sum + Number(t.totalWeight || 0), 0);
        const count = incomeTrx.length;
        return { totalWeight, count };
    });

    const weeklyChartData = computed(() => {
        const weeks = [0, 0, 0, 0];
        transactions.value.forEach(t => {
            if (getInferredType(t) === 'INCOME') {
                const val = Number(t.totalValue || t.amount || 0);
                const day = new Date(t.transactionDate).getDate();
                const weekIdx = Math.min(Math.floor((day - 1) / 7), 3);

                if (!isNaN(val)) {
                    weeks[weekIdx] += val;
                }
            }
        });

        const maxVal = Math.max(...weeks) || 1;

        return weeks.map(val => ({
            amount: val,
            percentage: maxVal > 0 ? (val / maxVal) * 100 : 0
        }));
    });

    const categoryStats = computed(() => {
        const stats = {};
        let totalWeight = 0;

        transactions.value.forEach(trx => {
            if (!trx.items || !Array.isArray(trx.items)) return;

            trx.items.forEach(item => {
                const catName = item.itemId?.categoryId?.categoryName || item.category?.categoryName || 'Lainnya';
                const weight = Number(item.weight || 0);
                const val = Number(item.subtotal || 0);

                if (!stats[catName]) {
                    stats[catName] = { name: catName, weight: 0, value: 0, color: '' };
                }
                stats[catName].weight += weight;
                stats[catName].value += val;

                // Color mapping (simplified)
                if (catName.toLowerCase().includes('plastik')) stats[catName].color = '#3B82F6'; // Blue
                else if (catName.toLowerCase().includes('kertas') || catName.toLowerCase().includes('kardus')) stats[catName].color = '#EAB308'; // Yellow
                else if (catName.toLowerCase().includes('logam') || catName.toLowerCase().includes('besi')) stats[catName].color = '#64748B'; // Slate
                else if (catName.toLowerCase().includes('kaca') || catName.toLowerCase().includes('botol')) stats[catName].color = '#10B981'; // Green
                else stats[catName].color = '#F97316'; // Orange

                totalWeight += weight;
            });
        });

        // Convert to array and sort
        return Object.values(stats)
            .sort((a, b) => b.weight - a.weight)
            .map(s => ({
                ...s,
                percentage: totalWeight > 0 ? Math.round((s.weight / totalWeight) * 100) : 0
            }));
    });

    const donutChartData = computed(() => {
        let cumulativePercent = 0;

        return categoryStats.value.map(stat => {
            const startPercent = cumulativePercent;
            cumulativePercent += stat.percentage;
            const endPercent = cumulativePercent;

            // Calculate SVG path for arc
            const x1 = Math.cos(2 * Math.PI * startPercent / 100);
            const y1 = Math.sin(2 * Math.PI * startPercent / 100);
            const x2 = Math.cos(2 * Math.PI * endPercent / 100);
            const y2 = Math.sin(2 * Math.PI * endPercent / 100);

            // Large arc flag
            const largeArcFlag = stat.percentage > 50 ? 1 : 0;

            // Path data
            const pathData = [
                `M 0 0`,
                `L ${x1} ${y1}`,
                `A 1 1 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                `Z`
            ].join(' ');

            return { ...stat, path: pathData };
        });
    });

    const totalIncome = computed(() => {
        return transactions.value
            .filter(t => getInferredType(t) === 'INCOME')
            .reduce((sum, t) => sum + Number(t.totalValue || t.amount || 0), 0);
    });

    const totalWithdraw = computed(() => {
        return transactions.value
            .filter(t => getInferredType(t) === 'OUT')
            .reduce((sum, t) => sum + Number(t.totalValue || t.amount || 0), 0);
    });

    return {
        transactions,
        loadingTransactions,
        selectedMonth,
        selectedYear,
        homeStats,
        weeklyChartData,
        categoryStats,
        donutChartData,
        totalIncome,
        totalWithdraw,
        fetchTransactions,
        getInferredType
    };
}
