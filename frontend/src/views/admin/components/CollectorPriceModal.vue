<template>
  <div class="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')"></div>

    <div class="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="p-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-emerald-600 to-teal-500 flex-shrink-0">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-xl font-bold text-white flex items-center gap-2">
              <DollarSign class="w-5 h-5" />
              Harga Item — {{ collector?.collectorName }}
            </h3>
            <p class="text-emerald-100 text-sm mt-0.5">
              Atur harga khusus tiap item untuk pengepul ini. Kosongkan = pakai harga default.
            </p>
          </div>
          <button @click="$emit('close')" class="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition ml-4">
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex-1 flex items-center justify-center py-16">
        <div class="flex flex-col items-center gap-3 text-gray-400">
          <div class="w-10 h-10 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
          <span class="text-sm">Memuat data harga...</span>
        </div>
      </div>

      <!-- Table -->
      <div v-else class="flex-1 overflow-y-auto">
        <!-- Legend -->
        <div class="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex gap-4 text-xs text-gray-500 flex-wrap">
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-green-500"></span> Harga Lebih Tinggi dari Default</span>
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-yellow-400"></span> Harga Sama dengan Default</span>
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-red-400"></span> Harga Lebih Rendah dari Default</span>
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-gray-300"></span> Belum Diset (Pakai Default)</span>
        </div>

        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-xs uppercase tracking-wider">
            <tr>
              <th class="px-4 py-3 text-left">Item</th>
              <th class="px-4 py-3 text-left">Satuan</th>
              <th class="px-4 py-3 text-right">Harga Default (Rp)</th>
              <th class="px-4 py-3 text-right">Harga Pengepul (Rp)</th>
              <th class="px-4 py-3 text-center w-24">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-if="items.length === 0">
              <td colspan="5" class="py-10 text-center text-gray-400">Belum ada item aktif</td>
            </tr>
            <tr
              v-for="item in items"
              :key="item._id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
            >
              <!-- Item Name -->
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900 dark:text-white">{{ item.itemName }}</div>
                <div class="text-xs text-gray-400">{{ item.categoryId?.categoryName || '-' }}</div>
              </td>

              <!-- Unit -->
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ item.unit || 'Kg' }}</td>

              <!-- Default Price -->
              <td class="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-mono">
                {{ formatNumber(item.defaultPrice) }}
              </td>

              <!-- Collector Price Input -->
              <td class="px-4 py-3 text-right">
                <input
                  v-model.number="localPrices[item._id]"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="-"
                  class="w-28 px-2 py-1 text-right border border-gray-200 dark:border-gray-700 rounded-lg
                         dark:bg-gray-800 dark:text-white text-sm font-mono
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  @input="markDirty(item._id)"
                />
              </td>

              <!-- Status Badge -->
              <td class="px-4 py-3 text-center">
                <span :class="getPriceBadgeClass(item)" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold">
                  <span :class="getPriceDotClass(item)" class="w-1.5 h-1.5 rounded-full"></span>
                  {{ getPriceLabel(item) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="p-5 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 flex justify-between items-center">
        <p class="text-xs text-gray-400">
          <span class="font-semibold text-emerald-600">{{ dirtyCount }}</span> item belum disimpan
        </p>
        <div class="flex gap-3">
          <button
            @click="$emit('close')"
            class="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300
                   hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-sm transition"
          >
            Batal
          </button>
          <button
            @click="saveAll"
            :disabled="saving || dirtyCount === 0"
            class="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm
                   transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span v-if="saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <Save v-else class="w-4 h-4" />
            {{ saving ? 'Menyimpan...' : `Simpan ${dirtyCount > 0 ? dirtyCount + ' Item' : 'Semua'}` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { X, DollarSign, Save } from 'lucide-vue-next';
import * as bankService from '@/services/bankService';
import Swal from 'sweetalert2';
import { confirmSave } from '@/utils/confirmDialog';

const props = defineProps({
  collector: { type: Object, required: true },
});
const emit = defineEmits(['close', 'saved']);

const loading = ref(false);
const saving = ref(false);
const items = ref([]);
const localPrices = ref({}); // { [itemId]: price|null }
const dirtyItems = ref(new Set()); // itemIds yang sudah diubah

const dirtyCount = computed(() => dirtyItems.value.size);

const markDirty = (itemId) => {
  dirtyItems.value.add(itemId);
};

const formatNumber = (v) => new Intl.NumberFormat('id-ID').format(v || 0);

// Price label & color helpers
const getPriceLabel = (item) => {
  const cp = localPrices.value[item._id];
  if (cp === null || cp === undefined || cp === '' || cp === 0) return 'Default';
  if (cp > item.defaultPrice) return '↑ Lebih Tinggi';
  if (cp < item.defaultPrice) return '↓ Lebih Rendah';
  return '= Sama';
};

const getPriceBadgeClass = (item) => {
  const cp = localPrices.value[item._id];
  if (!cp) return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
  if (cp > item.defaultPrice) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (cp < item.defaultPrice) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
};

const getPriceDotClass = (item) => {
  const cp = localPrices.value[item._id];
  if (!cp) return 'bg-gray-400';
  if (cp > item.defaultPrice) return 'bg-green-500';
  if (cp < item.defaultPrice) return 'bg-red-400';
  return 'bg-yellow-400';
};

const loadData = async () => {
  loading.value = true;
  try {
    const res = await bankService.getCollectorItemPrices(props.collector._id);
    items.value = res.data.items || [];

    // Populate localPrices dari data yang ada
    const prices = {};
    items.value.forEach(item => {
      prices[item._id] = item.collectorPrice ?? '';
    });
    localPrices.value = prices;
    dirtyItems.value = new Set();
  } catch (err) {
    console.error('Load error:', err);
    alert('Gagal memuat data harga: ' + (err.response?.data?.message || err.message));
  } finally {
    loading.value = false;
  }
};

const saveAll = async () => {
  if (dirtyItems.value.size === 0) return;

  const ok = await confirmSave(`menyimpan ${dirtyItems.value.size} perubahan harga pengepul`);
  if (!ok) return;

  saving.value = true;

  try {
    // Bangun payload hanya untuk item yang dirty
    const prices = Array.from(dirtyItems.value).map(itemId => ({
      itemId,
      price: localPrices.value[itemId] || null,
    }));

    const res = await bankService.setCollectorItemPrices(props.collector._id, prices);
    
    // Reset dirty state
    dirtyItems.value = new Set();
    
    // Reload untuk sinkronisasi
    await loadData();
    
    emit('saved');
    Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 2000, showConfirmButton: false });
  } catch (err) {
    console.error('Save error:', err);
    Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || err.message });
  } finally {
    saving.value = false;
  }
};

onMounted(loadData);
</script>
