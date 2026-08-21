import mongoose from 'mongoose';

// Shared sub-schema untuk riwayat perubahan harga
const priceHistorySchema = new mongoose.Schema({
    price: {
        type: Number,
        required: true,
    },
    effectiveDate: {
        type: Date,
        default: Date.now,
    },
    updatedBy: {
        type: String,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

// Sub-schema untuk harga per pengepul
const collectorPriceSchema = new mongoose.Schema({
    collectorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WasteBankCollector',
        required: true,
    },
    collectorName: {
        type: String,
        required: true,  // Snapshot nama pengepul saat harga diset
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Harga tidak boleh negatif'],
    },
    // Histori perubahan harga untuk pengepul ini
    priceHistory: [priceHistorySchema],
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    updatedBy: {
        type: String,
    },
}, { _id: false });

const wasteBankItemSchema = new mongoose.Schema({
    itemCode: {
        type: String,
        required: [true, 'Kode barang harus diisi'],
        unique: true,
        trim: true,
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WasteBankCategory',
        required: [true, 'Kategori harus dipilih'],
    },
    itemName: {
        type: String,
        required: [true, 'Nama barang harus diisi'],
        trim: true,
    },
    pelapakPrice: {
        type: Number,
        required: [true, 'Harga pelapak harus diisi'],
        min: [0, 'Harga tidak boleh negatif'],
    },
    unit: {
        type: String,
        default: 'Kg',
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // Harga default dari pelapak (fallback jika pengepul tidak punya harga khusus)
    priceHistory: [priceHistorySchema],
    // Harga khusus tiap pengepul — override pelapakPrice saat transaksi
    collectorPrices: [collectorPriceSchema],
    createdBy: {
        type: String,
    },
}, {
    timestamps: true,
    collection: 'waste_bank_items',
});

// Indexes
wasteBankItemSchema.index({ itemCode: 1 });
wasteBankItemSchema.index({ categoryId: 1, isActive: 1 });

export default mongoose.model('WasteBankItem', wasteBankItemSchema);
