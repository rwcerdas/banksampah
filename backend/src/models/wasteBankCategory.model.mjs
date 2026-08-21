import mongoose from 'mongoose';

const wasteBankCategorySchema = new mongoose.Schema({
    categoryCode: {
        type: String,
        required: [true, 'Kode kategori harus diisi'],
        unique: true,
        trim: true,
    },
    categoryName: {
        type: String,
        required: [true, 'Nama kategori harus diisi'],
        trim: true,
    },
    description: {
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
    collection: 'waste_bank_categories',
});

// Index
wasteBankCategorySchema.index({ categoryCode: 1 });
wasteBankCategorySchema.index({ isActive: 1 });

export default mongoose.model('WasteBankCategory', wasteBankCategorySchema);
