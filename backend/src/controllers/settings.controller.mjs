import WasteBankCustomer from '../models/wasteBankCustomer.model.mjs';
import WasteBankItem from '../models/wasteBankItem.model.mjs';
import WasteBankTransaction from '../models/wasteBankTransaction.model.mjs';
import WasteBankWithdrawal from '../models/wasteBankWithdrawal.model.mjs';
import WasteBankSetting from '../models/wasteBankSetting.model.mjs';
import { getBrandingSettings } from '../services/branding.service.mjs';

export const closingBook = async (req, res) => {
    try {
        const { year } = req.body; // Tahun yang akan ditutup (misal 2025)
        if (!year) return res.status(400).json({ success: false, message: "Tahun tutup buku harus diisi" });

        const closeYear = parseInt(year);
        const nextYear = closeYear + 1; // Saldo Awal di set ke tahun 2026
        const closingDate = new Date(`${closeYear}-12-31T23:59:59.999Z`);
        const openingDate = new Date(`${nextYear}-01-01T00:00:00.000Z`);

        // 1. Ensure "Saldo Awal" Item exists
        let saldoItem = await WasteBankItem.findOne({ name: 'Saldo Awal' });
        if (!saldoItem) {
            saldoItem = await new WasteBankItem({
                code: 'SYS-BAL',
                name: 'Saldo Awal',
                purchasePrice: 1,
                sellPrice: 1,
                categoryCode: 'SYS',
                unit: 'kg',
                image: 'system.png'
            }).save();
        }

        // 2. Get active customers
        const customers = await WasteBankCustomer.find({ isActive: true });
        let processedCount = 0;

        for (const customer of customers) {
            // Check if already closed
            const existing = await WasteBankTransaction.findOne({
                customerId: customer._id,
                type: 'OPENING_BALANCE',
                periode: `${nextYear}-01`
            });

            if (existing) continue;

            // 3. Calculate "Snapshot Balance" up to End of closeYear
            // Balance = (Sum Deposits <= closingDate) - (Sum Withdrawals <= closingDate)

            // Sum Deposits (Completed)
            const deposits = await WasteBankTransaction.aggregate([
                {
                    $match: {
                        customerId: customer._id,
                        status: 'COMPLETED',
                        transactionDate: { $lte: closingDate },
                        type: { $ne: 'OPENING_BALANCE' } // Don't sum previous opening balances if we are re-calculating from scratch?
                        // Actually, if we use "All History", we should EXCLUDE previous Opening Balances to avoid double counting?
                        // NO. If we ran closing for 2024, we have "Opening 2025".
                        // Logic A: Sum All Transactions (Regular) - All Withdrawals.
                        // Logic B: Take last Opening Balance + Transactions since then.
                        // Logic A is safer (re-calculatable). So we EXCLUDE 'OPENING_BALANCE' type and sum only REGULAR.
                    }
                },
                { $group: { _id: null, total: { $sum: "$totalValue" } } }
            ]);
            const totalDeposit = deposits.length > 0 ? deposits[0].total : 0;

            // Sum Withdrawals (Completed/Approved)
            const withdrawals = await WasteBankWithdrawal.aggregate([
                {
                    $match: {
                        customerId: customer._id,
                        status: { $in: ['COMPLETED', 'APPROVED'] },
                        createdAt: { $lte: closingDate }
                    }
                },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            const totalWithdrawal = withdrawals.length > 0 ? withdrawals[0].total : 0;

            const finalBalance = totalDeposit - totalWithdrawal;

            if (finalBalance <= 0) continue;

            // 4. Create Opening Balance Transaction
            const trxIdRaw = `AWAL-${nextYear}-${customer.accountNumber}`;

            const newTrx = new WasteBankTransaction({
                transactionId: trxIdRaw,
                type: 'OPENING_BALANCE',
                transactionDate: openingDate,
                periode: `${nextYear}-01`,
                customerId: customer._id,
                customerName: customer.name,
                customerAccountNumber: customer.accountNumber,
                items: [{
                    itemId: saldoItem._id,
                    itemCode: saldoItem.code,
                    itemName: `Saldo Awal Tahun ${nextYear}`,
                    weight: 0,
                    pelapakPrice: finalBalance,
                    customerPrice: finalBalance,
                    subtotal: finalBalance
                }],
                totalWeight: 0,
                totalValue: finalBalance,
                totalProfit: 0,
                paymentMethod: 'SAVINGS',
                officer: 'SYSTEM',
                status: 'COMPLETED',
                notes: `Akumulasi saldo akhir tahun ${closeYear}`
            });

            await newTrx.save();
            processedCount++;
        }

        res.json({
            success: true,
            message: `Tutup buku tahun ${year} selesai.`,
            data: {
                processedCustomers: processedCount,
                nextYear: nextYear
            }
        });

    } catch (error) {
        console.error('Closing Book Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// DASHBOARD STATS
// ============================================

export const getSettings = async (req, res) => {
    try {
        const markupPercentage = await WasteBankSetting.getSetting('GLOBAL_MARKUP_PERCENTAGE') || 0;
        const aboutUsContent = await WasteBankSetting.getSetting('ABOUT_US_CONTENT') || '';
        const aboutUsImage = await WasteBankSetting.getSetting('ABOUT_US_IMAGE') || '';
        const defaultCollector = await WasteBankSetting.getSetting('DEFAULT_COLLECTOR') || '';
        const branding = await getBrandingSettings();

        res.json({
            success: true,
            data: {
                globalMarkupPercentage: markupPercentage,
                aboutUsContent,
                aboutUsImage,
                defaultCollector,
                ...branding,
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil pengaturan',
            error: error.message
        });
    }
};

// ============================================
// CUSTOMER TRANSACTION HISTORY & INSIGHTS
// ============================================

/**
 * Get unified transaction history for a specific customer
 * Combines: weighing, withdrawal, and transfers
 * Supports filtering by type and date range
 */

export const updateSettings = async (req, res) => {
    try {
        const {
            globalMarkupPercentage,
            aboutUsContent,
            aboutUsImage,
            defaultCollector,
            bank_name,
            bank_address,
            logo_url,
            app_short_name,
            app_tagline,
            theme_color,
        } = req.body;
        const username = req.user?.username || 'system';

        if (globalMarkupPercentage !== undefined) {
            const value = parseFloat(globalMarkupPercentage);

            if (value < 0 || value > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Markup percentage harus antara 0-100'
                });
            }

            await WasteBankSetting.setSetting(
                'GLOBAL_MARKUP_PERCENTAGE',
                value,
                username
            );
        }

        if (defaultCollector !== undefined) {
            await WasteBankSetting.setSetting(
                'DEFAULT_COLLECTOR',
                defaultCollector,
                username
            );
        }

        if (aboutUsContent !== undefined) {
            await WasteBankSetting.setSetting(
                'ABOUT_US_CONTENT',
                aboutUsContent,
                username
            );
        }

        if (aboutUsImage !== undefined) {
            await WasteBankSetting.setSetting(
                'ABOUT_US_IMAGE',
                aboutUsImage,
                username
            );
        }

        if (bank_name !== undefined) {
            await WasteBankSetting.setSetting('BANK_NAME', String(bank_name).trim(), username);
        }

        if (bank_address !== undefined) {
            await WasteBankSetting.setSetting('BANK_ADDRESS', String(bank_address).trim(), username);
        }

        if (logo_url !== undefined) {
            await WasteBankSetting.setSetting('LOGO_URL', logo_url, username);
        }

        if (app_short_name !== undefined) {
            await WasteBankSetting.setSetting('APP_SHORT_NAME', String(app_short_name).trim(), username);
        }

        if (app_tagline !== undefined) {
            await WasteBankSetting.setSetting('APP_TAGLINE', String(app_tagline).trim(), username);
        }

        if (theme_color !== undefined) {
            const color = String(theme_color).trim();
            if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
                return res.status(400).json({
                    success: false,
                    message: 'Theme color harus format hex (#RRGGBB)',
                });
            }
            await WasteBankSetting.setSetting('THEME_COLOR', color, username);
        }

        res.json({
            success: true,
            message: 'Pengaturan berhasil diupdate'
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengupdate pengaturan',
            error: error.message
        });
    }
};
