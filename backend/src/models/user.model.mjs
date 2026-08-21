import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    trim: true,
    default: '',
  },
  nama_lengkap: {
    type: String,
    trim: true,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  no_handphone: {
    type: String,
    trim: true,
    default: '',
  },
  role: {
    type: String,
    enum: ['admin', 'nasabah'],
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WasteBankCustomer',
    default: null,
  },
  fotoUrl: {
    type: String,
    default: null,
  },
  mustChangePassword: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

userSchema.virtual('displayName').get(function () {
  return this.fullName || this.nama_lengkap || this.username;
});

export default mongoose.model('User', userSchema);
