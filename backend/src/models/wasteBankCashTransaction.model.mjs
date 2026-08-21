
import mongoose from 'mongoose';

const WasteBankCashTransactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['IN', 'OUT'],
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'Subsidi DLH',
            'Penjualan Sampah',
            'Donasi',
            'Lainnya (Masuk)',
            'Pembelian Sampah', // Operasional rutin (opsional jika dipisah)
            'Konsumsi',
            'Transportasi',
            'Maintenance Alat',
            'ATK',
            'Penyusutan / Selisih Timbangan',
            'Lainnya (Keluar)'
        ]
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    // Audit Trail: Balance after this specific transaction
    balance_after: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        default: Date.now
    },
    proof_url: {
        type: String, // URL to uploaded photo/receipt
        default: null
    },
    performed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now,
        immutable: true
    }
});

// Index for quick filtering by date and type
WasteBankCashTransactionSchema.index({ date: -1 });
WasteBankCashTransactionSchema.index({ type: 1 });

export default mongoose.model('WasteBankCashTransaction', WasteBankCashTransactionSchema);
