import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.mjs';
import WasteBankSetting from '../models/wasteBankSetting.model.mjs';
import WasteBankCategory from '../models/wasteBankCategory.model.mjs';
import WasteBankItem from '../models/wasteBankItem.model.mjs';

const router = express.Router();

const DEFAULT_CATEGORIES = [
  { categoryCode: 'PLASTIK', categoryName: 'Plastik' },
  { categoryCode: 'KERTAS', categoryName: 'Kertas' },
  { categoryCode: 'LOGAM', categoryName: 'Logam' },
  { categoryCode: 'KACA', categoryName: 'Kaca' },
  { categoryCode: 'ORGANIK', categoryName: 'Organik' },
];

const DEFAULT_ITEMS = [
  { categoryCode: 'PLASTIK', itemCode: 'PET', itemName: 'Botol PET', pelapakPrice: 3000 },
  { categoryCode: 'PLASTIK', itemCode: 'HDPE', itemName: 'Plastik HDPE', pelapakPrice: 2500 },
  { categoryCode: 'KERTAS', itemCode: 'KORAN', itemName: 'Koran/HVS', pelapakPrice: 2000 },
  { categoryCode: 'KERTAS', itemCode: 'KARDUS', itemName: 'Kardus', pelapakPrice: 1500 },
  { categoryCode: 'LOGAM', itemCode: 'ALUM', itemName: 'Aluminium', pelapakPrice: 12000 },
  { categoryCode: 'LOGAM', itemCode: 'BESI', itemName: 'Besi', pelapakPrice: 3000 },
  { categoryCode: 'KACA', itemCode: 'BOTOL', itemName: 'Botol Kaca', pelapakPrice: 500 },
];

async function seedMasterData() {
  const categoryIds = {};

  for (const cat of DEFAULT_CATEGORIES) {
    const doc = await WasteBankCategory.findOneAndUpdate(
      { categoryCode: cat.categoryCode },
      { ...cat, isActive: true },
      { upsert: true, new: true }
    );
    categoryIds[cat.categoryCode] = doc._id;
  }

  for (const item of DEFAULT_ITEMS) {
    const { categoryCode, ...itemFields } = item;
    await WasteBankItem.findOneAndUpdate(
      { itemCode: item.itemCode },
      {
        ...itemFields,
        categoryId: categoryIds[categoryCode],
        isActive: true,
        unit: 'Kg',
      },
      { upsert: true, new: true }
    );
  }
}

router.get('/status', async (_req, res) => {
  try {
    const [adminCount, categoryCount] = await Promise.all([
      User.countDocuments({ role: 'admin' }),
      WasteBankCategory.countDocuments(),
    ]);
    res.json({ initialized: adminCount > 0 && categoryCount > 0 });
  } catch (err) {
    res.status(500).json({ initialized: false, message: err.message });
  }
});

router.post('/initialize', async (req, res) => {
  try {
    const [adminCount, categoryCount] = await Promise.all([
      User.countDocuments({ role: 'admin' }),
      WasteBankCategory.countDocuments(),
    ]);

    if (adminCount > 0 && categoryCount > 0) {
      return res.status(400).json({ success: false, message: 'Sistem sudah diinisialisasi' });
    }

    const {
      bankName,
      bankAddress,
      adminUsername,
      adminPassword,
      adminFullName,
      markupPercentage = 10,
    } = req.body;

    if (!bankName || !adminUsername || !adminPassword) {
      return res.status(400).json({
        success: false,
        message: 'Nama bank sampah, username admin, dan password wajib diisi',
      });
    }

    if (adminPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password minimal 8 karakter' });
    }

    await WasteBankSetting.setSetting('bank_name', bankName);
    await WasteBankSetting.setSetting('bank_address', bankAddress || '');
    await WasteBankSetting.setSetting('markup_percentage', Number(markupPercentage) || 10);
    await WasteBankSetting.setSetting('app_short_name', bankName.slice(0, 12));
    await WasteBankSetting.setSetting('app_tagline', 'Sistem Manajemen Bank Sampah');
    await WasteBankSetting.setSetting('theme_color', '#2563eb');

    await seedMasterData();

    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        username: adminUsername.toLowerCase(),
        password_hash: hashedPassword,
        fullName: adminFullName || 'Administrator',
        nama_lengkap: adminFullName || 'Administrator',
        role: 'admin',
        isActive: true,
      });
    }

    await WasteBankSetting.setSetting('initialized_at', new Date().toISOString());

    res.status(201).json({
      success: true,
      message: 'EcoBank berhasil diinisialisasi. Silakan login.',
    });
  } catch (err) {
    console.error('Setup error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
