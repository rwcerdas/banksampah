import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

if (!process.env.MONGO_URI) {
    console.log('Trying relative path ../.env');
    dotenv.config({ path: '../.env' });
}

import WasteBankCategory from '../backend/src/models/wasteBankCategory.model.mjs';
import WasteBankItem from '../backend/src/models/wasteBankItem.model.mjs';

const MASTER_DATA = [
    ['1.1', 'KERTAS', 'Buku Tulis/Pelajaran / Campur', 1100],
    ['1.2', 'KERTAS', 'Hvs/Putihan', 700],
    ['1.3', 'KERTAS', 'Kardus/Box', 800],
    ['1.4', 'KERTAS', 'Koran (Bagus)', 2000],
    ['1.5', 'KERTAS', 'Majalah/Buku LKS', 200],
    ['1.6', 'KERTAS', 'Boncos', 100],
    ['2.1', 'PLASTIK', 'Botol Bersih', 300],
    ['2.2', 'PLASTIK', 'Botol/Gelas Mineral kotor', 1000],
    ['2.3', 'PLASTIK', 'Botol Warna', 500],
    ['2.4', 'PLASTIK', 'Thinwall/PP No. 5 (Bening)', 1800],
    ['2.5', 'PLASTIK', 'Ember Campur/ Emberan', 1000],
    ['2.6', 'PLASTIK', 'Ember Hitam / Pot Bunga', 300],
    ['2.7', 'PLASTIK', 'Gelas Bersih', 2000],
    ['2.8', 'PLASTIK', 'Plastik/Asoy', 200],
    ['2.9', 'PLASTIK', 'PE', 3100],
    ['2.10', 'PLASTIK', 'Selang Air/Pralon', 500],
    ['2.11', 'PLASTIK', 'Tutup Botol', 400],
    ['2.12', 'PLASTIK', 'Tutup Galon/LD', 2000],
    ['2.13', 'PLASTIK', 'Botol Galon', 2000],
    ['3.1', 'LOGAM', 'Alumunium', 9000],
    ['3.2', 'LOGAM', 'Besi', 2600],
    ['3.3', 'LOGAM', 'Kabin, Paku, Besi Kerompong, baja ringan', 600],
    ['3.4', 'LOGAM', 'Kaleng', 200],
    ['3.5', 'LOGAM', 'Kuningan', 30000],
    ['3.6', 'LOGAM', 'Seng/Kawat', 500],
    ['3.7', 'LOGAM', 'Tembaga', 70000],
    ['4.1', 'IMPACT', 'Impact: R,cesoris motor, Helm, tape, R. Nyamuk, K. Air', 200],
    ['4.2', 'IMPACT', 'Yakult', 300],
    ['5.1', 'BELING', 'Beling', 250],
    ['6.1', 'ELEKTRONIK', 'AC 1 set', 150000],
    ['6.2', 'ELEKTRONIK', 'Komputer 1 set', 60000],
    ['6.3', 'ELEKTRONIK', 'CPU Komplit', 30000],
    ['6.4', 'ELEKTRONIK', 'Kulkas', 45000],
    ['6.5', 'ELEKTRONIK', 'Laptop', 40000],
    ['6.6', 'ELEKTRONIK', 'Notebook', 20000],
    ['6.7', 'ELEKTRONIK', 'Mesin Cuci Komplit', 30000],
    ['6.8', 'ELEKTRONIK', 'TV Tabung 14"/Monitor', 5000],
    ['6.9', 'ELEKTRONIK', 'TV Tabung 21"', 10000],
    ['6.10', 'ELEKTRONIK', 'TV Tabung 29"', 20000],
    ['6.11', 'ELEKTRONIK', 'TV LCD/LED <32"', 20000],
    ['6.12', 'ELEKTRONIK', 'TV LCD 32" & LED/LCD 32"', 3000],
    ['6.13', 'ELEKTRONIK', 'TV LED > 32"', 500],
    ['6.14', 'ELEKTRONIK', 'TV LCD/LED Layar Retak/Flek', 100],
    ['7.1', 'AKI', 'Aki', 8000],
    ['8.1', 'KARPET', 'K.Plastik, K.Talang/K. Kabel', 300],
    ['9.1', 'KEPING CD', 'Keping CD/Acrylic/Kristal Putih', 2000],
    ['10.1', 'MINYAK JELANTAH', 'Minyak Jelantah', 4800],
    ['11.1', 'RESIDU PLASTIK', 'Stryfoam', 500],
    ['11.2', 'RESIDU PLASTIK', 'Tetrapak', 100],
    ['11.3', 'RESIDU PLASTIK', 'Multilayer/MLP', 300],
    ['11.4', 'RESIDU PLASTIK', 'Kabel', 500],
    ['12.10', 'GALON UTUH', 'Galon Leminerale', 700],
    ['12.11', 'RESIDU PLASTIK', 'Mika', 200]
];

const seedData = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI not found in .env');
        }

        let mongoUri = process.env.MONGO_URI;
        if (mongoUri.includes('mongodb:27017') && !mongoUri.includes('27018')) {
            console.log('Forcing localhost:27018 for host-side script...');
            mongoUri = mongoUri.replace('@mongodb:27017', '@localhost:27018');
            mongoUri = mongoUri.replace('@localhost:27017', '@localhost:27018');
        }

        console.log('Connecting to MongoDB:', mongoUri);
        await mongoose.connect(mongoUri);
        console.log('Connected!');

        console.log('Clearing existing data...');
        await WasteBankCategory.deleteMany({});
        await WasteBankItem.deleteMany({});
        console.log('Cleared.');

        console.log('Processing items...');

        // Group items by category
        const categoryMap = new Map();

        for (const row of MASTER_DATA) {
            const [itemCode, categoryName, itemName, pelapakPrice] = row;
            // Extract category code from itemCode (e.g. "1.1" -> "1", "12.10" -> "12")
            const categoryCode = itemCode.split('.')[0];

            if (!categoryMap.has(categoryCode)) {
                categoryMap.set(categoryCode, {
                    categoryCode,
                    categoryName,
                    items: []
                });
            }

            categoryMap.get(categoryCode).items.push({
                itemCode,
                itemName,
                pelapakPrice
            });
        }

        let catCount = 0;
        let itemCount = 0;

        for (const [code, catData] of categoryMap) {
            const category = new WasteBankCategory({
                categoryCode: catData.categoryCode,
                categoryName: catData.categoryName,
                description: `Kategori ${catData.categoryName}`,
                createdBy: 'system'
            });
            await category.save();
            catCount++;

            for (const itemData of catData.items) {
                const item = new WasteBankItem({
                    itemCode: itemData.itemCode,
                    categoryId: category._id,
                    itemName: itemData.itemName,
                    pelapakPrice: itemData.pelapakPrice,
                    unit: 'Kg',
                    priceHistory: [{
                        price: itemData.pelapakPrice,
                        effectiveDate: new Date(),
                        updatedBy: 'system'
                    }],
                    createdBy: 'system'
                });
                await item.save();
                itemCount++;
            }
        }

        console.log(`✅ Seed successful! Created ${catCount} categories and ${itemCount} items.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
};

seedData();
