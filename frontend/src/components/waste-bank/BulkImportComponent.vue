<template>
  <div class="bulk-import-section bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
    <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
      <Upload class="w-5 h-5 text-blue-600 dark:text-blue-400" />
      Bulk Import Kategori & Harga
    </h3>
    
    <div class="space-y-4">
      <!-- Info -->
      <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 flex items-start gap-2.5">
        <Lightbulb class="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p class="text-sm text-blue-800 dark:text-blue-300">
          <strong>Info:</strong> Upload file CSV untuk import kategori dan item sekaligus.
          Download template di bawah ini sebagai panduan.
        </p>
      </div>

      <!-- Template Download -->
      <div class="flex gap-3">
        <button
          @click="downloadTemplate"
          class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-center font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <FileDown class="w-4 h-4" />
          Download Template CSV
        </button>
      </div>

      <!-- File Upload -->
      <div>
        <label class="block text-sm font-medium mb-2 dark:text-gray-300">
          Upload File Excel atau CSV
        </label>
        <input
          ref="fileInput"
          type="file"
          accept=".xlsx,.xls,.csv"
          @change="handleFileSelect"
          class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-700"
        />
        <p class="text-xs text-gray-500 mt-1 dark:text-gray-400">
          Format: Excel (.xlsx) atau CSV. Kolom: Kode Barang, Kategori, Nama Barang, Harga per kilogram
        </p>
      </div>

      <!-- Upload Button -->
      <button
        @click="uploadFile"
        :disabled="!selectedFile || uploading"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <template v-if="!uploading">
          <Rocket class="w-4 h-4" />
          Import Data
        </template>
        <template v-else>
          <Loader2 class="w-4 h-4 animate-spin" />
          Memproses...
        </template>
      </button>

      <!-- Result -->
      <div v-if="result" class="mt-4 p-4 rounded-lg" :class="result.success ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700'">
        <h4 class="font-bold mb-2 flex items-center gap-2" :class="result.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'">
          <CheckCircle2 v-if="result.success" class="w-4 h-4" />
          <XCircle v-else class="w-4 h-4" />
          {{ result.success ? 'Import Berhasil!' : 'Import Gagal' }}
        </h4>
        <div v-if="result.success && result.data" class="text-sm space-y-1.5" :class="result.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
          <p class="flex items-center gap-1.5"><Check class="w-3.5 h-3.5" /> Kategori baru: {{ result.data.categoriesCreated }}</p>
          <p class="flex items-center gap-1.5"><Minus class="w-3.5 h-3.5" /> Kategori skip: {{ result.data.categoriesSkipped }}</p>
          <p class="flex items-center gap-1.5"><Check class="w-3.5 h-3.5" /> Item baru: {{ result.data.itemsCreated }}</p>
          <p class="flex items-center gap-1.5"><RefreshCw class="w-3.5 h-3.5" /> Item updated: {{ result.data.itemsUpdated }}</p>
          <p class="flex items-center gap-1.5"><Minus class="w-3.5 h-3.5" /> Item skip: {{ result.data.itemsSkipped }}</p>
          <p v-if="result.data.errors.length > 0" class="text-red-600 flex items-center gap-1.5"><AlertTriangle class="w-3.5 h-3.5" /> Errors: {{ result.data.errors.length }}</p>
        </div>
        <p v-else class="text-sm">{{ result.message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Upload, Lightbulb, FileDown, Rocket, Loader2, CheckCircle2, XCircle, Check, Minus, RefreshCw, AlertTriangle } from 'lucide-vue-next';
import * as XLSX from 'xlsx';
import bankService from '@/services/bankService';
import { confirmAction } from '@/utils/confirmDialog';

const emit = defineEmits(['imported']);

const fileInput = ref(null);
const selectedFile = ref(null);
const uploading = ref(false);
const result = ref(null);

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    result.value = null;
  }
};

const downloadTemplate = () => {
  // Master data dengan harga yang benar
  const data = [
    ['Kode Barang', 'Kategori', 'Nama Barang', 'Harga per kilogram'],
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

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 15 },  // Kode Barang
    { wch: 20 },  // Kategori
    { wch: 50 },  // Nama Barang
    { wch: 20 }   // Harga
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Master Data');

  // Generate and download
  XLSX.writeFile(wb, 'Template_Bank_Sampah.xlsx');
};

const parseExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Skip header row and convert to our format
        const items = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row[0]) { // Skip empty rows
            // Extract category code from item code (e.g., "1.1" -> "1")
            const itemCode = String(row[0]);
            const categoryCode = itemCode.split('.')[0];
            
            items.push({
              categoryCode: categoryCode,
              categoryName: row[1],
              itemCode: itemCode,
              itemName: row[2],
              pelapakPrice: parseFloat(String(row[3]).replace(/,/g, '')) // Remove commas from numbers
            });
          }
        }
        resolve(items);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject (new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

const parseCSV = (text) => {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const items = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const item = {};
    headers.forEach((header, index) => {
      item[header] = values[index]?.trim();
    });
    items.push(item);
  }

  return items;
};

const uploadFile = async () => {
  if (!selectedFile.value) return;

  const ok = await confirmAction({
    title: 'Import Data?',
    text: 'Data kategori dan harga dari file akan diimpor ke sistem. Lanjutkan?',
    confirmText: 'Ya, Import',
    icon: 'warning',
  });
  if (!ok) return;

  uploading.value = true;
  result.value = null;

  try {
    let items;

    if (selectedFile.value.name.endsWith('.xlsx') || selectedFile.value.name.endsWith('.xls')) {
      items = await parseExcel(selectedFile.value);
    } else if (selectedFile.value.name.endsWith('.csv')) {
      const text = await selectedFile.value.text();
      items = parseCSV(text);
    } else if (selectedFile.value.name.endsWith('.json')) {
      const text = await selectedFile.value.text();
      items = JSON.parse(text);
    } else {
      throw new Error('Format file tidak didukung');
    }

    const response = await bankService.bulkImportItems({ items });
    
    result.value = response;
    
    if (response.success) {
      emit('imported', response.data);
      // Reset file input
      if (fileInput.value) {
        fileInput.value.value = '';
      }
      selectedFile.value = null;
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    result.value = {
      success: false,
      message: error.response?.data?.message || error.message || 'Gagal upload file'
    };
  } finally {
    uploading.value = false;
  }
};
</script>
