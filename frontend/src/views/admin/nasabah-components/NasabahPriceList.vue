<template>
  <div class="px-4 py-6 sm:p-6 pb-nav-mobile space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-2">
        <div>
             <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Daftar Harga</h2>
             <p class="text-sm text-gray-500">Harga dapat berubah sewaktu-waktu tanpa persetujuan pihak Bank Sampah</p>
        </div>
        <div class="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600">
            <Coins class="w-6 h-6" />
        </div>
      </div>

      <!-- Search & Sort -->
      <div class="flex gap-3">
          <div class="relative flex-1">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Cari jenis sampah..."
                  class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 outline-none transition dark:text-white shadow-sm"
              >
          </div>

          <!-- Sort Dropdown -->
          <div class="relative min-w-[140px]">
              <select
                  v-model="sortBy"
                  class="w-full h-full pl-3 pr-8 appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
              >
                  <option value="alphabetical">Abjad A-Z</option>
                  <option value="price_high">Harga Tertinggi</option>
                  <option value="price_low">Harga Terendah</option>
              </select>
              <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ArrowDownLeft class="w-4 h-4 rotate-45" />
              </div>
          </div>
      </div>

      <!-- Category Filter (Horizontal Scroll) -->
      <div class="flex overflow-x-auto pb-2 gap-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
              v-for="cat in availableCategories"
              :key="cat"
              @click="selectedCategory = cat"
              class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border"
              :class="selectedCategory === cat
                  ? 'bg-green-600 text-white border-green-600 shadow-md transform scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'"
          >
              {{ cat }}
          </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div v-for="i in 4" :key="i" class="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
      </div>

      <!-- ITEMS GRID -->
      <div v-else-if="filteredItems.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            v-for="item in filteredItems"
            :key="item._id"
            class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center group hover:shadow-md transition"
          >
              <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300">
                     <PackageOpen class="w-6 h-6" />
                  </div>
                  <div>
                      <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {{ item.itemName }}
                        <span v-if="!item.isActive" class="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase font-bold">Non-Aktif</span>
                      </h3>
                      <p class="text-xs text-gray-500">{{ item.categoryId?.categoryName || 'Umum' }}</p>
                  </div>
              </div>
              <div class="text-right">
                  <p class="text-lg font-bold text-green-600 dark:text-green-400">
                    {{ formatCurrency(calculateCustomerPrice(item.pelapakPrice)) }}
                  </p>
                  <p class="text-xs text-gray-400">/ {{ item.unit }}</p>
              </div>
          </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
           <Search class="w-12 h-12 text-gray-300 mx-auto mb-3" />
           <p class="text-gray-500 font-medium">Tidak ada item ditemukan</p>
           <button @click="resetFilters" class="text-green-600 text-sm font-medium mt-2 hover:underline">Reset Filter</button>
      </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Coins, Search, ArrowDownLeft, PackageOpen } from 'lucide-vue-next';

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  markupPercentage: {
    type: Number,
    default: 0
  }
});

const searchQuery = ref('');
const selectedCategory = ref('Semua');
const sortBy = ref('alphabetical');

const calculateCustomerPrice = (pelapakPrice) => {
  if (!pelapakPrice) return 0;
  return pelapakPrice * (1 - (props.markupPercentage / 100));
};

const availableCategories = computed(() => {
    const unique = new Set(props.items.map(i => i.categoryId?.categoryName).filter(Boolean));
    return ['Semua', ...Array.from(unique).sort()];
});

const filteredItems = computed(() => {
  let result = props.items;

  // 1. Search Filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(i =>
       i.itemName.toLowerCase().includes(q) ||
       i.categoryId?.categoryName?.toLowerCase().includes(q)
    );
  }

  // 2. Category Filter
  if (selectedCategory.value && selectedCategory.value !== 'Semua') {
      result = result.filter(i => i.categoryId?.categoryName === selectedCategory.value);
  }

  // 3. Sorting
  return [...result].sort((a, b) => {
      const priceA = calculateCustomerPrice(a.pelapakPrice);
      const priceB = calculateCustomerPrice(b.pelapakPrice);

      switch (sortBy.value) {
          case 'price_high':
              return priceB - priceA;
          case 'price_low':
              return priceA - priceB;
          case 'alphabetical':
          default:
              return a.itemName.localeCompare(b.itemName);
      }
  });
});

const resetFilters = () => {
    searchQuery.value = '';
    selectedCategory.value = 'Semua';
    sortBy.value = 'alphabetical';
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};
</script>
