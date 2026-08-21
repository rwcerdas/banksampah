import WasteBankCustomer from '../models/wasteBankCustomer.model.mjs';
import WasteBankTransaction from '../models/wasteBankTransaction.model.mjs';
import WasteBankWithdrawal from '../models/wasteBankWithdrawal.model.mjs';
import WasteBankSetting from '../models/wasteBankSetting.model.mjs';
import { parseWasteBankRangeDate as parseRangeDate } from '../utils/dateRange.mjs';

export const getDashboardStats = async (req, res) => {
    try {
        const { startDate, endDate } = parseRangeDate(req.query);

        // Active customers count & TOTAL BALANCE (Liability)
        const customersAgg = await WasteBankCustomer.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    totalBalance: { $sum: "$balance" }
                }
            }
        ]);
        const activeCustomers = customersAgg.length > 0 ? customersAgg[0].count : 0;
        const totalCustomerBalance = customersAgg.length > 0 ? customersAgg[0].totalBalance : 0;

        // Total Profit ALL TIME (Accumulated Cash/Profit)
        const profitAgg = await WasteBankTransaction.aggregate([
            { $match: { status: 'COMPLETED' } },
            { $group: { _id: null, totalProfit: { $sum: "$totalProfit" } } }
        ]);
        const totalProfitAllTime = profitAgg.length > 0 ? profitAgg[0].totalProfit : 0;

        // Total Withdrawals ALL TIME (Funds distributed/deducted)
        // Includes PENDING because they already deduct balance
        const withdrawalAgg = await WasteBankWithdrawal.aggregate([
            { $match: { status: { $in: ['COMPLETED', 'APPROVED', 'PENDING'] } } },
            { $group: { _id: null, totalWithdrawals: { $sum: "$amount" } } }
        ]);
        const totalWithdrawalsAllTime = withdrawalAgg.length > 0 ? withdrawalAgg[0].totalWithdrawals : 0;

        // Transactions in period
        // Transactions in period (filtered by active customer)
        const transactions = await WasteBankTransaction.aggregate([
            {
                $match: {
                    transactionDate: { $gte: startDate, $lte: endDate },
                    status: 'COMPLETED'
                }
            },
            {
                $lookup: {
                    from: "waste_bank_customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            {
                $unwind: "$customer"
            },
            {
                $match: {
                    "customer.isActive": true // ONLY Active Customers
                }
            }
        ]);

        const totalTransactions = transactions.length;
        const totalWeight = transactions.reduce((sum, t) => sum + t.totalWeight, 0);
        const totalValue = transactions.reduce((sum, t) => sum + t.totalValue, 0);
        const totalProfit = transactions.reduce((sum, t) => sum + t.totalProfit, 0);

        // Comparation with previous month
        const prevStartDate = new Date(startDate);
        prevStartDate.setMonth(prevStartDate.getMonth() - 1);
        const prevEndDate = new Date(startDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);

        // Get Margin Percentage
        const markupSetting = await WasteBankSetting.getSetting('GLOBAL_MARKUP_PERCENTAGE');
        const marginPercentage = typeof markupSetting === 'number' ? markupSetting : 15;

        // ... Previous month logic if needed ...



        const prevTransactions = await WasteBankTransaction.aggregate([
            {
                $match: {
                    transactionDate: { $gte: prevStartDate, $lte: prevEndDate },
                    status: 'COMPLETED'
                }
            },
            {
                $lookup: {
                    from: "waste_bank_customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            {
                $unwind: "$customer"
            },
            {
                $match: {
                    "customer.isActive": true
                }
            }
        ]);

        const prevTotalValue = prevTransactions.reduce((sum, t) => sum + t.totalValue, 0);
        const prevTotalWeight = prevTransactions.reduce((sum, t) => sum + t.totalWeight, 0);

        const valueGrowth = prevTotalValue > 0
            ? ((totalValue - prevTotalValue) / prevTotalValue * 100).toFixed(1)
            : 0;

        const weightGrowth = prevTotalWeight > 0
            ? ((totalWeight - prevTotalWeight) / prevTotalWeight * 100).toFixed(1)
            : 0;

        res.json({
            success: true,
            data: {
                activeCustomers,
                totalCustomerBalance: totalCustomerBalance.toFixed(0),
                totalProfitAllTime: totalProfitAllTime.toFixed(0), // New field
                totalWithdrawalsAllTime: totalWithdrawalsAllTime.toFixed(0), // New field
                totalTransactions,
                totalWeight: totalWeight.toFixed(2),
                totalValue: totalValue.toFixed(0),
                totalProfit: totalProfit.toFixed(0),
                valueGrowth: parseFloat(valueGrowth),
                weightGrowth: parseFloat(weightGrowth),
                marginPercentage, // Add this
                period: {
                    start: startDate,
                    end: endDate
                }
            }
        });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil statistik dashboard',
            error: error.message
        });
    }
};

export const getWeightTrend = async (req, res) => {
    try {
        const { months = 12, year, viewMode } = req.query;

        const currentYear = year ? parseInt(year) : new Date().getFullYear();

        if (viewMode === 'session') {
            const startDate = new Date(currentYear, 0, 1);
            const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

            const trends = await WasteBankTransaction.aggregate([
                {
                    $match: {
                        transactionDate: { $gte: startDate, $lte: endDate },
                        status: 'COMPLETED'
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$transactionDate" }
                        },
                        totalWeight: { $sum: "$totalWeight" },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id": 1 } }
            ]);

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            const formattedData = trends.map(t => {
                const parts = t._id.split('-');
                const d = parseInt(parts[2], 10);
                const m = parseInt(parts[1], 10) - 1;
                const label = `${d < 10 ? '0' + d : d} ${monthNames[m]}`;
                return {
                    month: label,
                    weight: parseFloat(t.totalWeight.toFixed(2)),
                    count: t.count
                };
            });

            return res.json({
                success: true,
                data: formattedData
            });
        }

        const data = [];

        // Loop Jan (0) to Dec (11)
        for (let i = 0; i < 12; i++) {
            const startDate = new Date(currentYear, i, 1);
            const endDate = new Date(currentYear, i + 1, 0, 23, 59, 59);

            const transactions = await WasteBankTransaction.find({
                transactionDate: { $gte: startDate, $lte: endDate },
                status: 'COMPLETED'
            }).lean();

            const totalWeight = transactions.reduce((sum, t) => sum + t.totalWeight, 0);

            data.push({
                month: startDate.toLocaleString('id-ID', { month: 'short', year: 'numeric' }),
                weight: parseFloat(totalWeight.toFixed(2)),
                count: transactions.length
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error getting weight trend:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil trend penimbangan',
            error: error.message
        });
    }
};

export const getValueTrend = async (req, res) => {
    try {
        const { year, viewMode } = req.query; // Remove 'months', use 'year'

        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const startDate = new Date(targetYear, 0, 1); // Jan 1st
        const endDate = new Date(targetYear, 11, 31, 23, 59, 59); // Dec 31st

        if (viewMode === 'session') {
            const trends = await WasteBankTransaction.aggregate([
                {
                    $match: {
                        transactionDate: { $gte: startDate, $lte: endDate },
                        status: 'COMPLETED'
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$transactionDate" }
                        },
                        totalValue: { $sum: "$totalValue" },
                        totalProfit: { $sum: "$totalProfit" }
                    }
                },
                { $sort: { "_id": 1 } }
            ]);

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            const formattedData = trends.map(t => {
                const parts = t._id.split('-');
                const d = parseInt(parts[2], 10);
                const m = parseInt(parts[1], 10) - 1;
                const y = parseInt(parts[0], 10);
                const label = `${d < 10 ? '0' + d : d} ${monthNames[m]}`;
                return {
                    month: label,
                    year: y,
                    value: t.totalValue,
                    profit: t.totalProfit
                };
            });

            return res.status(200).json({
                success: true,
                data: formattedData
            });
        }

        const trends = await WasteBankTransaction.aggregate([
            {
                $match: {
                    transactionDate: { $gte: startDate, $lte: endDate },
                    status: 'COMPLETED'
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$transactionDate" },
                        year: { $year: "$transactionDate" }
                    },
                    totalValue: { $sum: "$totalValue" }, // Customer Value
                    totalProfit: { $sum: "$totalProfit" } // Profit
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Format for chart (Fill missing months with 0)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const formattedData = [];

        let current = new Date(startDate);
        while (current <= endDate) {
            const m = current.getMonth() + 1;
            const y = current.getFullYear();
            const label = monthNames[current.getMonth()];

            const found = trends.find(t => t._id.month === m && t._id.year === y);

            formattedData.push({
                month: label,
                year: y,
                value: found ? found.totalValue : 0,
                profit: found ? found.totalProfit : 0
            });

            current.setMonth(current.getMonth() + 1);
        }

        res.status(200).json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        console.error('Error fetching value trend:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data trend nilai',
            error: error.message
        });
    }
};

export const getCategoryBreakdown = async (req, res) => {
    try {
        const { startDate, endDate } = parseRangeDate(req.query);

        const breakdown = await WasteBankTransaction.aggregate([
            {
                $match: {
                    transactionDate: { $gte: startDate, $lte: endDate },
                    status: 'COMPLETED'
                }
            },
            { $unwind: "$items" },
            // Lookup Item to get fresh details
            {
                $lookup: {
                    from: "waste_bank_items",
                    localField: "items.itemId",
                    foreignField: "_id",
                    as: "itemInfo"
                }
            },
            { $unwind: "$itemInfo" },
            // Lookup Category to get real name
            {
                $lookup: {
                    from: "waste_bank_categories",
                    localField: "itemInfo.categoryId",
                    foreignField: "_id",
                    as: "categoryInfo"
                }
            },
            { $unwind: "$categoryInfo" },
            {
                $group: {
                    _id: "$categoryInfo.categoryName", // Group by Real Category Name
                    totalWeight: { $sum: "$items.weight" },
                    totalPelapakValue: { $sum: { $multiply: ["$items.pelapakPrice", "$items.weight"] } },
                    totalSubtotal: { $sum: "$items.subtotal" }
                }
            },
            {
                $project: {
                    categoryName: "$_id",
                    weight: { $round: ["$totalWeight", 2] },
                    profit: { $subtract: ["$totalPelapakValue", "$totalSubtotal"] }
                }
            },
            { $sort: { profit: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: breakdown
        });
    } catch (error) {
        console.error('Error fetching category breakdown:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data breakdown kategori',
            error: error.message
        });
    }
};

export const getRTBreakdown = async (req, res) => {
    try {
        const { startDate, endDate } = parseRangeDate(req.query);

        const breakdown = await WasteBankTransaction.aggregate([
            {
                $match: {
                    transactionDate: { $gte: startDate, $lte: endDate },
                    status: 'COMPLETED'
                }
            },
            {
                $lookup: {
                    from: "waste_bank_customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: "$customer" },
            {
                $addFields: {
                    isInternal: {
                        $cond: {
                            if: { $eq: ["$customer.locality", "EXTERNAL"] },
                            then: false,
                            else: {
                                $cond: {
                                    if: { $eq: ["$customer.locality", "INTERNAL"] },
                                    then: true,
                                    else: {
                                        $or: [
                                            { $eq: ["$customer.dataSource", "HOUSEHOLD_DB"] },
                                            { $in: ["$customer.rw", [9, "9", "09", "RW 09", "RW09", "RW 9", 9.0]] }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    rtLabel: {
                        $cond: {
                            if: { $eq: ["$customer.customerType", "GROUP"] },
                            then: {
                                $concat: [
                                    { $ifNull: ["$customer.name", "Kelompok"] },
                                    { $cond: [{ $eq: ["$isInternal", true] }, " (Internal)", " (Eksternal)"] }
                                ]
                            },
                            else: {
                                $cond: {
                                    if: { $eq: ["$isInternal", true] },
                                    then: {
                                        $cond: {
                                            if: { $and: [ { $ne: ["$customer.rt", null] }, { $ne: ["$customer.rt", ""] } ] },
                                            then: "$customer.rt",
                                            else: "RW 09"
                                        }
                                    },
                                    else: "External"
                                }
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: {
                        rt: "$rtLabel",
                        type: "$customer.customerType"
                    },
                    uniqueCustomers: { $addToSet: "$customerId" },
                    totalWeight: { $sum: "$totalWeight" },
                    transactionCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.rt",
                    details: {
                        $push: {
                            type: "$_id.type",
                            weight: "$totalWeight",
                            activeCount: { $size: "$uniqueCustomers" },
                            transactionCount: "$transactionCount"
                        }
                    },
                    totalWeight: { $sum: "$totalWeight" },
                }
            },
            {
                $project: {
                    rt: "$_id",
                    totalWeight: { $round: ["$totalWeight", 2] },
                    indWeight: {
                        $round: [
                            {
                                $reduce: {
                                    input: "$details",
                                    initialValue: 0,
                                    in: { $cond: [{ $eq: ["$$this.type", "INDIVIDUAL"] }, "$$this.weight", "$$value"] }
                                }
                            }, 2
                        ]
                    },
                    grpWeight: {
                        $round: [
                            {
                                $reduce: {
                                    input: "$details",
                                    initialValue: 0,
                                    in: { $cond: [{ $eq: ["$$this.type", "GROUP"] }, "$$this.weight", "$$value"] }
                                }
                            }, 2
                        ]
                    },
                    indActive: {
                        $reduce: {
                            input: "$details",
                            initialValue: 0,
                            in: { $cond: [{ $eq: ["$$this.type", "INDIVIDUAL"] }, "$$this.activeCount", "$$value"] }
                        }
                    },
                    grpActive: {
                        $reduce: {
                            input: "$details",
                            initialValue: 0,
                            in: { $cond: [{ $eq: ["$$this.type", "GROUP"] }, "$$this.activeCount", "$$value"] }
                        }
                    },
                    totalTransactions: { $sum: "$details.transactionCount" },
                    _id: 0
                }
            },
            { $sort: { totalWeight: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: breakdown
        });
    } catch (error) {
        console.error('getRTBreakdown Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getActiveCustomersTrend = async (req, res) => {
    try {
        const { year } = req.query;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const startDate = new Date(targetYear, 0, 1);
        const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

        const trends = await WasteBankTransaction.aggregate([
            {
                $match: {
                    transactionDate: { $gte: startDate, $lte: endDate },
                    status: 'COMPLETED'
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$transactionDate" },
                        year: { $year: "$transactionDate" },
                        customerId: "$customerId"
                    }
                }
            },
            {
                $group: {
                    _id: {
                        month: "$_id.month",
                        year: "$_id.year"
                    },
                    activeCustomers: { $count: {} }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const formattedData = [];

        let current = new Date(startDate);
        while (current <= endDate) {
            const m = current.getMonth() + 1;
            const y = current.getFullYear();
            const label = monthNames[current.getMonth()];

            const found = trends.find(t => t._id.month === m && t._id.year === y);

            formattedData.push({
                month: label,
                activeCustomers: found ? found.activeCustomers : 0,
                newCustomers: 0
            });

            current.setMonth(current.getMonth() + 1);
        }

        res.status(200).json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        console.error('Error fetching active customers trend:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data trend nasabah',
            error: error.message
        });
    }
};

export const getTopCustomers = async (req, res) => {
    try {
        const { limit = 10, sortBy = 'totalValue', customerType } = req.query;
        const { startDate, endDate } = parseRangeDate(req.query);

        const sortQuery = {};
        sortQuery[sortBy] = -1;

        const pipeline = [
            {
                $match: {
                    transactionDate: { $gte: startDate, $lte: endDate },
                    status: 'COMPLETED'
                }
            },
            {
                $lookup: {
                    from: 'waste_bank_customers',
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customerInfo'
                }
            },
            { $unwind: '$customerInfo' }
        ];

        // Filter by customerType if provided
        if (customerType) {
            pipeline.push({
                $match: {
                    'customerInfo.customerType': customerType
                }
            });
        }

        pipeline.push(
            {
                $group: {
                    _id: '$customerId',
                    customerName: { $first: '$customerName' },
                    accountNumber: { $first: '$customerAccountNumber' },
                    customerType: { $first: '$customerInfo.customerType' },
                    totalTransactions: { $sum: 1 },
                    totalWeight: { $sum: '$totalWeight' },
                    totalValue: { $sum: '$totalValue' }
                }
            },
            { $sort: sortQuery },
            { $limit: parseInt(limit) }
        );

        const result = await WasteBankTransaction.aggregate(pipeline);

        res.json({
            success: true,
            data: result.map((item, index) => ({
                rank: index + 1,
                customerId: item._id,
                customerName: item.customerName,
                accountNumber: item.accountNumber,
                totalTransactions: item.totalTransactions,
                totalWeight: parseFloat(item.totalWeight.toFixed(2)),
                totalValue: parseFloat(item.totalValue.toFixed(0))
            }))
        });
    } catch (error) {
        console.error('Error getting top customers:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil top nasabah',
            error: error.message
        });
    }
};

// ============================================
// REPORTS
// ============================================
