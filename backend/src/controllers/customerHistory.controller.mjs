import WasteBankCustomer from '../models/wasteBankCustomer.model.mjs';
import WasteBankTransaction from '../models/wasteBankTransaction.model.mjs';
import WasteBankWithdrawal from '../models/wasteBankWithdrawal.model.mjs';
import WasteBankTransfer from '../models/wasteBankTransfer.model.mjs';

export const getMyTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { month, year, limit } = req.query;

        // 1. Find Customer Profile linked to this User
        const customer = await WasteBankCustomer.findOne({ userId });
        if (!customer) {
            return res.status(404).json({ message: 'Profil nasabah tidak ditemukan.' });
        }

        // 2. Build Query
        const query = {
            customerId: customer._id,
            status: { $ne: 'CANCELLED' }
        };

        // Filter by Date (Month/Year)
        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59); // End of month
            query.transactionDate = {
                $gte: startDate,
                $lte: endDate
            };
        }

        // 3. Fetch Transactions
        let transactionQuery = WasteBankTransaction.find(query)
            .populate({
                path: 'items.itemId',
                select: 'categoryId', // only need categoryId from item
                populate: {
                    path: 'categoryId',
                    select: 'categoryName categoryCode' // get name and code
                }
            })
            .sort({ transactionDate: -1 });

        if (limit) {
            transactionQuery = transactionQuery.limit(parseInt(limit));
        }

        const transactions = await transactionQuery;

        res.json(transactions);
    } catch (error) {
        console.error('Error fetching my transactions:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getCustomerTransactionHistory = async (req, res) => {
    try {
        const { id } = req.params; // Customer ID
        const { type, months, startDate, endDate, page = 1, limit = 20 } = req.query;

        //Verify customer exists
        const customer = await WasteBankCustomer.findById(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Nasabah tidak ditemukan'
            });
        }

        // Calculate date range
        let dateFilter = {};
        if (startDate && endDate) {
            // Custom date range
            dateFilter = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (months) {
            // Predefined month range
            const monthsNum = parseInt(months);
            const now = new Date();
            const pastDate = new Date();
            pastDate.setMonth(now.getMonth() - monthsNum);
            dateFilter = {
                $gte: pastDate,
                $lte: now
            };
        } else {
            // Default: 3 months
            const now = new Date();
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(now.getMonth() - 3);
            dateFilter = {
                $gte: threeMonthsAgo,
                $lte: now
            };
        }

        // Build aggregation pipeline for weighing transactions
        const weighingPromise = (!type || type === 'weighing' || type === 'all')
            ? WasteBankTransaction.find({
                customerId: id,
                status: { $ne: 'CANCELLED' },
                transactionDate: dateFilter
            })
                .select('transactionId transactionDate items totalWeight totalValue officer status')
                .sort({ transactionDate: -1 })
                .lean()
            : Promise.resolve([]);

        // Build query for withdrawals
        const withdrawalPromise = (!type || type === 'withdrawal' || type === 'all')
            ? WasteBankWithdrawal.find({
                customerId: id,
                status: { $in: ['APPROVED', 'COMPLETED'] },
                withdrawalDate: dateFilter
            })
                .select('withdrawalId withdrawalDate amount method status officer notes balanceBefore balanceAfter')
                .sort({ withdrawalDate: -1 })
                .lean()
            : Promise.resolve([]);

        // Build query for transfers (both sent and received)
        const transferPromise = (!type || type === 'transfer' || type === 'all')
            ? WasteBankTransfer.find({
                $or: [
                    { senderId: id },
                    { receiverId: id }
                ],
                status: 'SUCCESS',
                transferDate: dateFilter
            })
                .select('transferId transferDate senderId receiverId senderName receiverName amount notes status')
                .sort({ transferDate: -1 })
                .lean()
            : Promise.resolve([]);

        // Execute all queries in parallel
        const [weighingTxs, withdrawalTxs, transferTxs] = await Promise.all([
            weighingPromise,
            withdrawalPromise,
            transferPromise
        ]);

        // Transform and combine all transactions
        const allTransactions = [];

        // Process weighing transactions
        weighingTxs.forEach(tx => {
            allTransactions.push({
                id: tx.transactionId,
                type: 'weighing',
                date: tx.transactionDate,
                description: `Penimbangan - ${tx.items.length} item`,
                itemsDetail: tx.items.map(i => `${i.itemName} ${i.weight}kg`).join(', '),
                amount: tx.totalValue,
                weight: tx.totalWeight,
                officer: tx.officer,
                status: tx.status
            });
        });

        // Process withdrawals
        withdrawalTxs.forEach(tx => {
            allTransactions.push({
                id: tx.withdrawalId,
                type: 'withdrawal',
                date: tx.withdrawalDate,
                description: 'Penarikan Dana',
                amount: -tx.amount, // Negative for deduction
                method: tx.method,
                officer: tx.officer,
                notes: tx.notes,
                balanceBefore: tx.balanceBefore,
                balanceAfter: tx.balanceAfter,
                status: tx.status
            });
        });

        // Process transfers
        transferTxs.forEach(tx => {
            const isSender = tx.senderId.toString() === id;
            allTransactions.push({
                id: tx.transferId,
                type: 'transfer',
                subType: isSender ? 'transfer_out' : 'transfer_in',
                date: tx.transferDate,
                description: isSender
                    ? `Transfer ke ${tx.receiverName}`
                    : `Transfer dari ${tx.senderName}`,
                amount: isSender ? -tx.amount : tx.amount,
                counterparty: isSender ? tx.receiverName : tx.senderName,
                notes: tx.notes,
                status: tx.status
            });
        });

        // Sort all transactions by date (descending)
        allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calculate summary
        const summary = {
            weighing: {
                count: weighingTxs.length,
                total: weighingTxs.reduce((sum, tx) => sum + tx.totalValue, 0)
            },
            withdrawal: {
                count: withdrawalTxs.length,
                total: withdrawalTxs.reduce((sum, tx) => sum + tx.amount, 0)
            },
            transfer: {
                count: transferTxs.length,
                totalIn: transferTxs
                    .filter(tx => tx.receiverId.toString() === id)
                    .reduce((sum, tx) => sum + tx.amount, 0),
                totalOut: transferTxs
                    .filter(tx => tx.senderId.toString() === id)
                    .reduce((sum, tx) => sum + tx.amount, 0)
            }
        };

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = pageNum * limitNum;
        const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                customer: {
                    id: customer._id,
                    name: customer.name,
                    accountNumber: customer.accountNumber,
                    currentBalance: customer.balance
                },
                transactions: paginatedTransactions,
                summary,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(allTransactions.length / limitNum),
                    totalTransactions: allTransactions.length,
                    limit: limitNum
                }
            }
        });

    } catch (error) {
        console.error('Error fetching customer transaction history:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil riwayat transaksi',
            error: error.message
        });
    }
};

/**
 * Get transaction insights for a customer
 * Provides analytics and behavioral insights
 */

export const getCustomerTransactionInsights = async (req, res) => {
    try {
        const { id } = req.params;
        const { months = 3 } = req.query;

        const customer = await WasteBankCustomer.findById(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Nasabah tidak ditemukan'
            });
        }

        // Calculate date range (default 3 months)
        const monthsNum = parseInt(months);
        const now = new Date();
        const pastDate = new Date();
        pastDate.setMonth(now.getMonth() - monthsNum);

        // Fetch all transaction types
        const [weighingTxs, withdrawalTxs, transferTxs] = await Promise.all([
            WasteBankTransaction.find({
                customerId: id,
                status: { $ne: 'CANCELLED' },
                transactionDate: { $gte: pastDate, $lte: now }
            }).select('transactionDate totalValue items').lean(),

            WasteBankWithdrawal.find({
                customerId: id,
                status: { $in: ['APPROVED', 'COMPLETED'] },
                withdrawalDate: { $gte: pastDate, $lte: now }
            }).select('withdrawalDate amount').lean(),

            WasteBankTransfer.find({
                $or: [{ senderId: id }, { receiverId: id }],
                status: 'SUCCESS',
                transferDate: { $gte: pastDate, $lte: now }
            }).select('transferDate senderId receiverId amount').lean()
        ]);

        // Calculate monthly trends
        const monthlyTrends = {};
        for (let i = 0; i < monthsNum; i++) {
            const monthDate = new Date(now);
            monthDate.setMonth(now.getMonth() - i);
            const monthKey = monthDate.toISOString().slice(0, 7); // YYYY-MM
            monthlyTrends[monthKey] = {
                weighing: { count: 0, value: 0 },
                withdrawal: { count: 0, value: 0 },
                transfer: { in: 0, out: 0 }
            };
        }

        weighingTxs.forEach(tx => {
            const monthKey = new Date(tx.transactionDate).toISOString().slice(0, 7);
            if (monthlyTrends[monthKey]) {
                monthlyTrends[monthKey].weighing.count++;
                monthlyTrends[monthKey].weighing.value += tx.totalValue;
            }
        });

        withdrawalTxs.forEach(tx => {
            const monthKey = new Date(tx.withdrawalDate).toISOString().slice(0, 7);
            if (monthlyTrends[monthKey]) {
                monthlyTrends[monthKey].withdrawal.count++;
                monthlyTrends[monthKey].withdrawal.value += tx.amount;
            }
        });

        transferTxs.forEach(tx => {
            const monthKey = new Date(tx.transferDate).toISOString().slice(0, 7);
            if (monthlyTrends[monthKey]) {
                const isSender = tx.senderId.toString() === id;
                if (isSender) {
                    monthlyTrends[monthKey].transfer.out += tx.amount;
                } else {
                    monthlyTrends[monthKey].transfer.in += tx.amount;
                }
            }
        });

        // Calculate category breakdown
        const categoryCount = {};
        weighingTxs.forEach(tx => {
            tx.items.forEach(item => {
                const category = item.categoryCode || item.itemName || 'Lainnya';
                categoryCount[category] = (categoryCount[category] || 0) + 1;
            });
        });

        const favoriteCategory = Object.keys(categoryCount).reduce((a, b) =>
            categoryCount[a] > categoryCount[b] ? a : b, 'Tidak ada data'
        );

        // Calculate averages and behaviors
        const avgWeighingValue = weighingTxs.length > 0
            ? weighingTxs.reduce((sum, tx) => sum + tx.totalValue, 0) / weighingTxs.length
            : 0;

        const avgWithdrawalValue = withdrawalTxs.length > 0
            ? withdrawalTxs.reduce((sum, tx) => sum + tx.amount, 0) / withdrawalTxs.length
            : 0;

        const totalTransactions = weighingTxs.length + withdrawalTxs.length + transferTxs.length;
        const avgPerMonth = totalTransactions / monthsNum;

        // Determine behavior status
        let behavior = 'Pasif';
        if (avgPerMonth >= 4) behavior = 'Sangat Aktif';
        else if (avgPerMonth >= 2) behavior = 'Aktif';
        else if (avgPerMonth >= 1) behavior = 'Cukup Aktif';

        const totalDeposits = weighingTxs.reduce((sum, tx) => sum + tx.totalValue, 0);
        const totalWithdrawals = withdrawalTxs.reduce((sum, tx) => sum + tx.amount, 0);
        const savingsBehavior = totalDeposits > totalWithdrawals ? 'Sering Menabung' : 'Sering Menarik';

        // Calculate balance trend (simple calculation)
        const oldestBalance = customer.balance - totalDeposits + totalWithdrawals;
        const balanceChange = customer.balance - oldestBalance;
        const balanceChangePercent = oldestBalance > 0 ? ((balanceChange / oldestBalance) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            data: {
                averages: {
                    weighingValue: avgWeighingValue,
                    withdrawalValue: avgWithdrawalValue,
                    transactionsPerMonth: avgPerMonth.toFixed(1)
                },
                monthlyTrends: Object.keys(monthlyTrends).reverse().map(month => ({
                    month,
                    ...monthlyTrends[month]
                })),
                insights: {
                    status: behavior,
                    savingsBehavior,
                    favoriteCategory,
                    balanceTrend: balanceChange > 0 ?
                        `Naik ${balanceChangePercent}% (${monthsNum} bulan terakhir)` :
                        `Turun ${Math.abs(balanceChangePercent)}% (${monthsNum} bulan terakhir)`,
                    totalTransactions
                }
            }
        });

    } catch (error) {
        console.error('Error fetching customer insights:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil insight transaksi',
            error: error.message
        });
    }
};

// ============================================
// TRANSFER SECURITY: RECIPIENT LOOKUP
// ============================================

/**
 * Lookup recipient by account number OR name
 * Used in transfer flow to verify recipient before submission
 * Query param: ?q=... (can be name or account number)
 */
