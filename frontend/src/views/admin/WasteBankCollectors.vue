<template>
  <div class="p-4 sm:p-8 bg-gray-50 dark:bg-gray-950 min-h-full">
    <!-- Page Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div class="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <Truck class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          Manajemen Pengepul
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Kelola daftar pengepul dan harga item per pengepul
        </p>
      </div>
      <div class="flex gap-3">
        <router-link to="/admin/dashboard" class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1">
          ← Dashboard
        </router-link>
        <button
          @click="openAddModal"
          class="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-emerald-600/20"
        >
          <Plus class="w-4 h-4" />
          Tambah Pengepul
        </button>
      </div>
    </div>

    <!-- Stats Banner -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
        <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Pengepul</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ collectors.length }}</p>
      </div>
      <div class="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
        <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Aktif</p>
        <p class="text-2xl font-bold text-emerald-600 mt-1">{{ collectors.filter(c => c.isActive).length }}</p>
      </div>
      <div class="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
        <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Nonaktif</p>
        <p class="text-2xl font-bold text-gray-400 mt-1">{{ collectors.filter(c => !c.isActive).length }}</p>
      </div>
      <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
        <p class="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide">Info</p>
        <p class="text-xs text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
          Klik <strong>💰 Harga</strong> untuk atur harga tiap item per pengepul
        </p>
      </div>
    </div>

    <!-- Table Card -->
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <!-- Table Header with search -->
      <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <h2 class="font-semibold text-gray-900 dark:text-white">Daftar Pengepul</h2>
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama / kode..."
            class="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-emerald-500 w-56"
          />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="py-16 flex flex-col items-center gap-3 text-gray-400">
        <div class="w-10 h-10 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
        <span class="text-sm">Memuat data pengepul...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredCollectors.length === 0" class="py-16 flex flex-col items-center gap-3 text-gray-400">
        <Truck class="w-12 h-12 opacity-30" />
        <p class="text-sm" v-if="searchQuery">Tidak ada pengepul yang cocok dengan "{{ searchQuery }}"</p>
        <p class="text-sm" v-else>Belum ada pengepul. Klik <strong>+ Tambah Pengepul</strong> untuk mulai.</p>
      </div>

      <!-- Desktop Table -->
      <div v-else class="hidden md:block overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th class="px-6 py-3 text-left">Kode</th>
              <th class="px-6 py-3 text-left">Nama Pengepul</th>
              <th class="px-6 py-3 text-left">Telepon</th>
              <th class="px-6 py-3 text-left">Alamat</th>
              <th class="px-6 py-3 text-center">Status</th>
              <th class="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="collector in filteredCollectors"
              :key="collector._id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
            >
              <td class="px-6 py-4 font-mono font-semibold text-emerald-700 dark:text-emerald-400 text-xs">
                {{ collector.collectorCode }}
              </td>
              <td class="px-6 py-4">
                <div class="font-semibold text-gray-900 dark:text-white">{{ collector.collectorName }}</div>
                <div v-if="collector.notes" class="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{{ collector.notes }}</div>
              </td>
              <td class="px-6 py-4 text-gray-600 dark:text-gray-300">{{ collector.phone || '-' }}</td>
              <td class="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">{{ collector.address || '-' }}</td>
              <td class="px-6 py-4 text-center">
                <span :class="collector.isActive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'"
                  class="px-2.5 py-1 rounded-full text-xs font-semibold"
                >
                  {{ collector.isActive ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <!-- Harga Button -->
                  <button
                    @click="openPriceModal(collector)"
                    class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700
                           dark:bg-teal-900/20 dark:hover:bg-teal-900/40 dark:text-teal-400 text-xs font-semibold transition"
                    title="Atur Harga Item"
                  >
                    <DollarSign class="w-3.5 h-3.5" />
                    Harga
                  </button>
                  <!-- Edit Button -->
                  <button
                    @click="openEditModal(collector)"
                    class="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                    title="Edit"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <!-- Toggle Active -->
                  <button
                    @click="toggleActive(collector)"
                    :class="collector.isActive ? 'hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20' : 'hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'"
                    class="p-1.5 rounded-lg text-gray-400 transition"
                    :title="collector.isActive ? 'Nonaktifkan' : 'Aktifkan'"
                  >
                    <component :is="collector.isActive ? ToggleRight : ToggleLeft" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="block md:hidden divide-y divide-gray-100 dark:divide-gray-800">
        <div
          v-for="collector in filteredCollectors"
          :key="collector._id"
          class="p-4"
        >
          <div class="flex justify-between items-start mb-3">
            <div>
              <span class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{{ collector.collectorCode }}</span>
              <h3 class="font-semibold text-gray-900 dark:text-white mt-0.5">{{ collector.collectorName }}</h3>
              <p v-if="collector.phone" class="text-xs text-gray-500 dark:text-gray-400">{{ collector.phone }}</p>
            </div>
            <span :class="collector.isActive
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-500'"
              class="px-2 py-0.5 rounded-full text-xs font-semibold"
            >
              {{ collector.isActive ? 'Aktif' : 'Nonaktif' }}
            </span>
          </div>
          <div class="flex gap-2">
            <button @click="openPriceModal(collector)" class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-teal-50 text-teal-700 text-xs font-semibold">
              <DollarSign class="w-3.5 h-3.5" /> Atur Harga
            </button>
            <button @click="openEditModal(collector)" class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold">
              <Pencil class="w-3.5 h-3.5" /> Edit
            </button>
            <button @click="toggleActive(collector)" class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 text-gray-600 text-xs font-semibold">
              <component :is="collector.isActive ? ToggleRight : ToggleLeft" class="w-4 h-4" />
              {{ collector.isActive ? 'Nonaktifkan' : 'Aktifkan' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CollectorFormModal
      v-if="showFormModal"
      :collector="editingCollector"
      @close="showFormModal = false"
      @saved="onCollectorSaved"
    />

    <CollectorPriceModal
      v-if="showPriceModal && pricingCollector"
      :collector="pricingCollector"
      @close="showPriceModal = false"
      @saved="fetchCollectors"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Truck, Plus, Search, DollarSign, Pencil, ToggleLeft, ToggleRight } from 'lucide-vue-next';
import CollectorFormModal from './components/CollectorFormModal.vue';
import CollectorPriceModal from './components/CollectorPriceModal.vue';
import * as bankService from '@/services/bankService';
import Swal from 'sweetalert2';
import { confirmAction } from '@/utils/confirmDialog';

const collectors = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const showFormModal = ref(false);
const showPriceModal = ref(false);
const editingCollector = ref(null);
const pricingCollector = ref(null);

const filteredCollectors = computed(() => {
  const q = searchQuery.value.toLowerCase();
  if (!q) return collectors.value;
  return collectors.value.filter(c =>
    c.collectorName.toLowerCase().includes(q) ||
    c.collectorCode.toLowerCase().includes(q) ||
    (c.phone || '').includes(q)
  );
});

const fetchCollectors = async () => {
  loading.value = true;
  try {
    const res = await bankService.getCollectors();
    collectors.value = res.data || [];
  } catch (err) {
    console.error('Error fetching collectors:', err);
    alert('Gagal memuat data pengepul');
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  editingCollector.value = null;
  showFormModal.value = true;
};

const openEditModal = (collector) => {
  editingCollector.value = collector;
  showFormModal.value = true;
};

const openPriceModal = (collector) => {
  pricingCollector.value = collector;
  showPriceModal.value = true;
};

const onCollectorSaved = () => {
  showFormModal.value = false;
  fetchCollectors();
};

const toggleActive = async (collector) => {
  const action = collector.isActive ? 'nonaktifkan' : 'aktifkan';
  const ok = await confirmAction({
    title: `${action.charAt(0).toUpperCase() + action.slice(1)} Pengepul?`,
    text: `Apakah Anda yakin ingin ${action} pengepul "${collector.collectorName}"?`,
    confirmText: `Ya, ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    icon: 'question',
    danger: collector.isActive,
  });
  if (!ok) return;

  try {
    await bankService.updateCollector(collector._id, { isActive: !collector.isActive });
    await fetchCollectors();
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || err.message });
  }
};

onMounted(fetchCollectors);
</script>
