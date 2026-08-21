import { GoogleGenerativeAI } from '@google/generative-ai';

const PROMPTS = {
  waste_bank_management: (stats, location) => `
Data Operasional Bank Sampah ${location}:
- Periode: ${stats.dateRange?.start || 'N/A'} s/d ${stats.dateRange?.end || 'N/A'}
- Total Nasabah Aktif: ${stats.uniqueCustomers || 0}
- Total Transaksi: ${stats.totalTransactions || 0}
- Total Berat: ${stats.totalWeight || 0} Kg
- Total Nilai: Rp ${(stats.totalValue || 0).toLocaleString('id-ID')}
- Profit Margin: Rp ${(stats.totalProfit || 0).toLocaleString('id-ID')}

DISTRIBUSI JENIS SAMPAH:
${(stats.weightByItem || []).map(i => `- ${i.itemName}: ${i.weight} Kg (${i.percentage}%)`).join('\n') || '- Belum ada data'}

Buat analisis operasional bank sampah dalam bahasa Indonesia, bullet points sederhana, maksimal 600 kata.
Fokus: partisipasi nasabah, distribusi sampah, kesehatan finansial, rekomendasi strategis.
`,

  waste_bank_public: (stats, location) => `
Laporan Bank Sampah ${location}:
- Nasabah aktif: ${stats.uniqueCustomers || 0}
- Total sampah: ${stats.totalWeight || 0} Kg
- Total transaksi: ${stats.totalTransactions || 0}

Buat laporan motivasional untuk warga dalam bahasa Indonesia sederhana, maksimal 500 kata.
`,
};

async function generateWithGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, message: 'GEMINI_API_KEY belum dikonfigurasi' };
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return { success: true, insight: text };
}

const aiService = {
  async generateInsightWithAI(stats, category, location = 'EcoBank') {
    const promptKey = category === 'public' ? 'waste_bank_public' : 'waste_bank_management';
    const promptFn = PROMPTS[promptKey];
    const prompt = promptFn(stats, location);
    return generateWithGemini(prompt);
  },
};

export default aiService;
