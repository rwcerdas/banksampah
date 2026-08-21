import mongoose from 'mongoose';

const wasteBankTransferSchema = new mongoose.Schema({
    transferId: {
        type: String,
        unique: true,
    },
    transferDate: {
        type: Date,
        default: Date.now,
        index: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WasteBankCustomer',
        required: [true, 'Pengirim harus diisi'],
        index: true,
    },
    senderName: {
        type: String,
        required: true
    },
    senderAccountNumber: {
        type: String,
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WasteBankCustomer',
        required: [true, 'Penerima harus diisi'],
        index: true,
    },
    receiverName: {
        type: String,
        required: true
    },
    receiverAccountNumber: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Jumlah transfer harus diisi'],
        min: [1, 'Jumlah transfer minimal Rp 1'],
    },
    notes: {
        type: String,
        maxlength: [200, 'Catatan maksimal 200 karakter'],
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED'],
        default: 'SUCCESS',
        index: true,
    },
    errorMessage: {
        type: String
    }
}, {
    timestamps: true,
    collection: 'waste_bank_transfers',
});

// Indexes
wasteBankTransferSchema.index({ transferDate: -1 });
wasteBankTransferSchema.index({ senderId: 1, transferDate: -1 });
wasteBankTransferSchema.index({ receiverId: 1, transferDate: -1 });

// Auto-generate ID: TRF-YYYYMMDD-XXX
wasteBankTransferSchema.pre('save', async function (next) {
    if (this.isNew && !this.transferId) {
        const date = new Date(this.transferDate);
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

        const lastTransfer = await mongoose.model('WasteBankTransfer')
            .findOne({
                transferId: new RegExp(`^TRF-${dateStr}-`)
            })
            .sort({ transferId: -1 });

        let sequence = 1;
        if (lastTransfer) {
            const parts = lastTransfer.transferId.split('-');
            if (parts.length === 3) {
                sequence = parseInt(parts[2]) + 1;
            }
        }

        this.transferId = `TRF-${dateStr}-${sequence.toString().padStart(3, '0')}`;
    }
    next();
});

export default mongoose.model('WasteBankTransfer', wasteBankTransferSchema);
