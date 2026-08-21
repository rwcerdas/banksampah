<template>
  <div class="p-4 sm:p-8 bg-gray-50 dark:bg-gray-950 transition-colors">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
        <Package class="w-7 h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
        Kategori & Harga Sampah
      </h1>
      <router-link to="/admin/dashboard" class="text-sm text-blue-600 hover:underline flex items-center gap-1.5">
        <ArrowLeft class="w-4 h-4" />
        Dashboard
      </router-link>
    </div>

    <!-- Bulk Import Section -->
    <BulkImportComponent @imported="handleImported" />

    <!-- Toolbar (Search & Actions) -->
    <div class="flex flex-col md:flex-row justify-between gap-4 mb-6">
      <!-- Search Input -->
      <div class="relative flex-1 group">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama barang, kode, atau kategori..."
          class="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm dark:text-gray-100"
        />
      </div>

      <div class="flex gap-2">
        <button
          @click="openCategoryModal"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-sm"
        >
          <Plus class="w-4 h-4" />
          Kategori
        </button>
        <button
          @click="openItemModal"
          class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all text-sm"
        >
          <Plus class="w-4 h-4" />
          Item
        </button>
      </div>
    </div>

    <!-- Price Mode Toggle Switcher -->
    <div class="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          <Tags class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-gray-900 dark:text-white">Mode Tampilan Harga</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Pilih perspektif harga yang ditampilkan pada tabel di bawah
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
        <div class="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-full sm:w-auto">
          <button
            @click="priceMode = 'collector'"
            :class="priceMode === 'collector' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-sm font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium'"
            class="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-2"
          >
            <Building2 class="w-3.5 h-3.5" /> Harga Pengepul (Dasar)
          </button>
          <button
            @click="priceMode = 'customer'"
            :class="priceMode === 'customer' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-sm font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium'"
            class="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-2"
          >
            <Users class="w-3.5 h-3.5" /> Harga Nasabah (Warga)
          </button>
        </div>

        <button
          @click="handleExportPDF"
          class="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          title="Cetak PDF Daftar Harga sesuai mode aktif"
        >
          <FileText class="w-4 h-4" />
          PDF
        </button>
        <button
          @click="handleExportExcel"
          class="bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-300 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          title="Download Excel Daftar Harga sesuai mode aktif"
        >
          <FileSpreadsheet class="w-4 h-4" />
          Excel
        </button>
      </div>
    </div>

    <!-- Informative Banner for Customer Price Mode -->
    <div v-if="priceMode === 'customer'" class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-4 mb-6 flex items-start gap-3">
      <Lightbulb class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
      <div class="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
        <strong>Mode Harga Nasabah Aktif:</strong> Menampilkan estimasi harga bersih untuk nasabah setelah potongan Margin Pengurus sebesar <strong class="underline">{{ globalMarkupPercentage }}%</strong>. Harga dasar Pengepul ditampilkan sebagai pembanding dengan coretan abjad.
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
    </div>

    <!-- Items Table -->
    <div v-if="!loading && items.length > 0" class="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold border-b dark:border-gray-700">
            <tr>
              <th class="px-6 py-4 w-1/12 min-w-[120px]">Kode Barang</th>
              <th class="px-6 py-4 w-1/6 min-w-[150px]">Kategori</th>
              <th class="px-6 py-4 min-w-[200px]">Nama Barang</th>
              <th class="px-6 py-4 min-w-[180px] text-right">
                {{ priceMode === 'collector' ? 'Harga Pengepul / kg' : 'Harga Nasabah / kg' }}
              </th>
              <th class="px-6 py-4 w-24 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="item in filteredItems"
              :key="item._id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="px-6 py-4 font-medium text-gray-900 dark:text-white align-top">
                {{ item.itemCode }}
              </td>
              <td class="px-6 py-4 text-gray-600 dark:text-gray-400 align-top">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  {{ item.categoryId?.categoryName || 'Unknown' }}
                </span>
              </td>
              <td class="px-6 py-4 text-gray-900 dark:text-white align-top font-medium">
                {{ item.itemName }}
              </td>
              <td class="px-6 py-4 text-right align-top">
                <div v-if="priceMode === 'collector'">
                  <span class="text-green-600 dark:text-green-400 font-bold">
                    Rp {{ formatNumber(item.pelapakPrice) }}
                  </span>
                </div>
                <div v-else class="flex flex-col items-end">
                  <span class="text-blue-600 dark:text-blue-400 font-bold text-base">
                    Rp {{ formatNumber(getCustomerPrice(item.pelapakPrice)) }}
                  </span>
                  <span class="text-xs text-gray-400 dark:text-gray-500 line-through mt-0.5">
                    Rp {{ formatNumber(item.pelapakPrice) }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-center align-top">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="openEditItem(item)"
                    class="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    @click="confirmDeleteItem(item._id)"
                    class="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && items.length === 0" class="text-center py-12 bg-white dark:bg-gray-900 rounded-lg shadow">
      <div class="p-4 rounded-full bg-blue-100 text-blue-600 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <Package class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Belum ada data barang</h3>
      <p class="text-gray-500 mb-6 max-w-sm mx-auto">
        Koleksi barang masih kosong. Silahkan import data atau tambah manual.
      </p>
      <div class="flex justify-center gap-3">
        <button
          @click="openCategoryModal"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Tambah Kategori
        </button>
        <button
          @click="openItemModal"
          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          Tambah Item
        </button>
      </div>
    </div>

    <!-- Category Modal -->
    <teleport to="body">
      <div v-if="showCategoryModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
          <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">Tambah Kategori</h3>
          <form @submit.prevent="submitCategory">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1 dark:text-gray-300">Kode Kategori *</label>
                <input
                  v-model="categoryForm.categoryCode"
                  type="text"
                  required
                  placeholder="KERTAS"
                  class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 dark:text-gray-300">Nama Kategori *</label>
                <input
                  v-model="categoryForm.categoryName"
                  type="text"
                  required
                  placeholder="Kertas"
                  class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 dark:text-gray-300">Deskripsi</label>
                <textarea
                  v-model="categoryForm.description"
                  rows="2"
                  class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                ></textarea>
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button
                type="button"
                @click="showCategoryModal = false"
                class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {{ saving ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </teleport>

    <!-- Item Modal -->
    <teleport to="body">
      <div v-if="showItemModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
          <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">
            {{ isEditingItem ? 'Edit Item' : 'Tambah Item' }}
          </h3>
          <form @submit.prevent="submitItem">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1 dark:text-gray-300">Kategori *</label>
                <select
                  v-model="itemForm.categoryId"
                  required
                  class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Pilih Kategori</option>
                  <option v-for="cat in categories" :key="cat._id" :value="cat._id">
                    {{ cat.categoryName }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 dark:text-gray-300">Kode Item *</label>
                <input
                  v-model="itemForm.itemCode"
                  type="text"
                  required
                  :disabled="isEditingItem"
                  placeholder="KERTAS-001"
                  class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white disabled:opacity-50"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 dark:text-gray-300">Nama Item *</label>
                <input
                  v-model="itemForm.itemName"
                  type="text"
                  required
                  placeholder="Buku Tulis"
                  class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 dark:text-gray-300">Harga Pengepul / Pelapak (Rp/KG) *</label>
                <input
                  v-model.number="itemForm.pelapakPrice"
                  type="number"
                  required
                  min="0"
                  step="10"
                  placeholder="1400"
                  class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                />
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Harga dasar yang diterima dari pengepul/pelapak per kilogram.
                  <span v-if="globalMarkupPercentage > 0" class="block text-blue-600 dark:text-blue-400 font-semibold mt-1">
                    Est. Harga Nasabah (potongan {{ globalMarkupPercentage }}%): Rp {{ formatNumber(getCustomerPrice(itemForm.pelapakPrice)) }} / kg
                  </span>
                </p>
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button
                type="button"
                @click="showItemModal = false"
                class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
              >
                {{ saving ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { Plus, Pencil, Trash2, Search, FileText, FileSpreadsheet, Package, ArrowLeft, Tags, Building2, Users, Lightbulb } from 'lucide-vue-next';
import bankService from '@/services/bankService';
import BulkImportComponent from '@/components/waste-bank/BulkImportComponent.vue';
import { generatePriceListPDF, generatePriceListExcel } from '@/utils/priceListExport';
import Swal from 'sweetalert2';
import { confirmSave } from '@/utils/confirmDialog';

const categories = ref([]);
const items = ref([]);
const loading = ref(false);
const saving = ref(false);
const showCategoryModal = ref(false);
const showItemModal = ref(false);
const isEditingItem = ref(false);
const searchQuery = ref('');

const priceMode = ref('collector');
const globalMarkupPercentage = ref(0);

const getCustomerPrice = (pelapakPrice) => {
  const markup = (globalMarkupPercentage.value || 0) / 100;
  return Math.round((pelapakPrice || 0) * (1 - markup));
};

const handleExportPDF = async () => {
  if (filteredItems.value.length === 0) {
    Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Tidak ada data barang untuk diekspor' });
    return;
  }
  await generatePriceListPDF(filteredItems.value, priceMode.value, globalMarkupPercentage.value);
};

const handleExportExcel = () => {
  if (filteredItems.value.length === 0) {
    Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Tidak ada data barang untuk diekspor' });
    return;
  }
  generatePriceListExcel(filteredItems.value, priceMode.value, globalMarkupPercentage.value);
};

const filteredItems = computed(() => {
  let result = items.value;
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(item => 
      item.itemName.toLowerCase().includes(q) || 
      item.itemCode.toLowerCase().includes(q) ||
      (item.categoryId?.categoryName || '').toLowerCase().includes(q)
    );
  }
  
  return result.sort((a, b) => {
    return a.itemCode.localeCompare(b.itemCode, undefined, { numeric: true, sensitivity: 'base' });
  });
});


const categoryForm = ref({
  categoryCode: '',
  categoryName: '',
  description: ''
});

const itemForm = ref({
  categoryId: '',
  itemCode: '',
  itemName: '',
  pelapakPrice: 0
});

const formatNumber = (value) => {
  return new Intl.NumberFormat('id-ID').format(value || 0);
};

const fetchData = async () => {
  loading.value = true;
  try {
    const [catResponse, itemResponse, settingsResponse] = await Promise.all([
      bankService.getCategories(),
      bankService.getItems(),
      bankService.getSettings().catch(() => ({ data: { globalMarkupPercentage: 0 } }))
    ]);
    categories.value = catResponse.data.categories || [];
    items.value = itemResponse.data.items || [];
    globalMarkupPercentage.value = settingsResponse.data?.globalMarkupPercentage || 0;
  } catch (error) {
    console.error('Error fetching data:', error);
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Gagal memuat data',
      timer: 2000,
      showConfirmButton: false
    });
  } finally {
    loading.value = false;
  }
};

const openCategoryModal = () => {
  categoryForm.value = { categoryCode: '', categoryName: '', description: '' };
  showCategoryModal.value = true;
};

const openItemModal = () => {
  isEditingItem.value = false;
  itemForm.value = { categoryId: '', itemCode: '', itemName: '', pelapakPrice: 0 };
  showItemModal.value = true;
};

const openEditItem = (item) => {
  isEditingItem.value = true;
  itemForm.value = {
    _id: item._id,
    categoryId: item.categoryId?._id || item.categoryId,
    itemCode: item.itemCode,
    itemName: item.itemName,
    pelapakPrice: item.pelapakPrice
  };
  showItemModal.value = true;
};

const submitCategory = async () => {
  const ok = await confirmSave('menambahkan kategori baru');
  if (!ok) return;

  saving.value = true;
  try {
    await bankService.createCategory(categoryForm.value);
    Swal.fire({
      icon: 'success',
      title: 'Berhasil',
      text: 'Kategori berhasil ditambahkan!',
      timer: 2000,
      showConfirmButton: false
    });
    showCategoryModal.value = false;
    fetchData();
  } catch (error) {
    console.error('Error saving category:', error);
    Swal.fire({
      icon: 'error',
      title: 'Gagal',
      text: 'Gagal menyimpan kategori: ' + (error.response?.data?.message || error.message),
      confirmButtonColor: '#ef4444'
    });
  } finally {
    saving.value = false;
  }
};

const submitItem = async () => {
  const label = isEditingItem.value ? 'memperbarui item harga' : 'menambahkan item harga baru';
  const ok = await confirmSave(label);
  if (!ok) return;

  saving.value = true;
  try {
    if (isEditingItem.value) {
      await bankService.updateItem(itemForm.value._id, itemForm.value);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Item berhasil diupdate!',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      await bankService.createItem(itemForm.value);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Item berhasil ditambahkan!',
        timer: 2000,
        showConfirmButton: false
      });
    }
    showItemModal.value = false;
    fetchData();
  } catch (error) {
    console.error('Error saving item:', error);
    Swal.fire({
      icon: 'error',
      title: 'Gagal',
      text: 'Gagal menyimpan item: ' + (error.response?.data?.message || error.message),
      confirmButtonColor: '#ef4444'
    });
  } finally {
    saving.value = false;
  }
};

const confirmDeleteCategory = async (id) => {
  const result = await Swal.fire({
    title: 'Hapus Kategori?',
    text: "Menghapus kategori mungkin berdampak pada item di dalamnya.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  });

  if (!result.isConfirmed) return;

  try {
    await bankService.deleteCategory(id);
    Swal.fire({
      icon: 'success',
      title: 'Terhapus!',
      text: 'Kategori berhasil dihapus.',
      timer: 2000,
      showConfirmButton: false
    });
    fetchData();
  } catch (error) {
    console.error('Error deleting category:', error);
    Swal.fire({
      icon: 'error',
      title: 'Gagal',
      text: 'Gagal menghapus kategori',
      confirmButtonColor: '#ef4444'
    });
  }
};

const confirmDeleteItem = async (id) => {
  const result = await Swal.fire({
    title: 'Hapus Item?',
    text: "Data item akan dihapus permanen.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  });

  if (!result.isConfirmed) return;

  try {
    await bankService.deleteItem(id);
    Swal.fire({
      icon: 'success',
      title: 'Terhapus!',
      text: 'Item berhasil dihapus.',
      timer: 2000,
      showConfirmButton: false
    });
    fetchData();
  } catch (error) {
    console.error('Error deleting item:', error);
    Swal.fire({
      icon: 'error',
      title: 'Gagal',
      text: 'Gagal menghapus item',
      confirmButtonColor: '#ef4444'
    });
  }
};

const handleImported = (result) => {
  console.log('Import completed:', result);
  fetchData(); // Refresh the categories and items
};

onMounted(() => {
  fetchData();
});
</script>
