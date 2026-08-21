import WasteBankCustomer from '../models/wasteBankCustomer.model.mjs';
import User from '../models/user.model.mjs';
import bcrypt from 'bcryptjs';

export const changeNasabahPassword = async (req, res) => {
    try {
        const { id } = req.params; // wasteBankCustomerId
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password baru minimal 6 karakter'
            });
        }

        const customer = await WasteBankCustomer.findById(id).populate('userId');
        if (!customer) {
            return res.status(404).json({ message: 'Nasabah tidak ditemukan' });
        }

        if (!customer.userId) {
            return res.status(400).json({ message: 'Nasabah ini belum memiliki akun login' });
        }

        // Update Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(customer.userId._id, {
            password_hash: hashedPassword,
            mustChangePassword: false
        });

        res.json({
            success: true,
            message: 'Password berhasil diubah'
        });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Gagal mengubah password'
        });
    }
};

// ============================================
// SELF CHANGE PASSWORD (Nasabah – First Login)
// ============================================

export const selfChangePassword = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        }

        const { newPassword, confirmPassword } = req.body;

        if (!newPassword || newPassword.trim().length < 6) {
            return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Konfirmasi password tidak cocok' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        // Hash & simpan password baru, tandai flag selesai
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password_hash = hashedPassword;
        user.mustChangePassword = false;
        await user.save();

        res.json({
            success: true,
            message: 'Password berhasil diubah. Silakan login kembali.'
        });

    } catch (error) {
        console.error('Error selfChangePassword:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Gagal mengubah password'
        });
    }
};

export const linkNasabahToUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username dan Password wajib diisi' });
        }

        const customer = await WasteBankCustomer.findById(id);
        if (!customer) {
            return res.status(404).json({ message: 'Nasabah tidak ditemukan' });
        }

        if (customer.userId) {
            return res.status(400).json({ message: 'Nasabah ini sudah memiliki akun login' });
        }

        // Check availability
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username sudah digunakan' });
        }

        // Create User
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            password_hash: hashedPassword,
            role: 'nasabah',
            nama_lengkap: customer.name,
            nik: customer.nik || null,
            no_hp: customer.phone || null,
            mustChangePassword: true
        });

        await newUser.save();

        // Link to Customer
        customer.userId = newUser._id;
        await customer.save();

        res.json({
            success: true,
            message: 'Akun login berhasil dibuat dan ditautkan',
            user: {
                id: newUser._id,
                username: newUser.username
            }
        });

    } catch (error) {
        console.error('Error linking nasabah account:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Gagal menautkan akun'
        });
    }
};

export const getCustomerProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const customer = await WasteBankCustomer.findOne({ userId }).populate('userId', 'username nama_lengkap');

        if (!customer) {
            return res.status(404).json({ message: 'Profil nasabah tidak ditemukan.' });
        }

        res.json(customer);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: error.message });
    }
};
