import WasteBankTransaction from '../models/wasteBankTransaction.model.mjs';
import WasteBankCashTransaction from '../models/wasteBankCashTransaction.model.mjs';
import aiService from '../services/aiInsight.service.mjs';
import AuditTrailService from '../services/auditTrail.service.mjs';

/**
 * Get weighing report with aggregated metrics
 * Query params: startDate, endDate (ISO date strings)
 */
export const getWeighingReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Validate date range
        if (start > end) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be after end date'
            });
        }

        // Base filter for completed transactions in date range
        const baseFilter = {
            transactionDate: { $gte: start, $lte: end },
            status: 'COMPLETED'
        };

        // 1. CUSTOMER METRICS
        const customerMetrics = await WasteBankTransaction.aggregate([
            { $match: baseFilter },
            {
                $group: {
                    _id: null,
                    uniqueCustomers: { $addToSet: '$customerId' },
                    totalTransactions: { $sum: 1 }
                }
            }
        ]);

        const customerCount = customerMetrics[0]?.uniqueCustomers.length || 0;
        const transactionCount = customerMetrics[0]?.totalTransactions || 0;

        // 2. WEIGHT METRICS - Total and by item
        const weightMetrics = await WasteBankTransaction.aggregate([
            { $match: baseFilter },
            { $unwind: '$items' },
            {
                $group: {
                    _id: {
                        itemCode: '$items.itemCode',
                        itemName: '$items.itemName',
                        categoryCode: '$items.categoryCode'
                    },
                    totalWeight: { $sum: '$items.weight' },
                    totalValue: { $sum: '$items.subtotal' },
                    transactionCount: { $sum: 1 }
                }
            },
            { $sort: { totalWeight: -1 } }
        ]);

        const totalWeight = weightMetrics.reduce((sum, item) => sum + item.totalWeight, 0);

        const weightByItem = weightMetrics.map(item => ({
            itemCode: item._id.itemCode,
            itemName: item._id.itemName,
            categoryCode: item._id.categoryCode,
            weight: item.totalWeight,
            value: item.totalValue,
            percentage: totalWeight > 0 ? ((item.totalWeight / totalWeight) * 100).toFixed(2) : 0,
            transactionCount: item.transactionCount
        }));

        // 3. COLLECTOR DISTRIBUTION
        // Get collector name from settings to use as fallback
        const WasteBankSetting = (await import('../models/wasteBankSetting.model.mjs')).default;
        const defaultCollector = await WasteBankSetting.getSetting('COLLECTOR_NAME');

        const collectorMetrics = await WasteBankTransaction.aggregate([
            { $match: baseFilter },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $or: [{ $eq: ['$collector', null] }, { $eq: ['$collector', ''] }] },
                            defaultCollector || 'Tidak Diketahui',
                            '$collector'
                        ]
                    },
                    totalWeight: { $sum: '$totalWeight' },
                    totalValue: { $sum: '$totalValue' },
                    transactionCount: { $sum: 1 }
                }
            },
            { $sort: { totalWeight: -1 } }
        ]);

        const totalCollectorWeight = collectorMetrics.reduce((sum, c) => sum + c.totalWeight, 0);

        const collectorDistribution = collectorMetrics.map(collector => ({
            collectorName: collector._id,
            weight: collector.totalWeight,
            value: collector.totalValue,
            percentage: totalCollectorWeight > 0 ? ((collector.totalWeight / totalCollectorWeight) * 100).toFixed(2) : 0,
            transactionCount: collector.transactionCount
        }));

        // 4. FINANCIAL METRICS
        const financialMetrics = await WasteBankTransaction.aggregate([
            { $match: baseFilter },
            {
                $group: {
                    _id: null,
                    totalTransactionValue: { $sum: '$totalValue' },
                    totalProfit: { $sum: '$totalProfit' },
                    cashTransactions: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentMethod', 'CASH'] }, '$totalValue', 0]
                        }
                    },
                    savingsTransactions: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentMethod', 'SAVINGS'] }, '$totalValue', 0]
                        }
                    }
                }
            }
        ]);

        const financial = financialMetrics[0] || {
            totalTransactionValue: 0,
            totalProfit: 0,
            cashTransactions: 0,
            savingsTransactions: 0
        };

        // 5. MANAGEMENT CASH (Kas Pengurus from Cash Transactions)
        const managementCash = await WasteBankCashTransaction.aggregate([
            {
                $match: {
                    date: { $gte: start, $lte: end },
                    type: 'IN',
                    category: 'Penjualan Sampah'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const kasFromSales = managementCash[0]?.total || 0;

        // 6. TIME SERIES DATA (Daily breakdown)
        const timeSeriesData = await WasteBankTransaction.aggregate([
            { $match: baseFilter },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$transactionDate' }
                    },
                    weight: { $sum: '$totalWeight' },
                    value: { $sum: '$totalValue' },
                    profit: { $sum: '$totalProfit' },
                    transactions: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 7. CUSTOMER BREAKDOWN (Grouped by customer, date, and item details using customerPrice)
        const rawCustomerItems = await WasteBankTransaction.aggregate([
            { $match: baseFilter },
            { $unwind: '$items' },
            {
                $group: {
                    _id: {
                        customerId: '$customerId',
                        customerName: '$customerName',
                        customerAccountNumber: '$customerAccountNumber',
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$transactionDate', timezone: 'Asia/Jakarta' } },
                        itemCode: '$items.itemCode',
                        itemName: '$items.itemName'
                    },
                    totalWeight: { $sum: '$items.weight' },
                    totalValue: { $sum: '$items.subtotal' }, // subtotal uses customerPrice
                    transactionCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: {
                        customerId: '$_id.customerId',
                        customerName: '$_id.customerName',
                        customerAccountNumber: '$_id.customerAccountNumber'
                    },
                    totalWeight: { $sum: '$totalWeight' },
                    totalValue: { $sum: '$totalValue' },
                    totalTransactions: { $sum: '$transactionCount' },
                    items: {
                        $push: {
                            date: '$_id.date',
                            itemCode: '$_id.itemCode',
                            itemName: '$_id.itemName',
                            weight: '$totalWeight',
                            value: '$totalValue',
                            avgCustomerPrice: {
                                $cond: [
                                    { $gt: ['$totalWeight', 0] },
                                    { $divide: ['$totalValue', '$totalWeight'] },
                                    0
                                ]
                            }
                        }
                    }
                }
            },
            { $sort: { totalValue: -1 } }
        ]);

        const customerBreakdown = rawCustomerItems.map(c => ({
            customerId: c._id.customerId,
            customerName: c._id.customerName || 'Nasabah Tanpa Nama',
            customerAccountNumber: c._id.customerAccountNumber || '-',
            totalWeight: parseFloat(c.totalWeight.toFixed(2)),
            totalValue: c.totalValue,
            totalTransactions: c.totalTransactions,
            items: c.items.map(item => ({
                date: item.date || '-',
                itemCode: item.itemCode,
                itemName: item.itemName,
                weight: parseFloat(item.weight.toFixed(2)),
                value: item.value,
                avgCustomerPrice: Math.round(item.avgCustomerPrice)
            })).sort((a, b) => b.date.localeCompare(a.date))
        }));

        // Build Response
        const report = {
            summary: {
                dateRange: {
                    start: start.toISOString().split('T')[0],
                    end: end.toISOString().split('T')[0]
                },
                customers: {
                    uniqueCustomers: customerCount,
                    totalTransactions: transactionCount
                },
                weight: {
                    total: parseFloat(totalWeight.toFixed(2)),
                    unit: 'Kg'
                },
                financial: {
                    totalTransactionValue: financial.totalTransactionValue,
                    customerSavings: financial.savingsTransactions,
                    cashPayments: financial.cashTransactions,
                    totalProfit: financial.totalProfit,
                    managementCash: kasFromSales,
                    currency: 'IDR'
                }
            },
            details: {
                weightByItem,
                collectorDistribution,
                timeSeries: timeSeriesData.map(day => ({
                    date: day._id,
                    weight: day.weight,
                    value: day.value,
                    profit: day.profit,
                    transactions: day.transactions
                })),
                customerBreakdown
            }
        };

        res.json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error('Error generating weighing report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate report',
            error: error.message
        });
    }
};

/**
 * Generate AI insight for waste bank report
 * POST body: { startDate, endDate, audience }
 * audience: 'management' (default) or 'public'
 */
export const generateWasteBankInsight = async (req, res) => {
    try {
        const { startDate, endDate, audience = 'management' } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        // Get report data first
        const reportReq = { query: { startDate, endDate } };
        const reportMock = {
            status: (code) => ({
                json: (data) => {
                    if (!data.success) {
                        throw new Error(data.message || 'Failed to get report data');
                    }
                    return data.data;
                }
            }),
            json: (data) => data.data
        };

        let reportData;
        try {
            // Call getWeighingReport to get data
            await getWeighingReport(reportReq, {
                json: (response) => {
                    if (response.success) {
                        reportData = response.data;
                    } else {
                        throw new Error(response.message);
                    }
                }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch report data: ' + error.message
            });
        }

        if (!reportData) {
            return res.status(500).json({
                success: false,
                message: 'No report data available'
            });
        }

        // Prepare stats for AI
        const stats = {
            dateRange: {
                start: startDate,
                end: endDate
            },
            uniqueCustomers: reportData.summary?.customers?.uniqueCustomers || 0,
            totalTransactions: reportData.summary?.customers?.totalTransactions || 0,
            totalWeight: reportData.summary?.weight?.total || 0,
            totalValue: reportData.summary?.financial?.totalTransactionValue || 0,
            totalProfit: reportData.summary?.financial?.totalProfit || 0,
            customerSavings: reportData.summary?.financial?.customerSavings || 0,
            cashPayments: reportData.summary?.financial?.cashPayments || 0,
            weightByItem: reportData.details?.weightByItem || [],
            collectorDistribution: reportData.details?.collectorDistribution || []
        };

        // Determine category based on audience
        const category = audience === 'public' ? 'waste_bank_public' : 'waste_bank_management';

        // Call AI service
        const result = await aiService.generateInsightWithAI(stats, category, 'RW 09');

        res.json({
            success: true,
            data: result.insight,
            model_used: result.model_used,
            attempt: result.attempt
        });

    } catch (error) {
        console.error('Error generating waste bank insight:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate AI insight'
        });
    }
};

/**
 * Get DLH (Dinas Lingkungan Hidup) report
 *
 * Query params:
 *   startDate   (required) ISO date string
 *   endDate     (required) ISO date string
 *   collectorId (optional) ObjectId — filter to one collector; omit for ALL collectors
 *
 * Response always returns data grouped by collector so the frontend
 * can render one section per collector regardless of filter mode.
 */
export const getDLHReport = async (req, res) => {
    try {
        const { startDate, endDate, collectorId } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        if (start > end) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be after end date'
            });
        }

        // Import models needed
        const WasteBankSetting = (await import('../models/wasteBankSetting.model.mjs')).default;
        const WasteBankCollector = (await import('../models/wasteBankCollector.model.mjs')).default;
        const defaultCollectorName = await WasteBankSetting.getSetting('COLLECTOR_NAME');

        // ─── Base filter ─────────────────────────────────────────────────────────
        const baseFilter = {
            transactionDate: { $gte: start, $lte: end },
            status: 'COMPLETED'
        };

        // If specific collectors are requested, parse and add to filter.
        let selectedCollectors = [];
        if (collectorId && collectorId !== 'all') {
            try {
                const mongoose = (await import('mongoose')).default;
                // Handle multiple IDs if comma-separated
                const idArray = collectorId.split(',').map(id => id.trim());
                const objectIds = idArray.map(id => new mongoose.Types.ObjectId(id));
                baseFilter.collectorId = { $in: objectIds };
                selectedCollectors = await WasteBankCollector.find({ _id: { $in: objectIds } }).lean();
            } catch (e) {
                // Invalid ObjectId — ignore filter
            }
        }

        // ─── 1. Grand totals (summary) ────────────────────────────────────────────
        const summaryAgg = await WasteBankTransaction.aggregate([
            { $match: baseFilter },
            {
                $group: {
                    _id: null,
                    uniqueCustomers: { $addToSet: '$customerId' },
                    totalTransactions: { $sum: 1 },
                    totalWeight: { $sum: '$totalWeight' }
                }
            }
        ]);

        const totalWeightGrand = summaryAgg[0]?.totalWeight || 0;
        const customerCount = summaryAgg[0]?.uniqueCustomers?.length || 0;
        const transactionCount = summaryAgg[0]?.totalTransactions || 0;

        // ─── 2. Per-collector aggregation ─────────────────────────────────────────
        // Group transactions by collectorId (structured) or fall back to collector string.
        // For each collector group, further unwind items to get per-item breakdown.
        const collectorGroupAgg = await WasteBankTransaction.aggregate([
            { $match: baseFilter },
            // Classify collector: prefer collectorId (structured), fall back to collector string
            {
                $addFields: {
                    _collectorKey: {
                        $cond: [
                            { $and: [{ $ne: ['$collectorId', null] }, { $ne: ['$collectorId', ''] }] },
                            { $toString: '$collectorId' },
                            {
                                $cond: [
                                    { $and: [{ $ne: ['$collectorName', null] }, { $ne: ['$collectorName', ''] }] },
                                    '$collectorName',
                                    {
                                        $cond: [
                                            { $and: [{ $ne: ['$collector', null] }, { $ne: ['$collector', ''] }] },
                                            '$collector',
                                            'Sistem Internal - Tanpa Pengepul'
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    _collectorName: {
                        $cond: [
                            { $and: [{ $ne: ['$collectorName', null] }, { $ne: ['$collectorName', ''] }] },
                            '$collectorName',
                            {
                                $cond: [
                                    { $and: [{ $ne: ['$collector', null] }, { $ne: ['$collector', ''] }] },
                                    '$collector',
                                    'Sistem Internal - Tanpa Pengepul'
                                ]
                            }
                        ]
                    },
                    _collectorId: '$collectorId'
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: {
                        collectorKey: '$_collectorKey',
                        collectorName: '$_collectorName',
                        collectorId: '$_collectorId',
                        itemCode: '$items.itemCode',
                        itemName: '$items.itemName',
                        categoryCode: '$items.categoryCode'
                    },
                    totalWeight: { $sum: '$items.weight' },
                    totalPelapakValue: {
                        $sum: { $multiply: ['$items.pelapakPrice', '$items.weight'] }
                    },
                    transactionIds: { $addToSet: '$_id' }
                }
            },
            { $sort: { '_id.collectorKey': 1, totalWeight: -1 } }
        ]);

        // ─── 3. Reshape into byCollector[] ────────────────────────────────────────
        const collectorMap = new Map();

        for (const row of collectorGroupAgg) {
            const key = row._id.collectorKey;
            if (!collectorMap.has(key)) {
                collectorMap.set(key, {
                    collectorKey: key,
                    collectorId: row._id.collectorId ? row._id.collectorId.toString() : null,
                    collectorName: row._id.collectorName,
                    totalWeight: 0,
                    totalPelapakValue: 0,
                    transactionCount: 0,
                    weightByItem: []
                });
            }
            const group = collectorMap.get(key);
            group.totalWeight += row.totalWeight;
            group.totalPelapakValue += row.totalPelapakValue;
            group.transactionCount += row.transactionIds.length;
            group.weightByItem.push({
                itemCode: row._id.itemCode,
                itemName: row._id.itemName,
                categoryCode: row._id.categoryCode,
                weight: row.totalWeight,
                pelapakValue: row.totalPelapakValue,
                avgPelapakPrice: row.totalWeight > 0
                    ? parseFloat((row.totalPelapakValue / row.totalWeight).toFixed(0))
                    : 0
            });
        }

        // Compute percentages within each collector group
        const byCollector = Array.from(collectorMap.values()).map(group => {
            const groupTotal = group.totalWeight;
            return {
                ...group,
                totalWeight: parseFloat(group.totalWeight.toFixed(2)),
                totalPelapakValue: parseFloat(group.totalPelapakValue.toFixed(0)),
                weightByItem: group.weightByItem.map(item => ({
                    ...item,
                    weight: parseFloat(item.weight.toFixed(2)),
                    percentage: groupTotal > 0
                        ? parseFloat(((item.weight / groupTotal) * 100).toFixed(2))
                        : 0
                })).sort((a, b) => b.weight - a.weight)
            };
        });

        const totalPelapakValueGrand = byCollector.reduce((s, g) => s + g.totalPelapakValue, 0);

        // ─── 4. Build response ────────────────────────────────────────────────────
        const report = {
            meta: {
                mode: (collectorId && collectorId !== 'all') ? 'specific' : 'all',
                selectedCollectors: selectedCollectors.map(c => ({
                    _id: c._id,
                    collectorName: c.collectorName,
                    collectorCode: c.collectorCode
                }))
            },
            summary: {
                dateRange: {
                    start: start.toISOString().split('T')[0],
                    end: end.toISOString().split('T')[0]
                },
                customers: {
                    uniqueCustomers: customerCount,
                    totalTransactions: transactionCount
                },
                weight: {
                    total: parseFloat(totalWeightGrand.toFixed(2)),
                    unit: 'Kg'
                },
                pelapakValue: {
                    totalValue: totalPelapakValueGrand,
                    currency: 'IDR',
                    note: 'Berdasarkan harga pengepul'
                }
            },
            // Array of per-collector groups — always present, even when filtered to one
            byCollector
        };

        res.json({ success: true, data: report });

    } catch (error) {
        console.error('Error generating DLH report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate DLH report',
            error: error.message
        });
    }
};

