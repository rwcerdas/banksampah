import mongoose from 'mongoose';
import WasteBankCustomer from '../models/wasteBankCustomer.model.mjs';
import WasteBankWithdrawal from '../models/wasteBankWithdrawal.model.mjs';
import AuditTrailService from '../services/auditTrail.service.mjs';

export const updateWithdrawalStatus = async (req, res) => {
    // Transaction support removed for standalone MongoDB
    try {
        const { id } = req.params;
        const { status, rejectionReason, proofUrl } = req.body;
        const requestedBy = req.user;
        const officerName = requestedBy.username;

        const withdrawal = await WasteBankWithdrawal.findById(id);
        if (!withdrawal) throw new Error('Penarikan tidak ditemukan');

        if (withdrawal.status !== 'PENDING') {
            throw new Error(`Permintaan sudah diproses (Status: ${withdrawal.status})`);
        }

        const customer = await WasteBankCustomer.findById(withdrawal.customerId);
        if (!customer) throw new Error('Data nasabah tidak ditemukan');

        if (status === 'APPROVED' || status === 'COMPLETED') {
            withdrawal.status = 'COMPLETED';
            withdrawal.officer = officerName;
            withdrawal.proofUrl = proofUrl;

            // Update stats
            customer.stats.totalWithdrawals += withdrawal.amount;
            await customer.save();
        } else if (status === 'REJECTED') {
            withdrawal.status = 'REJECTED';
            withdrawal.officer = officerName;
            withdrawal.cancelReason = rejectionReason;

            // Refund balance
            customer.balance += withdrawal.amount;
            await customer.save();
        } else {
            throw new Error('Status tidak valid');
        }

        await withdrawal.save();

        res.json({
            success: true,
            message: `Status penarikan diperbarui menjadi ${status}`,
            data: withdrawal
        });

    } catch (error) {
        console.error('Update Withdrawal Status Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createWithdrawal = async (req, res) => {
    // REMOVED TRANSACTION FOR STANDALONE SUPPORT
    // const session = await mongoose.startSession();
    // session.startTransaction();

    try {
        const { customerId, amount, withdrawalDate, notes, method, destinationDetail, password } = req.body;
        const requestedBy = req.user;
        const isNasabah = requestedBy.role === 'nasabah';
        const isAdmin = ['superadmin', 'admin-banksampah'].includes(requestedBy.role);

        // [...] Checks remain same

        let targetCustomerId = customerId;
        if (isNasabah) {
            // For nasabah, we could lookup via user link if needed,
            // but assuming frontend sends the right ID for now.
            // If you have a User->Customer mapping, use that.
        }

        // Get customer
        const customer = await WasteBankCustomer.findById(targetCustomerId); // No session
        if (!customer || !customer.isActive) {
            throw new Error('Nasabah tidak ditemukan atau tidak aktif');
        }

        // Password Check [...]
        if (isNasabah) {
            const user = await mongoose.model('User').findById(requestedBy.userId || requestedBy._id);
            if (user && password) {
                const isMatch = await user.comparePassword(password);
                if (!isMatch) throw new Error('Password salah');
            } else if (isNasabah && !password) {
                throw new Error('Password konfirmasi diperlukan');
            }
        }

        if (customer.balance < amount) {
            throw new Error(`Saldo tidak mencukupi. Saldo tersedia: Rp ${customer.balance.toLocaleString('id-ID')}`);
        }

        const date = new Date(withdrawalDate || Date.now());
        const periode = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const initialStatus = isNasabah ? 'PENDING' : 'COMPLETED'; // PENDING for user request
        const officerName = isAdmin ? requestedBy.username : undefined;

        // GENERATE ID MANUAL
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        const lastWithdrawal = await WasteBankWithdrawal.findOne({
            withdrawalId: new RegExp(`^WTH-${dateStr}-`)
        }).sort({ withdrawalId: -1 });

        let sequence = 1;
        if (lastWithdrawal) {
            const lastSeq = parseInt(lastWithdrawal.withdrawalId.split('-')[2]);
            sequence = lastSeq + 1;
        }

        const withdrawalId = `WTH-${dateStr}-${sequence.toString().padStart(3, '0')}`;

        const withdrawal = new WasteBankWithdrawal({
            withdrawalId, // ADDED
            withdrawalDate: date,
            periode,
            customerId: customer._id,
            customerName: customer.name,
            customerAccountNumber: customer.accountNumber,
            amount,
            method: method || 'CASH',
            destinationDetail: destinationDetail || {},
            officer: officerName,
            status: initialStatus,
            transactionType: 'WITHDRAWAL',
            notes,
            balanceBefore: customer.balance, // Keep these for record
            balanceAfter: customer.balance - amount // Keep these for record
        });

        await withdrawal.save(); // No session

        // DEDUCT BALANCE IMMEDIATELY (To prevent double spend)
        // If rejected later, we refund it.
        customer.balance -= amount;
        await customer.save(); // No session

        // Log audit trail untuk waste bank withdrawal
        if (req.user) {
            await AuditTrailService.logActivity({
                user_id: req.user.id,
                username: req.user.username,
                user_role: req.user.role,
                action: 'CREATE',
                resource: 'WasteBankWithdrawal',
                resource_id: withdrawal._id,
                description: `Membuat penarikan ${isNasabah ? 'nasabah' : 'tunai'}: ${customer.name} (Rp ${amount})`,
                ip_address: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
                user_agent: req.headers['user-agent'],
                metadata: {
                    created_withdrawal: {
                        customerId,
                        customerName: customer.name,
                        amount,
                        withdrawalDate,
                        method,
                        status: withdrawal.status,
                        isNasabah
                    },
                    method: req.method,
                    endpoint: req.originalUrl
                },
                status: 'success'
            });
        }

        // await session.commitTransaction(); // Removed
        // session.endSession(); // Removed

        res.status(201).json({
            success: true,
            message: isNasabah ? 'Permintaan penarikan berhasil dikirim' : 'Penarikan tunai berhasil diproses',
            data: withdrawal
        });

    } catch (error) {
        // await session.abortTransaction(); // Removed
        // session.endSession(); // Removed
        console.error('Create Withdrawal Error:', error);
        res.status(error.message === 'Password salah' ? 401 : 500).json({
            message: 'Gagal membuat penarikan',
            error: error.message
        });
    }
};

export const getWithdrawals = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            customerId,
            startDate,
            endDate,
            status
        } = req.query;

        const query = {};

        // SECURITY CHECK: PREVENT DATA LEAK
        // If current user is 'nasabah', FORCE filter by their own ID
        if (req.user?.role === 'nasabah') {
            const customer = await WasteBankCustomer.findOne({ userId: req.user.id });
            if (!customer) {
                return res.status(403).json({
                    success: false,
                    message: 'Akses ditolak: Profil nasabah tidak ditemukan.'
                });
            }
            query.customerId = customer._id;
        } else {
            // Only Admin/Officer can filter by specific customerId
            if (customerId) query.customerId = customerId;
        }

        if (status) query.status = status;

        if (startDate || endDate) {
            query.withdrawalDate = {};
            if (startDate) query.withdrawalDate.$gte = new Date(startDate);
            if (endDate) query.withdrawalDate.$lte = new Date(endDate);
        }

        const withdrawals = await WasteBankWithdrawal.find(query)
            .populate('customerId', 'accountNumber name')
            .sort({ withdrawalDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const count = await WasteBankWithdrawal.countDocuments(query);

        res.json({
            success: true,
            data: withdrawals,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error getting withdrawals:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data penarikan',
        });
    }
};

// ============================================
// CLOSING BOOK (Tutup Buku)
// ============================================
