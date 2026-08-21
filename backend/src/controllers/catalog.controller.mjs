import WasteBankItem from '../models/wasteBankItem.model.mjs';
import WasteBankCategory from '../models/wasteBankCategory.model.mjs';
import AuditTrailService from '../services/auditTrail.service.mjs';

export const getCategories = async (req, res) => {
    try {
        const { active } = req.query;

        const query = {};
        if (active !== undefined) {
            query.isActive = active === 'true';
        }

        const categories = await WasteBankCategory.find(query)
            .sort({ categoryCode: 1 })
            .lean();

        res.json({
            success: true,
            data: {
                categories
            }
        });
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data kategori',
            error: error.message
        });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { categoryCode, categoryName, description } = req.body;

        const existing = await WasteBankCategory.findOne({ categoryCode });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Kode kategori sudah digunakan'
            });
        }

        const category = new WasteBankCategory({
            categoryCode,
            categoryName,
            description,
            createdBy: req.user?.username || 'system'
        });

        await category.save();

        // Log audit trail untuk waste bank category creation
        if (req.user) {
            await AuditTrailService.logActivity({
                user_id: req.user.id,
                username: req.user.username,
                user_role: req.user.role,
                action: 'CREATE',
                resource: 'WasteBankCategory',
                resource_id: category._id,
                description: `Membuat kategori waste bank: ${categoryName} (${categoryCode})`,
                ip_address: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
                user_agent: req.headers['user-agent'],
                metadata: {
                    created_category: {
                        categoryCode,
                        categoryName,
                        description
                    },
                    method: req.method,
                    endpoint: req.originalUrl
                },
                status: 'success'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Kategori berhasil dibuat',
            data: category
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menambahkan kategori',
            error: error.message
        });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryCode, categoryName, description, isActive } = req.body;

        const category = await WasteBankCategory.findByIdAndUpdate(
            id,
            { categoryCode, categoryName, description, isActive },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Kategori tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'Kategori berhasil diupdate',
            data: category
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengupdate kategori',
            error: error.message
        });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category has items
        const itemCount = await WasteBankItem.countDocuments({ categoryId: id });
        if (itemCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Kategori tidak dapat dihapus karena memiliki ${itemCount} barang`
            });
        }

        await WasteBankCategory.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Kategori berhasil dihapus'
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus kategori',
            error: error.message
        });
    }
};

// ============================================
// ITEM MANAGEMENT
// ============================================

export const getItems = async (req, res) => {
    try {
        const { categoryId, active, collectorId } = req.query;

        const query = {};
        if (categoryId) query.categoryId = categoryId;
        if (active !== undefined) query.isActive = active === 'true';

        const items = await WasteBankItem.find(query)
            .populate('categoryId', 'categoryCode categoryName')
            .sort({ itemCode: 1 })
            .lean();

        // Jika collectorId dikirim, inject effectivePrice per item
        if (collectorId) {
            items.forEach(item => {
                const cp = (item.collectorPrices || []).find(
                    p => p.collectorId?.toString() === collectorId
                );
                item.effectivePrice = cp ? cp.price : item.pelapakPrice;
                item.priceSource = cp ? 'collector' : 'default';
            });
        }

        res.json({
            success: true,
            data: { items }
        });
    } catch (error) {
        console.error('Error getting items:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data barang',
            error: error.message
        });
    }
};

export const createItem = async (req, res) => {
    try {
        const { itemCode, categoryId, itemName, pelapakPrice, unit } = req.body;

        const existing = await WasteBankItem.findOne({ itemCode });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Kode barang sudah digunakan'
            });
        }

        const item = new WasteBankItem({
            itemCode,
            categoryId,
            itemName,
            pelapakPrice,
            unit,
            priceHistory: [{
                price: pelapakPrice,
                effectiveDate: new Date(),
                updatedBy: req.user?.username || 'system'
            }],
            createdBy: req.user?.username || 'system'
        });

        await item.save();

        res.status(201).json({
            success: true,
            message: 'Barang berhasil ditambahkan',
            data: item
        });
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menambahkan barang',
            error: error.message
        });
    }
};

export const updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { itemCode, categoryId, itemName, pelapakPrice, unit, isActive } = req.body;

        const item = await WasteBankItem.findById(id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Barang tidak ditemukan'
            });
        }

        // If price changes, add to history
        if (pelapakPrice && pelapakPrice !== item.pelapakPrice) {
            item.priceHistory.push({
                price: pelapakPrice,
                effectiveDate: new Date(),
                updatedBy: req.user?.username || 'system'
            });
        }

        // Update fields
        if (itemCode) item.itemCode = itemCode;
        if (categoryId) item.categoryId = categoryId;
        if (itemName) item.itemName = itemName;
        if (pelapakPrice) item.pelapakPrice = pelapakPrice;
        if (unit) item.unit = unit;
        if (isActive !== undefined) item.isActive = isActive;

        await item.save();

        res.json({
            success: true,
            message: 'Barang berhasil diupdate',
            data: item
        });
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengupdate barang',
            error: error.message
        });
    }
};

export const deleteItem = async (req, res) => {
    try {
        const { id } = req.params;

        // Soft delete
        const item = await WasteBankItem.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Barang tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'Barang berhasil dinonaktifkan'
        });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus barang',
            error: error.message
        });
    }
};

// ============================================
// BULK IMPORT FOR CATEGORIES & ITEMS
// ============================================

export const bulkImportItems = async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Data items tidak valid atau kosong'
            });
        }

        const results = {
            categoriesCreated: 0,
            categoriesSkipped: 0,
            itemsCreated: 0,
            itemsUpdated: 0,
            itemsSkipped: 0,
            errors: []
        };

        // Group items by category
        const categoryMap = new Map();

        for (const item of items) {
            const { categoryCode, categoryName, itemCode, itemName, pelapakPrice } = item;

            if (!categoryCode || !itemCode || !itemName || !pelapakPrice) {
                results.errors.push({
                    itemCode,
                    reason: 'Missing required fields'
                });
                continue;
            }

            if (!categoryMap.has(categoryCode)) {
                categoryMap.set(categoryCode, {
                    categoryCode,
                    categoryName: categoryName || `Kategori ${categoryCode}`,
                    items: []
                });
            }

            categoryMap.get(categoryCode).items.push({
                itemCode,
                itemName,
                pelapakPrice: parseFloat(pelapakPrice)
            });
        }

        // Process each category
        for (const [categoryCode, categoryData] of categoryMap) {
            let category = await WasteBankCategory.findOne({ categoryCode });

            if (!category) {
                // Create new category
                category = new WasteBankCategory({
                    categoryCode: categoryData.categoryCode,
                    categoryName: categoryData.categoryName,
                    createdBy: req.user?.username || 'system'
                });
                await category.save();
                results.categoriesCreated++;
            } else {
                results.categoriesSkipped++;
            }

            // Process items in this category
            for (const itemData of categoryData.items) {
                const existingItem = await WasteBankItem.findOne({ itemCode: itemData.itemCode });

                if (existingItem) {
                    // Update price if different
                    if (existingItem.pelapakPrice !== itemData.pelapakPrice) {
                        existingItem.priceHistory.push({
                            price: itemData.pelapakPrice,
                            effectiveDate: new Date(),
                            updatedBy: req.user?.username || 'system'
                        });
                        existingItem.pelapakPrice = itemData.pelapakPrice;
                        existingItem.itemName = itemData.itemName; // Update name too
                        await existingItem.save();
                        results.itemsUpdated++;
                    } else {
                        results.itemsSkipped++;
                    }
                } else {
                    // Create new item
                    const newItem = new WasteBankItem({
                        itemCode: itemData.itemCode,
                        categoryId: category._id,
                        itemName: itemData.itemName,
                        pelapakPrice: itemData.pelapakPrice,
                        unit: 'Kg',
                        priceHistory: [{
                            price: itemData.pelapakPrice,
                            effectiveDate: new Date(),
                            updatedBy: req.user?.username || 'system'
                        }],
                        createdBy: req.user?.username || 'system'
                    });
                    await newItem.save();
                    results.itemsCreated++;
                }
            }
        }

        res.status(200).json({
            success: true,
            message: 'Bulk import berhasil',
            data: results
        });

    } catch (error) {
        console.error('Error bulk importing items:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal melakukan bulk import',
            error: error.message
        });
    }
};

// ============================================
// TRANSACTION MANAGEMENT
// ============================================
