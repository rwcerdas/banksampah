import WasteBankCollector from '../models/wasteBankCollector.model.mjs';
import WasteBankItem from '../models/wasteBankItem.model.mjs';
import WasteBankTransaction from '../models/wasteBankTransaction.model.mjs';

// ============================================
// COLLECTOR CRUD
// ============================================

/**
 * GET /api/waste-bank/collectors
 * List semua pengepul, default hanya yang aktif
 */
export const getCollectors = async (req, res) => {
    try {
        const { active, search } = req.query;

        const query = {};
        if (active !== undefined) {
            query.isActive = active === 'true';
        }
        if (search) {
            query.$or = [
                { collectorName: { $regex: search, $options: 'i' } },
                { collectorCode: { $regex: search, $options: 'i' } },
            ];
        }

        const collectors = await WasteBankCollector.find(query)
            .sort({ collectorName: 1 })
            .lean();

        res.json({ success: true, data: collectors });
    } catch (error) {
        console.error('Error getting collectors:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data pengepul', error: error.message });
    }
};

/**
 * GET /api/waste-bank/collectors/:id
 * Detail satu pengepul
 */
export const getCollectorById = async (req, res) => {
    try {
        const { id } = req.params;
        const collector = await WasteBankCollector.findById(id).lean();

        if (!collector) {
            return res.status(404).json({ success: false, message: 'Pengepul tidak ditemukan' });
        }

        res.json({ success: true, data: collector });
    } catch (error) {
        console.error('Error getting collector:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data pengepul', error: error.message });
    }
};

/**
 * POST /api/waste-bank/collectors
 * Buat pengepul baru. collectorCode auto-generate jika tidak dikirim.
 */
export const createCollector = async (req, res) => {
    try {
        const { collectorCode, collectorName, phone, address, notes } = req.body;

        if (!collectorName) {
            return res.status(400).json({ success: false, message: 'Nama pengepul harus diisi' });
        }

        // Auto-generate kode jika tidak dikirim
        let finalCode = collectorCode;
        if (!finalCode || finalCode.trim() === '') {
            const count = await WasteBankCollector.countDocuments();
            finalCode = `PG-${String(count + 1).padStart(3, '0')}`;
        }

        // Cek duplikasi kode
        const existing = await WasteBankCollector.findOne({ collectorCode: finalCode.toUpperCase() });
        if (existing) {
            return res.status(400).json({ success: false, message: `Kode pengepul "${finalCode}" sudah digunakan` });
        }

        const collector = new WasteBankCollector({
            collectorCode: finalCode,
            collectorName,
            phone,
            address,
            notes,
            createdBy: req.user?.username || 'system',
        });

        await collector.save();

        res.status(201).json({
            success: true,
            message: 'Pengepul berhasil ditambahkan',
            data: collector,
        });
    } catch (error) {
        console.error('Error creating collector:', error);
        res.status(500).json({ success: false, message: 'Gagal menambahkan pengepul', error: error.message });
    }
};

/**
 * PUT /api/waste-bank/collectors/:id
 * Update data pengepul
 */
export const updateCollector = async (req, res) => {
    try {
        const { id } = req.params;
        const { collectorName, phone, address, notes, isActive } = req.body;

        const collector = await WasteBankCollector.findById(id);
        if (!collector) {
            return res.status(404).json({ success: false, message: 'Pengepul tidak ditemukan' });
        }

        // Jika nama berubah, sinkronkan snapshot collectorName di semua item yang punya harga untuk pengepul ini
        if (collectorName && collectorName !== collector.collectorName) {
            await WasteBankItem.updateMany(
                { 'collectorPrices.collectorId': collector._id },
                { $set: { 'collectorPrices.$[elem].collectorName': collectorName } },
                { arrayFilters: [{ 'elem.collectorId': collector._id }] }
            );
        }

        if (collectorName !== undefined) collector.collectorName = collectorName;
        if (phone !== undefined) collector.phone = phone;
        if (address !== undefined) collector.address = address;
        if (notes !== undefined) collector.notes = notes;
        if (isActive !== undefined) collector.isActive = isActive;

        await collector.save();

        res.json({ success: true, message: 'Pengepul berhasil diupdate', data: collector });
    } catch (error) {
        console.error('Error updating collector:', error);
        res.status(500).json({ success: false, message: 'Gagal mengupdate pengepul', error: error.message });
    }
};

/**
 * DELETE /api/waste-bank/collectors/:id
 * Soft delete pengepul (isActive = false).
 * Gagal jika pengepul masih memiliki transaksi aktif.
 */
export const deleteCollector = async (req, res) => {
    try {
        const { id } = req.params;

        const collector = await WasteBankCollector.findById(id);
        if (!collector) {
            return res.status(404).json({ success: false, message: 'Pengepul tidak ditemukan' });
        }

        // Cek apakah ada transaksi yang menggunakan pengepul ini
        const txCount = await WasteBankTransaction.countDocuments({
            collectorId: collector._id,
            status: 'COMPLETED',
        });

        if (txCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Pengepul tidak dapat dihapus karena memiliki ${txCount} transaksi aktif. Nonaktifkan saja.`,
            });
        }

        // Soft delete
        collector.isActive = false;
        await collector.save();

        res.json({ success: true, message: 'Pengepul berhasil dinonaktifkan' });
    } catch (error) {
        console.error('Error deleting collector:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus pengepul', error: error.message });
    }
};

// ============================================
// COLLECTOR PRICE MANAGEMENT PER ITEM
// ============================================

/**
 * GET /api/waste-bank/collectors/:collectorId/prices
 * List semua harga item untuk satu pengepul, dengan harga default sebagai pembanding
 */
export const getCollectorItemPrices = async (req, res) => {
    try {
        const { collectorId } = req.params;

        // Cek pengepul
        const collector = await WasteBankCollector.findById(collectorId).lean();
        if (!collector) {
            return res.status(404).json({ success: false, message: 'Pengepul tidak ditemukan' });
        }

        // Ambil semua item aktif
        const items = await WasteBankItem.find({ isActive: true })
            .populate('categoryId', 'categoryCode categoryName')
            .sort({ itemCode: 1 })
            .lean();

        // Enrich tiap item dengan harga khusus pengepul ini (jika ada)
        const enrichedItems = items.map(item => {
            const cp = (item.collectorPrices || []).find(
                p => p.collectorId?.toString() === collectorId
            );
            return {
                _id: item._id,
                itemCode: item.itemCode,
                itemName: item.itemName,
                unit: item.unit,
                categoryId: item.categoryId,
                defaultPrice: item.pelapakPrice,   // Harga default (pelapakPrice)
                collectorPrice: cp?.price ?? null,  // null = belum diset
                priceHistory: cp?.priceHistory ?? [],
                lastUpdatedAt: cp?.updatedAt ?? null,
                lastUpdatedBy: cp?.updatedBy ?? null,
            };
        });

        res.json({
            success: true,
            data: {
                collector,
                items: enrichedItems,
            },
        });
    } catch (error) {
        console.error('Error getting collector prices:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil harga pengepul', error: error.message });
    }
};

/**
 * PUT /api/waste-bank/collectors/:collectorId/prices
 * Set/update harga item untuk satu pengepul.
 * Body: { prices: [{ itemId, price }] } — bisa batch update banyak item sekaligus
 * Jika price = null/0, hapus harga pengepul untuk item tersebut (kembali ke default)
 */
export const setCollectorItemPrices = async (req, res) => {
    try {
        const { collectorId } = req.params;
        const { prices } = req.body; // Array of { itemId, price }
        const username = req.user?.username || 'system';

        if (!Array.isArray(prices) || prices.length === 0) {
            return res.status(400).json({ success: false, message: 'Data harga tidak valid' });
        }

        const collector = await WasteBankCollector.findById(collectorId);
        if (!collector) {
            return res.status(404).json({ success: false, message: 'Pengepul tidak ditemukan' });
        }

        const results = { updated: 0, removed: 0, errors: [] };

        for (const { itemId, price } of prices) {
            try {
                const item = await WasteBankItem.findById(itemId);
                if (!item) {
                    results.errors.push({ itemId, reason: 'Item tidak ditemukan' });
                    continue;
                }

                const existingIdx = item.collectorPrices.findIndex(
                    cp => cp.collectorId?.toString() === collectorId
                );

                // Jika price null atau 0, hapus entri ini (kembali ke harga default)
                if (price === null || price === undefined || price === '' || parseFloat(price) === 0) {
                    if (existingIdx >= 0) {
                        item.collectorPrices.splice(existingIdx, 1);
                        await item.save();
                        results.removed++;
                    }
                    continue;
                }

                const numericPrice = parseFloat(price);
                if (isNaN(numericPrice) || numericPrice < 0) {
                    results.errors.push({ itemId, reason: 'Harga tidak valid' });
                    continue;
                }

                if (existingIdx >= 0) {
                    // Update existing — push ke priceHistory dulu
                    const existing = item.collectorPrices[existingIdx];
                    if (existing.price !== numericPrice) {
                        existing.priceHistory.push({
                            price: existing.price,
                            effectiveDate: existing.updatedAt || new Date(),
                            updatedBy: existing.updatedBy || 'system',
                        });
                        existing.price = numericPrice;
                        existing.updatedAt = new Date();
                        existing.updatedBy = username;
                    }
                } else {
                    // Insert baru
                    item.collectorPrices.push({
                        collectorId: collector._id,
                        collectorName: collector.collectorName,
                        price: numericPrice,
                        priceHistory: [],
                        updatedAt: new Date(),
                        updatedBy: username,
                    });
                }

                await item.save();
                results.updated++;
            } catch (itemErr) {
                results.errors.push({ itemId, reason: itemErr.message });
            }
        }

        res.json({
            success: true,
            message: `${results.updated} harga diperbarui, ${results.removed} dihapus`,
            data: results,
        });
    } catch (error) {
        console.error('Error setting collector prices:', error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan harga pengepul', error: error.message });
    }
};

/**
 * DELETE /api/waste-bank/collectors/:collectorId/prices/:itemId
 * Hapus harga pengepul untuk satu item tertentu (kembali ke harga default)
 */
export const deleteCollectorItemPrice = async (req, res) => {
    try {
        const { collectorId, itemId } = req.params;

        const item = await WasteBankItem.findById(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item tidak ditemukan' });
        }

        const idx = item.collectorPrices.findIndex(
            cp => cp.collectorId?.toString() === collectorId
        );

        if (idx === -1) {
            return res.status(404).json({ success: false, message: 'Harga pengepul untuk item ini tidak ditemukan' });
        }

        item.collectorPrices.splice(idx, 1);
        await item.save();

        res.json({ success: true, message: 'Harga pengepul untuk item berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting collector price:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus harga pengepul', error: error.message });
    }
};
