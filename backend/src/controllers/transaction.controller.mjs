import mongoose from 'mongoose';
import WasteBankCustomer from '../models/wasteBankCustomer.model.mjs';
import WasteBankItem from '../models/wasteBankItem.model.mjs';
import WasteBankTransaction from '../models/wasteBankTransaction.model.mjs';
import WasteBankSetting from '../models/wasteBankSetting.model.mjs';
import WasteBankCollector from '../models/wasteBankCollector.model.mjs';
import AuditTrailService from '../services/auditTrail.service.mjs';

export const createTransaction = async (req, res) => {
    try {
        const {
            customerId,
            transactionDate,
            items,
            paymentMethod,
            collectorId,   // ID pengepul terstruktur (baru)
            collector,     // Nama string bebas (legacy fallback)
            notes
        } = req.body;

        console.log('🔍 [createTransaction] Received customerId:', customerId);

        // Get customer
        const customer = await WasteBankCustomer.findById(customerId);
        console.log('📦 [createTransaction] Customer lookup result:', customer ? {
            _id: customer._id,
            name: customer.name,
            isActive: customer.isActive
        } : 'NOT FOUND');

        if (!customer || !customer.isActive) {
            const errorMsg = !customer
                ? `Customer dengan ID ${customerId} tidak ditemukan di collection WasteBankCustomer`
                : `Customer ${customer.name} tidak aktif (isActive: false)`;
            console.error('❌ [createTransaction]', errorMsg);
            throw new Error('Nasabah tidak ditemukan atau tidak aktif');
        }

        // Get global markup (default 15 if not set)
        const markupSetting = await WasteBankSetting.getSetting('GLOBAL_MARKUP_PERCENTAGE');
        const markupPercentage = typeof markupSetting === 'number' ? markupSetting : 15;

        // Resolve pengepul: coba dari collectorId terstruktur, kemudian fallback ke string/setting
        let resolvedCollectorId = null;
        let resolvedCollectorName = null;
        let collectorDoc = null;

        if (collectorId) {
            collectorDoc = await WasteBankCollector.findById(collectorId);
            if (collectorDoc) {
                resolvedCollectorId = collectorDoc._id;
                resolvedCollectorName = collectorDoc.collectorName;
            }
        }

        // Fallback ke nama string bebas atau setting default (backward compat)
        if (!resolvedCollectorName) {
            resolvedCollectorName = collector?.trim() || null;
            if (!resolvedCollectorName) {
                const collectorSetting = await WasteBankSetting.getSetting('COLLECTOR_NAME');
                resolvedCollectorName = collectorSetting || null;
            }
        }

        // Process items
        const processedItems = [];
        let totalWeight = 0;
        let totalValue = 0;
        let totalProfit = 0;

        for (const itemData of items) {
            const item = await WasteBankItem.findById(itemData.itemId).populate('categoryId');
            if (!item) {
                throw new Error(`Item dengan ID ${itemData.itemId} tidak ditemukan`);
            }

            const weight = parseFloat(itemData.weight);
            // 🛡️ Tolak berat tidak valid / negatif / nol agar tidak memanipulasi saldo & profit
            if (!Number.isFinite(weight) || weight <= 0) {
                throw new Error(`Berat item tidak valid (harus angka positif): ${itemData.weight}`);
            }

            // Cek apakah ada harga khusus untuk pengepul yang dipilih
            let collectorPrice = null;
            if (resolvedCollectorId) {
                const cp = (item.collectorPrices || []).find(
                    p => p.collectorId?.toString() === resolvedCollectorId.toString()
                );
                if (cp) collectorPrice = cp.price;
            }

            // Harga efektif: pakai harga pengepul jika ada, atau fallback ke pelapakPrice
            const effectivePrice = collectorPrice !== null ? collectorPrice : item.pelapakPrice;

            const profitPerKg = effectivePrice * (markupPercentage / 100);
            const customerPrice = effectivePrice - profitPerKg;

            const subtotal = Math.round(customerPrice * weight);
            const profit = Math.round(profitPerKg * weight);

            processedItems.push({
                itemId: item._id,
                itemCode: item.itemCode,
                itemName: item.itemName,
                categoryCode: item.categoryId ? item.categoryId.categoryName : 'Unknown',
                weight,
                pelapakPrice: effectivePrice,   // Harga efektif yang dipakai (bisa harga pengepul)
                collectorPrice,                 // Null jika pakai harga default
                customerPrice,
                subtotal
            });

            totalWeight += weight;
            totalValue += subtotal;
            totalProfit += profit;
        }

        // Get periode (YYYY-MM)
        const date = new Date(transactionDate);
        const periode = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        // Create transaction
        const transaction = new WasteBankTransaction({
            transactionDate: date,
            periode,
            customerId: customer._id,
            customerName: customer.name,
            customerAccountNumber: customer.accountNumber,
            items: processedItems,
            totalWeight,
            totalValue,
            totalProfit,
            paymentMethod,
            collector: resolvedCollectorName,    // Backward compat string
            collectorId: resolvedCollectorId,    // Terstruktur (bisa null)
            collectorName: resolvedCollectorName,// Snapshot nama
            photoUrl: req.file ? `/uploads/waste-bank/photos/${req.file.filename}` : undefined,
            notes,
            officer: req.user?.username || 'system',
            markupPercentage,
            status: 'COMPLETED'
        });

        console.log('💾 [createTransaction] About to save transaction:');
        console.log('  - transactionDate:', transaction.transactionDate);
        console.log('  - transactionId (before save):', transaction.transactionId);
        console.log('  - isNew:', transaction.isNew);

        await transaction.save();

        console.log('✅ [createTransaction] Transaction saved successfully');
        console.log('  - transactionId (after save):', transaction.transactionId);

        // Update customer stats
        customer.stats.totalTransactions += 1;
        customer.stats.totalWeight += totalWeight;
        customer.stats.totalValue += totalValue;
        customer.lastTransactionDate = date;

        // Update balance if SAVINGS
        if (paymentMethod === 'SAVINGS') {
            customer.balance += totalValue;
        }

        await customer.save();

        // Log audit trail untuk waste bank transaction creation
        if (req.user) {
            await AuditTrailService.logActivity({
                user_id: req.user.id,
                username: req.user.username,
                user_role: req.user.role,
                action: 'CREATE',
                resource: 'WasteBank',
                resource_id: transaction._id,
                description: `Membuat transaksi bank sampah: ${customer.name} (${items.length} item, total: Rp ${totalValue})`,
                ip_address: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
                user_agent: req.headers['user-agent'],
                metadata: {
                    created_transaction: {
                        customerId,
                        customerName: customer.name,
                        transactionId: transaction.transactionId,
                        itemCount: items.length,
                        totalWeight,
                        totalValue,
                        paymentMethod,
                        transactionDate
                    },
                    method: req.method,
                    endpoint: req.originalUrl
                },
                status: 'success'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Transaksi berhasil dibuat',
            data: transaction
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal membuat transaksi',
            error: error.message
        });
    }
};

// ============================================
// VOID TRANSACTION
// ============================================

export const voidTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Alasan pembatalan (void) harus diisi' });
        }

        const transaction = await WasteBankTransaction.findById(id);
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
        }

        if (transaction.status === 'VOIDED') {
            return res.status(400).json({ success: false, message: 'Transaksi sudah berstatus batal (VOIDED)' });
        }

        // Get associated customer
        const customer = await WasteBankCustomer.findById(transaction.customerId);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Nasabah dari transaksi ini tidak ditemukan' });
        }

        // --- Revert Customer Stats and Balance ---
        // Reduce stats, do not go below 0
        customer.stats.totalTransactions = Math.max(0, customer.stats.totalTransactions - 1);
        customer.stats.totalWeight = Math.max(0, customer.stats.totalWeight - transaction.totalWeight);
        customer.stats.totalValue = Math.max(0, customer.stats.totalValue - transaction.totalValue);

        // Revert balance if payment method was SAVINGS
        if (transaction.paymentMethod === 'SAVINGS') {
            customer.balance = Math.max(0, customer.balance - transaction.totalValue);
        }

        await customer.save();

        // --- Update Transaction Status ---
        transaction.status = 'VOIDED';
        transaction.voidReason = reason.trim();
        transaction.voidedAt = new Date();
        transaction.voidedBy = req.user?.username || 'system';

        await transaction.save();

        res.status(200).json({
            success: true,
            message: 'Transaksi berhasil dibatalkan',
            data: transaction
        });
    } catch (error) {
        console.error('Error voiding transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat membatalkan transaksi',
            error: error.message
        });
    }
};

export const getTransactions = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            customerId,
            startDate,
            endDate,
            paymentMethod,
            status
        } = req.query;

        const query = {};

        if (status && status !== 'ALL') {
            query.status = status;
        } else if (!status) {
            query.status = 'COMPLETED';
        }

        // SECURITY CHECK: PREVENT DATA LEAK
        if (req.user?.role === 'nasabah') {
            const customer = await WasteBankCustomer.findOne({ userId: req.user.id });
            if (!customer) {
                return res.status(403).json({ success: false, message: 'Profil nasabah tidak ditemukan' });
            }
            query.customerId = customer._id;
        } else {
            if (customerId) query.customerId = customerId;
        }

        if (paymentMethod && paymentMethod !== 'ALL') query.paymentMethod = paymentMethod;

        if (startDate || endDate) {
            query.transactionDate = {};
            if (startDate) query.transactionDate.$gte = new Date(startDate);
            if (endDate) query.transactionDate.$lte = new Date(endDate);
        }

        const transactions = await WasteBankTransaction.find(query)
            .populate('customerId', 'name accountNumber isActive phone') // Fetch isActive and phone
            .sort({ transactionDate: -1 })
            .lean();

        // Filter out transactions from inactive customers (soft deleted)
        // Note: Using JS filter instead of query for simplicity with population
        const activeTransactions = transactions.filter(t => t.customerId && t.customerId.isActive);

        // Manual pagination after filtering
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedTransactions = activeTransactions.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: paginatedTransactions,
            pagination: {
                total: activeTransactions.length,
                page: parseInt(page),
                pages: Math.ceil(activeTransactions.length / limit)
            }
        });
    } catch (error) {
        console.error('Error getting transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data transaksi',
            error: error.message
        });
    }
};

export const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;

        // Use standard populate but careful with lean
        // Note: When using lean(), populated fields are plain objects.
        const transaction = await WasteBankTransaction.findById(id)
            .populate('customerId', 'accountNumber name')
            .populate({
                path: 'items.itemId',
                model: 'WasteBankItem',
                select: 'categoryId',
                populate: {
                    path: 'categoryId',
                    model: 'WasteBankCategory',
                    select: 'categoryName'
                }
            })
            .lean();

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaksi tidak ditemukan'
            });
        }

        // Fallback for missing categoryCode
        if (transaction.items) {
            transaction.items.forEach((item, index) => {
                // Debug log for first item
                if (index === 0) {
                    // console.log('🔍 [getTransactionById] Item 0 populate check:', {
                    //     hasItemId: !!item.itemId,
                    //     hasCategoryId: !!item.itemId?.categoryId,
                    //     categoryName: item.itemId?.categoryId?.categoryName
                    // });
                }

                if (!item.categoryCode || item.categoryCode === 'Unknown') {
                    if (item.itemId && item.itemId.categoryId && item.itemId.categoryId.categoryName) {
                        item.categoryCode = item.itemId.categoryId.categoryName;
                    } else {
                        item.categoryCode = '-'; // Fallback if really not found
                    }
                }
            });
        }

        res.json({
            success: true,
            data: transaction
        });
    } catch (error) {
        console.error('Error getting transaction detail:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil detail transaksi',
            error: error.message
        });
    }
};

export const cancelTransaction = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { cancelReason } = req.body;

        const transaction = await WasteBankTransaction.findById(id).session(session);
        if (!transaction) {
            throw new Error('Transaksi tidak ditemukan');
        }

        if (transaction.status === 'CANCELLED') {
            throw new Error('Transaksi sudah dibatalkan');
        }

        // Rollback customer stats and balance
        const customer = await WasteBankCustomer.findById(transaction.customerId).session(session);
        if (customer) {
            customer.stats.totalTransactions -= 1;
            customer.stats.totalWeight -= transaction.totalWeight;
            customer.stats.totalValue -= transaction.totalValue;

            if (transaction.paymentMethod === 'SAVINGS') {
                customer.balance -= transaction.totalValue;
                if (customer.balance < 0) customer.balance = 0;
            }

            await customer.save({ session });
        }

        // Update transaction status
        transaction.status = 'CANCELLED';
        transaction.cancelledAt = new Date();
        transaction.cancelledBy = req.user?.username || 'system';
        transaction.cancelReason = cancelReason;

        await transaction.save({ session });

        await session.commitTransaction();

        res.json({
            success: true,
            message: 'Transaksi berhasil dibatalkan'
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('Error cancelling transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal membatalkan transaksi',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};
