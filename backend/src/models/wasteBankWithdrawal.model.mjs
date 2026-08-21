import mongoose from 'mongoose';

const wasteBankWithdrawalSchema = new mongoose.Schema({
    withdrawalId: {
        type: String,
        required: true,
        unique: true,
    },
    withdrawalDate: {
        type: Date,
        required: true,
        index: true,
    },
    periode: {
        type: String, // Format: YYYY-MM
        required: true,
        index: true,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WasteBankCustomer',
        required: [true, 'Nasabah harus dipilih'],
        index: true,
    },
    customerName: {
        type: String,
        required: true,
    },
    customerAccountNumber: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: [true, 'Jumlah penarikan harus diisi'],
        min: [1, 'Jumlah penarikan minimal Rp 1'],
    },
    method: {
        type: String,
        enum: ['CASH', 'TRANSFER', 'EWALLET'],
        default: 'CASH',
        required: true
    },
    destinationDetail: {
        bankName: String, // BCA, GOPAY, DANA, etc.
        accountNumber: String,
        accountName: String
    },
    balanceBefore: {
        type: Number,
        required: true,
    },
    balanceAfter: {
        type: Number,
        required: true,
    },
    officer: {
        type: String, // Optional now (system/admin username)
    },
    notes: {
        type: String,
        maxlength: [500, 'Catatan maksimal 500 karakter'],
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING', // Changed default to PENDING for requests
    },
    proofUrl: {
        type: String, // For Admin to upload transfer proof
    },
    cancelledAt: {
        type: Date,
    },
    cancelledBy: {
        type: String,
    },
    cancelReason: {
        type: String,
    },
}, {
    timestamps: true,
    collection: 'waste_bank_withdrawals',
});

// Indexes
wasteBankWithdrawalSchema.index({ withdrawalDate: -1 });
wasteBankWithdrawalSchema.index({ customerId: 1, withdrawalDate: -1 });
wasteBankWithdrawalSchema.index({ periode: 1 });

// Auto-generate withdrawal ID before save
wasteBankWithdrawalSchema.pre('save', async function (next) {
    if (this.isNew && !this.withdrawalId) {
        const date = new Date(this.withdrawalDate);
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

        // Find last withdrawal of the day
        const lastWithdrawal = await mongoose.model('WasteBankWithdrawal')
            .findOne({
                withdrawalId: new RegExp(`^WTH-${dateStr}-`)
            })
            .sort({ withdrawalId: -1 });

        let sequence = 1;
        if (lastWithdrawal) {
            const lastSeq = parseInt(lastWithdrawal.withdrawalId.split('-')[2]);
            sequence = lastSeq + 1;
        }

        this.withdrawalId = `WTH-${dateStr}-${sequence.toString().padStart(3, '0')}`;
    }
    next();
});

export default mongoose.model('WasteBankWithdrawal', wasteBankWithdrawalSchema);
