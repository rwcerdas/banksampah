import multer from 'multer';
import fs from 'fs';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'uploads', 'cash-proofs');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        // 🛡️ Strip path separator & karakter berbahaya (cegah path traversal)
        const safeName = Date.now() + '-' + path.basename(file.originalname).replace(/[^a-zA-Z0-9.]/g, '-');
        cb(null, safeName);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|pdf/;
    const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';
    if (extOk && mimeOk) cb(null, true);
    else cb(new Error('Only jpg, png, webp, and pdf files are allowed'));
};

export const uploadCashProof = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter,
});
