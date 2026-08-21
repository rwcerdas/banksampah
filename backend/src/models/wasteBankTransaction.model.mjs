import mongoose from 'mongoose';

const transactionItemSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WasteBankItem',
        required: true,
    },
    itemCode: {
        type: String,
        required: true,
    },
    itemName: {
        type: String,
        required: true,
    },
    categoryCode: {
        type: String,
    },
    weight: {
        type: Number,
        required: [true, 'Berat harus diisi'],
        min: [0.01, 'Berat minimal 0.01 Kg'],
    },
    pelapakPrice: {
        type: Number,
        required: true,
    },
    // Harga pengepul yang dipakai saat transaksi (null = pakai pelapakPrice default)
    collectorPrice: {
        type: Number,
        default: null,
    },
    customerPrice: {
        type: Number,
        required: true,
    },
    subtotal: {
        type: Number,
        required: true,
    },
}, { _id: false });

const wasteBankTransactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        unique: true,
    },
    type: {
        type: String,
        enum: ['REGULAR', 'OPENING_BALANCE'],
        default: 'REGULAR',
        index: true
    },
    transactionDate: {
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
    items: [transactionItemSchema],
    totalWeight: {
        type: Number,
        required: true,
        min: 0,
    },
    totalValue: {
        type: Number,
        required: true,
        min: 0,
    },
    totalProfit: {
        type: Number,
        default: 0,
        min: 0,
    },
    paymentMethod: {
        type: String,
        enum: ['CASH', 'SAVINGS'],
        required: [true, 'Metode pembayaran harus dipilih'],
    },
    photoUrl: {
        type: String,
    },
    notes: {
        type: String,
        maxlength: [500, 'Catatan maksimal 500 karakter'],
    },
    officer: {
        type: String,
        required: true,
    },
    // Legacy: nama pengepul sebagai string bebas (backward compat data lama)
    collector: {
        type: String,
        trim: true,
        default: null,
    },
    // Terstruktur: referensi ke WasteBankCollector master data
    collectorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WasteBankCollector',
        default: null,
        index: true,
    },
    // Snapshot nama pengepul saat transaksi (agar laporan tidak rusak jika pengepul dihapus)
    collectorName: {
        type: String,
        trim: true,
        default: null,
    },
    status: {
        type: String,
        enum: ['COMPLETED', 'CANCELLED', 'VOIDED'],
        default: 'COMPLETED',
        index: true,
    },
    voidReason: {
        type: String,
        default: null
    },
    voidedAt: {
        type: Date,
        default: null
    },
    voidedBy: {
        type: String,
        default: null
    },
    markupPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
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
    collection: 'waste_bank_transactions',
});

// Indexes
wasteBankTransactionSchema.index({ transactionDate: -1 });
wasteBankTransactionSchema.index({ customerId: 1, transactionDate: -1 });
wasteBankTransactionSchema.index({ periode: 1 });
wasteBankTransactionSchema.index({ status: 1 });

// Auto-generate transaction ID before save
wasteBankTransactionSchema.pre('save', async function (next) {
    if (this.isNew && !this.transactionId) {
        const date = new Date(this.transactionDate);
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

        // Find last transaction of the day
        const lastTransaction = await mongoose.model('WasteBankTransaction')
            .findOne({
                transactionId: new RegExp(`^TRX-${dateStr}-`)
            })
            .sort({ transactionId: -1 });

        let sequence = 1;
        if (lastTransaction) {
            const lastSeq = parseInt(lastTransaction.transactionId.split('-')[2]);
            sequence = lastSeq + 1;
        }

        this.transactionId = `TRX-${dateStr}-${sequence.toString().padStart(3, '0')}`;
    }
    next();
});

export default mongoose.model('WasteBankTransaction', wasteBankTransactionSchema);
