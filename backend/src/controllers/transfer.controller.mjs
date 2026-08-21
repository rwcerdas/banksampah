import WasteBankCustomer from '../models/wasteBankCustomer.model.mjs';
import WasteBankTransfer from '../models/wasteBankTransfer.model.mjs';
import User from '../models/user.model.mjs';
import bcrypt from 'bcryptjs';
import { notifyUser } from '../utils/notifyUser.mjs';

export const lookupRecipient = async (req, res) => {
    try {
        // Support both params (legacy) and query (new search)
        const query = req.query.q || req.params.accountNumber;
        const userId = req.user.id || req.user._id;

        if (!query || query.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Masukkan minimal 3 karakter'
            });
        }

        // Find sender (current user) to prevent self-lookup
        const sender = await WasteBankCustomer.findOne({ userId });
        if (!sender) {
            return res.status(404).json({
                success: false,
                message: 'Profil nasabah Anda tidak ditemukan'
            });
        }

        // Search logic: Match Account Number OR Name (regex)
        // Exclude self
        const recipients = await WasteBankCustomer.find({
            $and: [
                { _id: { $ne: sender._id } }, // Exclude self
                { isActive: true },
                {
                    $or: [
                        { accountNumber: { $regex: query, $options: 'i' } },
                        { name: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        }).select('name accountNumber').limit(5); // Limit results

        if (recipients.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Penerima tidak ditemukan'
            });
        }

        // Return list of matches
        res.json({
            success: true,
            data: recipients.map(r => ({
                name: r.name,
                accountNumber: r.accountNumber
            }))
        });

    } catch (error) {
        console.error('[LOOKUP ERROR]', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mencari rekening'
        });
    }
};

// ============================================
// TRANSFER (MANUAL COMPENSATION PATTERN)
// ============================================

export const transferBalance = async (req, res) => {
    // 1. Validate Input
    const { receiverAccountNumber, amount, notes, password } = req.body;

    // Security constants
    const MAX_TRANSFER_AMOUNT = 10_000_000; // Rp 10 juta
    const COOLDOWN_SECONDS = 10;

    // Assume req.user.id is linked to customer. We need to find the specific customer profile.
    // For now, we rely on the middleware putting the logged-in user in req.user
    // But we need to look up which WasteBankCustomer belongs to this User

    let senderId = null;
    let sender = null;

    try {
        // Find Sender (Current User)
        // If the user is logged in as 'user' role, we find their linked customer profile
        // If the user is admin performing on behalf? No, requirement says "Transfer Antar Nasabah" (Peer to Peer)

        // We need to fetch the sender's customer profile using the user ID from the token
        // Use either id or _id depending on JWT payload
        const userId = req.user.id || req.user._id;
        sender = await WasteBankCustomer.findOne({ userId });

        if (!sender) {
            return res.status(404).json({ success: false, message: 'Profil nasabah pengirim tidak ditemukan' });
        }
        senderId = sender._id;

        // ==== SECURITY CHECK 1: PASSWORD VERIFICATION ====
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password diperlukan untuk transfer' });
        }

        // Find user account for password check
        const senderUser = await User.findById(userId);
        if (!senderUser) {
            return res.status(403).json({ success: false, message: 'User tidak valid' });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, senderUser.password_hash);
        if (!isPasswordValid) {
            console.log(`[TRANSFER] Password salah untuk user ${userId}`);
            return res.status(403).json({ success: false, message: 'Password salah' });
        }
        console.log(`[TRANSFER] Password verified for ${sender.name}`);

        // ==== SECURITY CHECK 2: RATE LIMITING / COOLDOWN ====
        const recentTransfer = await WasteBankTransfer.findOne({
            senderId: sender._id,
            createdAt: { $gte: new Date(Date.now() - COOLDOWN_SECONDS * 1000) }
        });

        if (recentTransfer) {
            return res.status(429).json({
                success: false,
                message: `Tunggu ${COOLDOWN_SECONDS} detik sebelum transfer lagi`
            });
        }

        // 2. Initial Checks
        const amountNum = parseFloat(amount);
        const currentBalance = parseFloat(sender.balance);

        console.log(`[TRANSFER] User: ${sender.name} (ID: ${userId}), Bal: ${currentBalance}, Amt: ${amountNum}`);

        if (!amountNum || amountNum < 100) return res.status(400).json({ success: false, message: 'Minimal transfer Rp 100' });

        // ==== SECURITY CHECK 3: TRANSFER LIMIT ====
        if (amountNum > MAX_TRANSFER_AMOUNT) {
            return res.status(400).json({
                success: false,
                message: `Transfer melebihi batas maksimal Rp ${MAX_TRANSFER_AMOUNT.toLocaleString('id-ID')}`
            });
        }

        // Loose comparison for validation, assuming atomic update is the real guard
        if (currentBalance < amountNum) {
            return res.status(400).json({ success: false, message: `Saldo tidak mencukupi (Saldo: ${currentBalance}, Butuh: ${amountNum})` });
        }

        if (sender.accountNumber === receiverAccountNumber) {
            return res.status(400).json({ success: false, message: 'Tidak bisa transfer ke rekening sendiri' });
        }

        // 3. Find Receiver
        const receiver = await WasteBankCustomer.findOne({ accountNumber: receiverAccountNumber, isActive: true });
        if (!receiver) {
            return res.status(404).json({ success: false, message: 'Rekening tujuan tidak ditemukan' });
        }

        // --- START MANUAL COMPENSATION PATTERN (NO TRANSACTION) ---

        // STEP A: Deduct Sender
        // Try atomic update first
        let deductResult = await WasteBankCustomer.updateOne(
            { _id: sender._id, balance: { $gte: amountNum } },
            { $inc: { balance: -amountNum } }
        );
        console.log('Deduct Result (Attempt 1):', deductResult);

        // If failed but balance looked sufficient, it might be a Type Mismatch (String vs Number) in DB
        if (deductResult.modifiedCount === 0) {
            console.log('[TRANSFER] Atomic update failed. Checking for type mismatch repair...');

            // Check fresh balance
            const freshSender = await WasteBankCustomer.findById(sender._id);
            // Force clean the balance field to Number
            const cleanBalance = parseFloat(freshSender.balance);

            if (cleanBalance >= amountNum) {
                console.log(`[TRANSFER] Repairing balance for ${freshSender.name} (Converting ${freshSender.balance} -> ${cleanBalance})`);

                // FIX TYPE: Set balance explicitly to the parsed number
                await WasteBankCustomer.updateOne({ _id: sender._id }, { $set: { balance: cleanBalance } });

                // Retry Deduction
                deductResult = await WasteBankCustomer.updateOne(
                    { _id: sender._id, balance: { $gte: amountNum } },
                    { $inc: { balance: -amountNum } }
                );
                console.log('Deduct Result (Attempt 2 - After Repair):', deductResult);
            }
        }

        if (deductResult.modifiedCount === 0) {
            return res.status(400).json({ success: false, message: 'Saldo tidak mencukupi (Gagal memotong saldo)' });
        }

        // STEP B: Add to Receiver
        try {
            const addResult = await WasteBankCustomer.updateOne(
                { _id: receiver._id },
                { $inc: { balance: amountNum } } // FIX: Use amountNum (Number) instead of amount (String/Mixed)
            );

            if (addResult.modifiedCount === 0) {
                throw new Error('Gagal menambah saldo penerima');
            }

            // STEP C: Log Success Transfer
            const transferLog = await WasteBankTransfer.create({
                senderId: sender._id,
                senderName: sender.name,
                senderAccountNumber: sender.accountNumber,
                receiverId: receiver._id,
                receiverName: receiver.name,
                receiverAccountNumber: receiver.accountNumber,
                amount: amountNum, // FIX: Ensure number is stored
                notes: notes,
                status: 'SUCCESS'
            });

            // 🔔 NOTIFICATIONS
            console.log(`[TRANSFER DEBUG] Receiver UserId: ${receiver.userId}, Sender UserId: ${sender.userId}`);

            // To Receiver
            if (receiver.userId) {
                console.log(`[TRANSFER] Sending notification to RECEIVER ${receiver.userId}`);
                await notifyUser({
                    userId: receiver.userId,
                    type: 'transfer_in',
                    entity: 'WasteBankTransfer',
                    entityId: transferLog._id,
                    message: `Anda menerima Rp ${Number(amount).toLocaleString('id-ID')} dari ${sender.name}`
                });
            } else {
                console.warn(`[TRANSFER] SKIPPED receiver notification - no userId found for ${receiver.name}`);
            }

            // To Sender
            if (sender.userId) {
                console.log(`[TRANSFER] Sending notification to SENDER ${sender.userId}`);
                await notifyUser({
                    userId: sender.userId,
                    type: 'transfer_out',
                    entity: 'WasteBankTransfer',
                    entityId: transferLog._id,
                    message: `Transfer berhasil Rp ${Number(amount).toLocaleString('id-ID')} ke ${receiver.name}`
                });
            } else {
                console.warn(`[TRANSFER] SKIPPED sender notification - no userId found for ${sender.name}`);
            }

            return res.json({
                success: true,
                message: 'Transfer berhasil',
                data: {
                    amount: amount,
                    receiverName: receiver.name,
                    balanceBefore: sender.balance,
                    balanceAfter: sender.balance - amount, // Approximation
                    transaction: transferLog // 🔹 Include transaction data for receipt
                }
            });

        } catch (error) {
            console.error('[TRANSFER ERROR] Step B Failed. Initiating Refund...', error);

            // STEP D: COMPENSATION (REFUND)
            // If adding to receiver failed, we MUST give money back to sender
            await WasteBankCustomer.updateOne(
                { _id: sender._id },
                { $inc: { balance: amount } }
            );

            // Log Failed Transfer
            await WasteBankTransfer.create({
                senderId: sender._id,
                senderName: sender.name,
                senderAccountNumber: sender.accountNumber,
                receiverId: receiver._id,
                receiverName: receiver.name,
                receiverAccountNumber: receiver.accountNumber,
                amount: amount,
                notes: notes,
                status: 'FAILED',
                errorMessage: 'System Error during credit phase. Auto-refunded.'
            });

            return res.status(500).json({
                success: false,
                message: 'Transfer gagal. Saldo Anda telah dikembalikan.',
                error: 'Transaction failed and rolled back'
            });
        }

    } catch (error) {
        console.error('Transfer Error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem', error: error.message });
    }
};

export const getMyTransferHistory = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const customer = await WasteBankCustomer.findOne({ userId });
        if (!customer) return res.status(404).json({ success: false, message: 'Profil tidak ditemukan' });

        const history = await WasteBankTransfer.find({
            $or: [{ senderId: customer._id }, { receiverId: customer._id }]
        }).sort({ transferDate: -1 }).limit(50);

        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil riwayat', error: error.message });
    }
};

export const getAllTransfers = async (req, res) => { // For Admin
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        // SECURITY CHECK
        if (req.user?.role === 'nasabah') {
            const userId = req.user.id || req.user._id;
            const customer = await WasteBankCustomer.findOne({ userId });
            if (!customer) return res.status(403).json({ success: false, message: 'Akses Ditolak' });

            // Force filter to own transfers only
            query.$or = [{ senderId: customer._id }, { receiverId: customer._id }];
        }

        if (startDate && endDate) {
            query.transferDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const transfers = await WasteBankTransfer.find(query)
            .sort({ transferDate: -1 })
            .limit(100);

        res.json({ success: true, data: transfers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil data tranfer', error: error.message });
    }
};
