<template>
  <div class="section-card md:rounded-xl mb-4 md:mb-6">
    <div class="space-y-3">
      <!-- Tahun -->
      <div class="relative" ref="yearDropdownRef">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Tahun</p>
        <button
          type="button"
          @click.stop="toggleYearDropdown"
          class="w-full flex items-center justify-between gap-2 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
        >
          <span>{{ filterYear ? filterYear : 'Semua Waktu' }}</span>
          <ChevronDown class="w-4 h-4 shrink-0 text-gray-400" :class="{ 'rotate-180': showYearDropdown }" />
        </button>
        <div
          v-if="showYearDropdown"
          class="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-52 overflow-y-auto"
        >
          <button
            v-for="y in yearOptions"
            :key="y"
            type="button"
            @click="selectYear(y)"
            class="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800"
            :class="filterYear === y ? 'text-green-600 font-semibold' : 'text-gray-700 dark:text-gray-200'"
          >
            {{ y }}
          </button>
          <button
            type="button"
            @click="selectYear(null)"
            class="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            :class="filterYear === null ? 'text-green-600 font-semibold' : 'text-gray-700 dark:text-gray-200'"
          >
            Semua Waktu
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mulai Tanggal</label>
          <div class="relative">
            <CalendarIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              v-model="filters.startDate"
              type="date"
              class="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sampai Tanggal</label>
          <div class="relative">
            <CalendarIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              v-model="filters.endDate"
              type="date"
              class="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div>
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Status</p>
        <div class="grid grid-cols-3 gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-1">
          <button
            v-for="opt in statusOptions"
            :key="opt.value"
            type="button"
            @click="filters.status = opt.value"
            class="px-2 py-2 text-xs sm:text-sm rounded-lg font-medium transition-colors"
            :class="filters.status === opt.value
              ? 'bg-green-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          @click="applyFilters"
          class="bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 flex items-center justify-center text-sm font-semibold gap-2"
        >
          <FilterIcon class="h-4 w-4" />
          Terapkan
        </button>
        <button
          type="button"
          @click="resetFilters"
          class="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium"
        >
          Reset
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { CalendarIcon, FilterIcon, ChevronDown } from 'lucide-vue-next';

const emit = defineEmits(['filter']);

const currentYear = new Date().getFullYear();
const filterYear = ref(currentYear);
const yearOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];
const showYearDropdown = ref(false);
const yearDropdownRef = ref(null);

const statusOptions = [
  { value: 'ALL', label: 'Semua' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Batal' },
];

const filters = reactive({
  startDate: '',
  endDate: '',
  status: 'ALL',
});

const toggleYearDropdown = () => {
  showYearDropdown.value = !showYearDropdown.value;
};

const selectYear = (year) => {
  filterYear.value = year;
  showYearDropdown.value = false;
  handleYearChange();
};

const handleYearChange = () => {
  if (filterYear.value) {
    filters.startDate = `${filterYear.value}-01-01`;
    filters.endDate = `${filterYear.value}-12-31`;
  } else {
    filters.startDate = '';
    filters.endDate = '';
  }
};

const applyFilters = () => {
  emit('filter', { ...filters });
};

const resetFilters = () => {
  filterYear.value = currentYear;
  handleYearChange();
  filters.status = 'ALL';
  emit('filter', { ...filters });
};

const handleClickOutside = (event) => {
  if (yearDropdownRef.value && !yearDropdownRef.value.contains(event.target)) {
    showYearDropdown.value = false;
  }
};

onMounted(() => {
  handleYearChange();
  applyFilters();
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
