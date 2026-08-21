import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth.mjs';
import User from '../models/user.model.mjs';
import { uploadProfilePhoto } from '../middleware/uploadProfilePhoto.mjs';

const router = express.Router();

const deleteOldPhoto = (photoUrl) => {
  if (!photoUrl || typeof photoUrl !== 'string') return;
  try {
    const relativePath = photoUrl.replace(/^\//, '');
    const fullPath = path.join(process.cwd(), relativePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch (err) {
    console.error('Gagal menghapus foto profil lama:', err);
  }
};

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash').lean();
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const { fullName, nama_lengkap, phone, no_handphone } = req.body;
    const updateData = {};
    if (fullName || nama_lengkap) {
      updateData.fullName = fullName || nama_lengkap;
      updateData.nama_lengkap = fullName || nama_lengkap;
    }
    const phoneVal = phone ?? no_handphone;
    if (phoneVal !== undefined) {
      updateData.phone = phoneVal;
      updateData.no_handphone = phoneVal;
    }
    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password_hash').lean();
    res.json({ message: 'Profil berhasil diperbarui', user: updatedUser });
  } catch (err) {
    next(err);
  }
});

router.post('/profile-photo', requireAuth, (req, res, next) => {
  uploadProfilePhoto.single('foto')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'Tidak ada file yang diupload' });
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
      if (user.fotoUrl) deleteOldPhoto(user.fotoUrl);
      user.fotoUrl = `/uploads/profile/${req.file.filename}`;
      await user.save();
      res.json({ message: 'Foto profil berhasil diperbarui', fotoUrl: user.fotoUrl });
    } catch (e) {
      next(e);
    }
  });
});

router.delete('/profile-photo', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    if (user.fotoUrl) deleteOldPhoto(user.fotoUrl);
    user.fotoUrl = null;
    await user.save();
    res.json({ message: 'Foto profil dihapus' });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Username dan password wajib berupa teks' });
    }
    const user = await User.findOne({ username: username.toLowerCase() }).lean();
    if (!user || !user.password_hash) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ message: 'Username atau password salah' });
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan.' });
    }
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    const { password_hash, ...safeUser } = user;
    res.json({ message: 'Login berhasil', token, user: safeUser });
  } catch (err) {
    next(err);
  }
});

router.put('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password baru minimal 8 karakter.' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Password saat ini salah.' });
    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();
    res.json({ message: 'Password berhasil diperbarui.' });
  } catch (err) {
    next(err);
  }
});

export default router;
