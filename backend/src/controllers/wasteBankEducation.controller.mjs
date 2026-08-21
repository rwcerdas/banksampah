import WasteBankEducation from '../models/wasteBankEducation.schema.mjs';

// Get all articles (with pagination & filtering)
export const getEducationArticles = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, status } = req.query;
        const query = {};

        if (category && category !== 'ALL') query.category = category;
        if (status && status !== 'ALL') query.status = status;

        // If public (no admin auth), only show published
        // But for now assuming mixed use, can filter by query

        const articles = await WasteBankEducation.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const count = await WasteBankEducation.countDocuments(query);

        res.json({
            success: true,
            data: articles,
            pagination: {
                total: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single article
export const getEducationArticleById = async (req, res) => {
    try {
        const article = await WasteBankEducation.findById(req.params.id);
        if (!article) return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan' });

        res.json({ success: true, data: article });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create article
export const createEducationArticle = async (req, res) => {
    try {
        const { title, content, imageUrl, category, status, author } = req.body;

        const newArticle = new WasteBankEducation({
            title,
            content,
            imageUrl,
            category: category || 'NEWS',
            status: status || 'PUBLISHED',
            author: author || 'Admin'
        });

        await newArticle.save();

        res.status(201).json({
            success: true,
            message: 'Artikel berhasil dibuat',
            data: newArticle
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update article
export const updateEducationArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const article = await WasteBankEducation.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!article) return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan' });

        res.json({
            success: true,
            message: 'Artikel berhasil diperbarui',
            data: article
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete article
export const deleteEducationArticle = async (req, res) => {
    try {
        const article = await WasteBankEducation.findByIdAndDelete(req.params.id);

        if (!article) return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan' });

        res.json({ success: true, message: 'Artikel berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
