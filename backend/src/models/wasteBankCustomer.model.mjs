import mongoose from 'mongoose';

const wasteBankCustomerSchema = new mongoose.Schema({
    accountNumber: {
        type: String,
        required: [true, 'Nomor rekening harus diisi'],
        unique: true,
        trim: true,
        uppercase: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Link to User login
        default: null
    },
    nik: {
        type: String, // Link to Citizen Data (One Data)
        sparse: true, // Allow null/unique if needed
        default: null
    },
    isLinked: {
        type: Boolean,
        default: false
    },
    // Data Source: Track where customer data comes from
    dataSource: {
        type: String,
        enum: ['HOUSEHOLD_DB', 'MANUAL_ENTRY'],
        default: 'HOUSEHOLD_DB', // Backward compatibility: all existing customers are internal
        index: true
    },
    // Customer Type: Individual (existing) or Group (new)
    customerType: {
        type: String,
        enum: ['INDIVIDUAL', 'GROUP'],
        default: 'INDIVIDUAL', // Backward compatibility: default = perorangan
        index: true
    },
    // Group Details (only populated if customerType = 'GROUP')
    groupDetails: {
        groupName: {
            type: String,
            trim: true
        },
        organizationType: {
            type: String,
            enum: ['KARANG_TARUNA', 'RT', 'PKK', 'REMAJA_MASJID', 'OTHER']
        },
        totalMembers: {
            type: Number,
            min: 0
        },
        // Penanggung Jawab (PIC)
        picNik: {
            type: String,
            trim: true
        },
        picName: {
            type: String,
            trim: true
        },
        picRole: {
            type: String,
            trim: true,
            default: 'Ketua'
        },
        picPhone: {
            type: String,
            trim: true
        }
    },
    name: {
        type: String,
        required: [true, 'Nama nasabah harus diisi'],
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    rt: {
        type: String,
        trim: true,
    },
    rw: {
        type: String,
        trim: true,
    },
    kelurahan: {
        type: String,
        trim: true,
        default: null
    },
    kecamatan: {
        type: String,
        trim: true,
        default: null
    },
    phone: {
        type: String,
        trim: true,
    },
    balance: {
        type: Number,
        default: 0,
        min: [0, 'Saldo tidak boleh negatif'],
    },
    stats: {
        totalTransactions: { type: Number, default: 0 },
        totalWeight: { type: Number, default: 0 },
        totalValue: { type: Number, default: 0 },
        totalWithdrawals: { type: Number, default: 0 },
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    joinDate: {
        type: Date,
        default: Date.now,
    },
    lastTransactionDate: {
        type: Date,
    },
    createdBy: {
        type: String,
    },
    // Locality: Explicitly track if customer is Internal RW 09 or External
    locality: {
        type: String,
        enum: ['INTERNAL', 'EXTERNAL'],
        default: 'INTERNAL',
        index: true
    },
}, {
    timestamps: true,
    collection: 'waste_bank_customers',
});

// Indexes
wasteBankCustomerSchema.index({ accountNumber: 1 });
wasteBankCustomerSchema.index({ name: 'text' });
wasteBankCustomerSchema.index({ isActive: 1, lastTransactionDate: -1 });
wasteBankCustomerSchema.index({ customerType: 1 });

export default mongoose.model('WasteBankCustomer', wasteBankCustomerSchema);
