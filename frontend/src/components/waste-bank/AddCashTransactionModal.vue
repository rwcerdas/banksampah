
<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Header -->
      <div class="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
        <h3 class="font-bold text-lg text-gray-800">Catat Transaksi Kas</h3>
        <button @click="$emit('close')" class="p-2 hover:bg-gray-200 rounded-full transition">
          <X class="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-4">
        
        <!-- Type Selection -->
        <div class="grid grid-cols-2 gap-3">
          <button 
            @click="form.type = 'IN'"
            class="p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all"
            :class="form.type === 'IN' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:bg-gray-50'"
          >
            <ArrowDownCircle class="w-5 h-5" /> Pemasukan
          </button>
          
          <button 
            @click="form.type = 'OUT'"
            class="p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all"
            :class="form.type === 'OUT' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:bg-gray-50'"
          >
            <ArrowUpCircle class="w-5 h-5" /> Pengeluaran
          </button>
        </div>

        <!-- Category -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
          <select v-model="form.category" class="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
            <option disabled value="">Pilih Kategori</option>
            <template v-if="form.type === 'IN'">
              <option value="Subsidi DLH">Subsidi DLH</option>
              <option value="Penjualan Sampah">Penjualan Sampah (Pengepul)</option>
              <option value="Donasi">Donasi</option>
              <option value="Lainnya (Masuk)">Lainnya</option>
            </template>
            <template v-else>
              <option value="Pembelian Sampah">Pembelian Sampah (Nasabah)</option>
              <option value="Konsumsi">Konsumsi</option>
              <option value="Transportasi">Transportasi</option>
              <option value="Maintenance Alat">Maintenance Alat</option>
              <option value="ATK">ATK</option>
              <option value="Penyusutan / Selisih Timbangan">Penyusutan / Selisih Timbangan</option>
              <option value="Lainnya (Keluar)">Lainnya</option>
            </template>
          </select>
        </div>

        <!-- Amount -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
          <input 
            type="number" 
            v-model="form.amount" 
            placeholder="Contoh: 100000"
            class="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
          />
        </div>

      <!-- Date -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal & Waktu</label>
          <input 
            type="datetime-local" 
            v-model="form.date"
            class="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
          <textarea 
            v-model="form.description" 
            rows="3"
            placeholder="Tambahkan catatan detail..."
            class="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
          ></textarea>
        </div>

        <!-- Proof Upload -->
        <div>
           <label class="block text-sm font-medium text-gray-700 mb-1">Bukti Transaksi (Opsional)</label>
           <div class="flex items-center gap-2">
             <label class="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium transition flex items-center gap-2">
                <UploadCloud class="w-4 h-4" />
                {{ selectedFile ? 'Ganti File' : 'Upload Foto/PDF' }}
                <input type="file" ref="fileInput" @change="handleFileChange" class="hidden" accept="image/*,.pdf" />
             </label>
             <span v-if="selectedFile" class="text-xs text-gray-500 truncate max-w-[200px]">
                {{ selectedFile.name }}
             </span>
           </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
        <button 
          @click="$emit('close')" 
          class="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition"
        >
          Batal
        </button>
        <button 
          @click="submit" 
          :disabled="loading || !isFormValid"
          class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          {{ loading ? 'Menyimpan...' : 'Simpan Transaksi' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { X, ArrowUpCircle, ArrowDownCircle, Loader2, UploadCloud } from 'lucide-vue-next';
import api from '@/utils/api';
import Swal from 'sweetalert2';
import { confirmSave } from '@/utils/confirmDialog';

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['close', 'saved']);
const loading = ref(false);
const fileInput = ref(null);
const selectedFile = ref(null);

const getLocalDatetime = () => {
   const now = new Date();
   const pad = (n) => n.toString().padStart(2, '0');
   return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const form = reactive({
  type: 'IN', // Default
  category: '',
  amount: '',
  date: getLocalDatetime(),
  description: ''
});

// Reset category when type changes
watch(() => form.type, () => {
  form.category = '';
});

const isFormValid = computed(() => {
  return form.category && form.amount > 0 && form.date;
});

const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
             Swal.fire('Error', 'Ukuran file maks 5MB', 'error');
             return;
        }
        selectedFile.value = file;
    }
};

async function submit() {
  if (!isFormValid.value) return;

  const ok = await confirmSave('menyimpan transaksi kas pengurus');
  if (!ok) return;
  
  loading.value = true;
  try {
    const formData = new FormData();
    formData.append('type', form.type);
    formData.append('category', form.category);
    formData.append('amount', form.amount);
    formData.append('date', form.date);
    formData.append('description', form.description);
    
    if (selectedFile.value) {
        formData.append('proof', selectedFile.value);
    }
    
    await api.post('/api/cash/transactions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    // Toast notification using SweetAlert2
    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: 'Transaksi berhasil disimpan',
      timer: 2000,
      showConfirmButton: false
    });
    
    emit('saved');
    emit('close');
    
    // Reset form slightly delayed
    setTimeout(() => {
      form.type = 'IN';
      form.category = '';
      form.amount = '';
      form.description = '';
      form.date = getLocalDatetime();
      selectedFile.value = null;
    }, 300);
    
  } catch (err) {
    console.error('Failed to save transaction:', err);
    Swal.fire({
      icon: 'error',
      title: 'Gagal',
      text: err.response?.data?.message || 'Gagal menyimpan transaksi'
    });
  } finally {
    loading.value = false;
  }
}
</script>
