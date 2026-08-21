
import WasteBankCashTransaction from "../models/wasteBankCashTransaction.model.mjs";
import WasteBankTransaction from "../models/wasteBankTransaction.model.mjs";
import User from "../models/user.model.mjs";
import { DateTime } from "luxon";
import AuditTrailService from "../services/auditTrail.service.mjs";

const parseRangeDate = (query) => {
    const { monthFrom, monthTo, year, quickFilter } = query;
    let startDate, endDate;

    if (quickFilter) {
        const months = parseInt(quickFilter);
        const now = new Date();
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        startDate = new Date();
        startDate.setMonth(now.getMonth() - months + 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
    } else if (monthFrom && monthTo && year) {
        startDate = new Date(parseInt(year), parseInt(monthFrom) - 1, 1, 0, 0, 0);
        endDate = new Date(parseInt(year), parseInt(monthTo), 0, 23, 59, 59);
    } else {
        const now = new Date();
        const m = parseInt(query.month) || now.getMonth() + 1;
        const y = parseInt(query.year) || now.getFullYear();
        startDate = new Date(y, m - 1, 1, 0, 0, 0);
        endDate = new Date(y, m, 0, 23, 59, 59);
    }

    return { startDate, endDate };
};

/**
 * Get Cash Summary (Balance & Monthly Stats)
 * Supports dynamic month/year filtering via query params
 */
export const getCashSummary = async (req, res) => {
    try {
        const { month, year } = req.query;

        // 1. Calculate Manual Cash (WasteBankCashTransaction)
        const cashStats = await WasteBankCashTransaction.aggregate([
            {
                $group: {
                    _id: null,
                    totalIn: { $sum: { $cond: [{ $eq: ["$type", "IN"] }, "$amount", 0] } },
                    totalOut: { $sum: { $cond: [{ $eq: ["$type", "OUT"] }, "$amount", 0] } }
                }
            }
        ]);

        const manualIn = cashStats[0]?.totalIn || 0;
        const manualOut = cashStats[0]?.totalOut || 0;

        // 2. Calculate Trading Profit (WasteBankTransaction)
        // Only completed transactions count as realized profit
        const profitStats = await WasteBankTransaction.aggregate([
            { $match: { status: 'COMPLETED' } },
            {
                $group: {
                    _id: null,
                    totalProfit: { $sum: "$totalProfit" }
                }
            }
        ]);

        const tradingProfit = profitStats[0]?.totalProfit || 0;

        // 3. Combined Lifetime Stats
        const totalIn = manualIn + tradingProfit; // Profit acts as IN
        const totalOut = manualOut;
        const balance = totalIn - totalOut;

        // 4. Calculate Period Stats
        const { startDate: startOfPeriod, endDate: endOfPeriod } = parseRangeDate(req.query);

        // 4a. Manual Monthly
        const manualMonthly = await WasteBankCashTransaction.aggregate([
            { $match: { date: { $gte: startOfPeriod, $lte: endOfPeriod } } },
            {
                $group: {
                    _id: null,
                    income: { $sum: { $cond: [{ $eq: ["$type", "IN"] }, "$amount", 0] } },
                    expense: { $sum: { $cond: [{ $eq: ["$type", "OUT"] }, "$amount", 0] } }
                }
            }
        ]);

        // 4b. Trading Monthly
        const tradingMonthly = await WasteBankTransaction.aggregate([
            {
                $match: {
                    status: 'COMPLETED',
                    transactionDate: { $gte: startOfPeriod, $lte: endOfPeriod }
                }
            },
            {
                $group: {
                    _id: null,
                    profit: { $sum: "$totalProfit" }
                }
            }
        ]);

        const incomeMonth = (manualMonthly[0]?.income || 0) + (tradingMonthly[0]?.profit || 0);
        const expenseMonth = manualMonthly[0]?.expense || 0;

        // 6. Calculate Shrinkage (Penyusutan)
        const shrinkageStats = await WasteBankCashTransaction.aggregate([
            {
                $match: {
                    type: 'OUT',
                    category: 'Penyusutan / Selisih Timbangan',
                    date: { $gte: startOfPeriod, $lte: endOfPeriod }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const shrinkageMonth = shrinkageStats[0]?.total || 0;

        // Visual separation: Expense Card = Total Expense - Shrinkage
        const operationalExpenseMonth = expenseMonth - shrinkageMonth;

        return res.json({
            success: true,
            data: {
                balance, // Real balance (Manual In - Out + Trading Profit)
                total_in: totalIn,
                total_out: totalOut,
                income_month: incomeMonth,
                expense_month: operationalExpenseMonth,
                shrinkage_month: shrinkageMonth, // New field
                last_updated: new Date(),
                // Include filter info for debugging
                filter_applied: month && year ? { month: parseInt(month), year: parseInt(year) } : 'current_month'
            }
        });

    } catch (error) {
        console.error("❌ getCashSummary Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get Transaction List (Paginated & Merged)
 * Uses $unionWith to merge Real Cash Transactions with Virtual Profit Transactions
 */
export const getTransactions = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || "1"));
        const limit = Math.max(1, parseInt(req.query.limit || "20"));
        const skip = (page - 1) * limit;

        const { startDate, endDate, type, category } = req.query;

        // Base Match for Manual Transactions
        const manualMatch = {};
        // Base Match for Trading Transactions (Virtual)
        const tradingMatch = { status: 'COMPLETED', totalProfit: { $gt: 0 } };

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            manualMatch.date = { $gte: start, $lte: end };
            tradingMatch.transactionDate = { $gte: start, $lte: end };
        }

        // Filter Logic
        // If user filters by 'OUT', we only show manual OUT.
        // If user filters by 'IN', we show manual IN + Trading Profits.
        // If user filters by Category 'Margin Trading', we only show Trading Profits.

        let showManual = true;
        let showTrading = true;

        if (type === 'OUT') {
            showTrading = false;
            manualMatch.type = 'OUT';
        } else if (type === 'IN') {
            manualMatch.type = 'IN';
            // showTrading remains true
        }

        if (category) {
            if (category === 'Penimbangan') {
                showManual = false;
            } else {
                showTrading = false; // Categories are specific to manual entries
                manualMatch.category = category;
            }
        }

        // Pipeline Construction
        const pipeline = [];

        // 1. Start with Manual Collection (if applicable)
        if (showManual) {
            pipeline.push({ $match: manualMatch });
            // Normalize fields
            pipeline.push({
                $project: {
                    _id: 1,
                    date: 1,
                    type: 1,
                    category: 1,
                    amount: 1,
                    description: 1,
                    proof_url: 1,
                    balance_after: 1, // Keep snapshot
                    performed_by: 1,
                    source: { $literal: 'MANUAL' },
                    // Nulls for trading fields
                    totalWeight: { $literal: 0 },
                    totalValue: { $literal: 0 },
                    totalPelapakValue: { $literal: 0 },
                    transactionId: { $literal: '-' },
                    customerName: { $literal: '-' },
                }
            });
        } else {
            // Hack: If manual excluded, match nothing
            pipeline.push({ $match: { _id: null } });
        }

        // 2. Union with Trading Transactions (if applicable)
        if (showTrading) {
            pipeline.push({
                $unionWith: {
                    coll: 'waste_bank_transactions',
                    pipeline: [
                        { $match: tradingMatch },
                        {
                            $project: {
                                _id: 1,
                                date: '$transactionDate',
                                type: { $literal: 'IN' },
                                category: { $literal: 'Penimbangan' },
                                amount: '$totalProfit',
                                description: { $literal: 'Margin Transaksi' },
                                // PRESERVE ORIGINAL DATA
                                transactionId: '$transactionId',
                                customerName: '$customerName',
                                totalWeight: '$totalWeight',
                                totalValue: '$totalValue', // Nilai Nasabah
                                totalPelapakValue: { $add: ['$totalValue', '$totalProfit'] },

                                balance_after: { $literal: 0 },
                                performed_by: { $literal: null },
                                source: { $literal: 'SYSTEM' }
                            }
                        }
                    ]
                }
            });
        }

        // 3. Sort
        pipeline.push({ $sort: { date: -1 } });

        // 4. Facet for Total Count and Pagination
        pipeline.push({
            $facet: {
                metadata: [{ $count: "total" }],
                data: [
                    { $skip: skip },
                    { $limit: limit },
                    // Lookup Performed By info for Manual entries
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'performed_by',
                            foreignField: '_id',
                            as: 'user_info'
                        }
                    },
                    {
                        $unwind: {
                            path: '$user_info',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            date: 1,
                            type: 1,
                            category: 1,
                            amount: 1,
                            description: 1,
                            balance_after: 1,
                            source: 1,
                            proof_url: 1,
                            // Pass through trading specific fields
                            transactionId: 1,
                            customerName: 1,
                            totalWeight: 1,
                            totalWeight: 1,
                            totalValue: 1, // Nilai Nasabah
                            totalPelapakValue: 1,
                            performed_by: {
                                nama_lengkap: '$user_info.nama_lengkap',
                                role: '$user_info.role'
                            }
                        }
                    }
                ]
            }
        });

        const result = await WasteBankCashTransaction.aggregate(pipeline);

        const data = result[0].data;
        const total = result[0].metadata[0]?.total || 0;

        return res.json({
            success: true,
            data,
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error("❌ getTransactions Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Create New Cash Transaction
 */
export const createTransaction = async (req, res) => {
    try {
        const { type, category, amount, description, date } = req.body;
        let proof_url = req.body.proof_url;

        if (req.file) {
            proof_url = `/uploads/cash-proofs/${req.file.filename}`;
        }

        const userId = req.user.id;

        // 1. Validation
        if (!type || !['IN', 'OUT'].includes(type)) {
            return res.status(400).json({ success: false, message: "Type must be IN or OUT" });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Amount must be greater than 0" });
        }
        if (!category) {
            return res.status(400).json({ success: false, message: "Category is required" });
        }

        // 2. Get Current Balance
        // NOTE: This must match the getCashSummary logic to be consistent!

        // A. Manual Balance
        const manualStats = await WasteBankCashTransaction.aggregate([
            {
                $group: {
                    _id: null,
                    totalIn: { $sum: { $cond: [{ $eq: ["$type", "IN"] }, "$amount", 0] } },
                    totalOut: { $sum: { $cond: [{ $eq: ["$type", "OUT"] }, "$amount", 0] } }
                }
            }
        ]);
        const manualIn = manualStats[0]?.totalIn || 0;
        const manualOut = manualStats[0]?.totalOut || 0;

        // B. Trading Profit Balance
        const profitStats = await WasteBankTransaction.aggregate([
            { $match: { status: 'COMPLETED' } },
            {
                $group: {
                    _id: null,
                    totalProfit: { $sum: "$totalProfit" }
                }
            }
        ]);
        const tradingProfit = profitStats[0]?.totalProfit || 0;

        const currentBalance = (manualIn + tradingProfit) - manualOut;

        // 3. Validation: Cannot spend more than balance
        if (type === 'OUT' && amount > currentBalance) {
            return res.status(400).json({
                success: false,
                message: `Saldo tidak cukup. Saldo saat ini: Rp ${currentBalance.toLocaleString('id-ID')}`
            });
        }

        // 4. Calculate New Balance
        const balanceAfter = type === 'IN'
            ? currentBalance + Number(amount)
            : currentBalance - Number(amount);

        // 5. Create Record
        const transaction = await WasteBankCashTransaction.create({
            type,
            category,
            amount: Number(amount),
            description,
            balance_after: balanceAfter,
            date: date ? new Date(date) : new Date(),
            proof_url,
            performed_by: userId
        });

        // Log audit trail untuk waste bank cash transaction
        if (req.user) {
            await AuditTrailService.logActivity({
                user_id: req.user.id,
                username: req.user.username,
                user_role: req.user.role,
                action: 'CREATE',
                resource: 'WasteBankCash',
                resource_id: transaction._id,
                description: `Membuat transaksi kas ${type}: ${category} (Rp ${amount})`,
                ip_address: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
                user_agent: req.headers['user-agent'],
                metadata: {
                    created_cash_transaction: {
                        type,
                        category,
                        amount: Number(amount),
                        balance_before: currentBalance,
                        balance_after,
                        description,
                        date: date ? new Date(date) : new Date()
                    },
                    method: req.method,
                    endpoint: req.originalUrl
                },
                status: 'success'
            });
        }

        return res.status(201).json({
            success: true,
            message: "Transaksi berhasil dicatat",
            data: transaction
        });

    } catch (error) {
        console.error("❌ createTransaction Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
