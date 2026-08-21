import WasteBankTransaction from '../models/wasteBankTransaction.model.mjs';

export const getMonthlyReport = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Parameter month dan year wajib diisi'
            });
        }

        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

        // Get all transactions
        const transactions = await WasteBankTransaction.find({
            transactionDate: { $gte: startDate, $lte: endDate },
            status: 'COMPLETED'
        })
            .populate('customerId', 'accountNumber name')
            .sort({ transactionDate: -1 })
            .lean();

        // Get all withdrawals
        const withdrawals = await WasteBankWithdrawal.find({
            withdrawalDate: { $gte: startDate, $lte: endDate },
            status: 'COMPLETED'
        })
            .populate('customerId', 'accountNumber name')
            .sort({ withdrawalDate: -1 })
            .lean();

        // Summary
        const summary = {
            totalTransactions: transactions.length,
            totalWithdrawals: withdrawals.length,
            totalWeight: transactions.reduce((sum, t) => sum + t.totalWeight, 0),
            totalValue: transactions.reduce((sum, t) => sum + t.totalValue, 0),
            totalProfit: transactions.reduce((sum, t) => sum + t.totalProfit, 0),
            totalWithdrawalAmount: withdrawals.reduce((sum, w) => sum + w.amount, 0),
            cashTransactions: transactions.filter(t => t.paymentMethod === 'CASH').length,
            savingsTransactions: transactions.filter(t => t.paymentMethod === 'SAVINGS').length
        };

        res.json({
            success: true,
            data: {
                period: {
                    month: monthNum,
                    year: yearNum,
                    monthName: startDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
                },
                summary,
                transactions,
                withdrawals
            }
        });
    } catch (error) {
        console.error('Error getting monthly report:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil laporan bulanan',
            error: error.message
        });
    }
};

// ============================================
// SETTINGS
// ============================================
