import mongoose from 'mongoose';

/**
 * WasteBankCollector — Master data pengepul (waste collector/buyer)
 * 
 * Setiap pengepul bisa memiliki harga yang berbeda untuk item sampah tertentu.
 * Harga per pengepul disimpan di WasteBankItem.collectorPrices[]
 */
const wasteBankCollectorSchema = new mongoose.Schema({
    collectorCode: {
        type: String,
        required: [true, 'Kode pengepul harus diisi'],
        unique: true,
        trim: true,
        uppercase: true,
    },
    collectorName: {
        type: String,
        required: [true, 'Nama pengepul harus diisi'],
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    notes: {
        type: String,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: String,
    },
}, {
    timestamps: true,
    collection: 'waste_bank_collectors',
});

// Indexes
wasteBankCollectorSchema.index({ collectorCode: 1 });
wasteBankCollectorSchema.index({ isActive: 1 });
wasteBankCollectorSchema.index({ collectorName: 'text' });

export default mongoose.model('WasteBankCollector', wasteBankCollectorSchema);
