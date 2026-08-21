<template>
  <div class="min-h-screen bg-slate-50 dark:bg-black mobile-gutter py-4 md:p-6 overflow-x-hidden pb-nav-mobile">
    <!-- Header -->
    <div class="mb-5 md:mb-6">
      <router-link
        to="/admin/customers"
        class="text-sm text-slate-600 dark:text-slate-400 hover:text-green-600 inline-flex items-center mb-2"
      >
        <ChevronLeft class="w-4 h-4 mr-1 shrink-0" />
        Kembali ke Daftar Nasabah
      </router-link>
      <h1 class="hidden md:block text-2xl font-bold text-slate-900 dark:text-white">
        Mutasi Transaksi
      </h1>
      <div v-if="customer" class="mt-1 space-y-1">
        <p class="font-semibold text-slate-900 dark:text-white break-words leading-snug">{{ customer.name }}</p>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono">{{ customer.accountNumber }}</p>
        <p class="text-sm font-bold text-green-600 dark:text-green-400">
          Saldo: {{ formatCurrency(customer.currentBalance) }}
        </p>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-5 md:mb-6">
      <div class="bg-white dark:bg-slate-900 rounded-xl shadow p-4 md:p-6 border border-slate-200 dark:border-slate-700">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Penimbangan</p>
            <p class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{{ summary.weighing.count }}x</p>
            <p class="text-xs sm:text-sm text-green-600 truncate">{{ formatCurrency(summary.weighing.total) }}</p>
          </div>
          <Scale class="w-8 h-8 sm:w-10 sm:h-10 text-green-500 shrink-0" />
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-xl shadow p-4 md:p-6 border border-slate-200 dark:border-slate-700">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Penarikan</p>
            <p class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{{ summary.withdrawal.count }}x</p>
            <p class="text-xs sm:text-sm text-red-600 truncate">{{ formatCurrency(summary.withdrawal.total) }}</p>
          </div>
          <TrendingDown class="w-8 h-8 sm:w-10 sm:h-10 text-red-500 shrink-0" />
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-xl shadow p-4 md:p-6 border border-slate-200 dark:border-slate-700">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Transfer</p>
            <p class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{{ summary.transfer.count }}x</p>
            <p class="text-[11px] sm:text-sm text-blue-600 leading-tight">
              ↓ {{ formatCurrency(summary.transfer.totalIn) }} / ↑ {{ formatCurrency(summary.transfer.totalOut) }}
            </p>
          </div>
          <ArrowRightLeft class="w-8 h-8 sm:w-10 sm:h-10 text-blue-500 shrink-0" />
        </div>
      </div>
    </div>

    <!-- Trend Chart Section -->
    <div
      v-if="!loading && transactions.some(tx => tx.type === 'weighing')"
      class="bg-white dark:bg-slate-900 rounded-xl shadow p-4 md:p-6 mb-5 md:mb-6 border border-slate-200 dark:border-slate-700 overflow-hidden max-w-full"
    >
      <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
        <TrendingUp class="w-4 h-4 text-green-600 shrink-0" />
        Tren Nilai Penimbangan
      </h3>
      <div class="chart-canvas-wrap h-48 sm:h-64 w-full max-w-full overflow-hidden">
        <canvas ref="trendChartRef"></canvas>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-900 rounded-xl shadow p-4 mb-5 md:mb-6 border border-slate-200 dark:border-slate-700">
      <div class="space-y-3">
        <div>
          <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Jenis Transaksi</p>
          <div class="grid grid-cols-2 sm:flex sm:flex-wrap rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-1 gap-1">
            <button
              v-for="opt in typeOptions"
              :key="opt.value"
              type="button"
              @click="setTypeFilter(opt.value)"
              class="sm:flex-1 px-2 py-2 text-xs sm:text-sm rounded-lg font-medium transition-colors"
              :class="filters.type === opt.value
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="relative" ref="periodDropdownRef">
          <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Periode</p>
          <button
            type="button"
            @click.stop="togglePeriodDropdown"
            class="w-full flex items-center justify-between gap-2 px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
          >
            <span class="truncate">{{ selectedPeriodLabel }}</span>
            <ChevronDown class="w-4 h-4 shrink-0 text-slate-400" :class="{ 'rotate-180': showPeriodDropdown }" />
          </button>
          <div
            v-if="showPeriodDropdown"
            class="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-52 overflow-y-auto"
          >
            <button
              v-for="opt in periodOptions"
              :key="opt.value"
              type="button"
              @click="selectPeriod(opt.value)"
              class="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
              :class="filters.months === opt.value ? 'text-green-600 font-semibold' : 'text-slate-700 dark:text-slate-200'"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div v-if="filters.months === 'custom'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Dari Tanggal</label>
            <input
              v-model="filters.startDate"
              type="date"
              @change="fetchTransactions"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Sampai Tanggal</label>
            <input
              v-model="filters.endDate"
              type="date"
              @change="fetchTransactions"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            @click="fetchTransactions"
            class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl flex items-center justify-center gap-2 text-sm font-medium"
          >
            <RefreshCcw class="w-4 h-4" />
            Refresh
          </button>
          <button
            type="button"
            @click="exportToExcel"
            :disabled="exporting || loading"
            class="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="exporting" class="w-4 h-4 animate-spin" />
            <Download v-else class="w-4 h-4" />
            {{ exporting ? 'Mengekspor...' : 'Export' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-green-600" />
    </div>

    <!-- Transactions -->
    <div v-else class="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden max-w-full">
      <!-- Mobile: kartu transaksi -->
      <div class="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
        <div v-if="transactions.length === 0" class="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
          <FileX class="w-10 h-10 mx-auto mb-2 opacity-50" />
          Tidak ada transaksi di periode ini
        </div>
        <article
          v-for="tx in transactions"
          :key="tx.id"
          class="p-4"
        >
          <div class="flex items-start justify-between gap-3 mb-2">
            <span
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
              :class="getTypeClass(tx.type)"
            >
              <component :is="getTypeIcon(tx.type)" class="w-3.5 h-3.5" />
              {{ getTypeLabel(tx.type) }}
            </span>
            <p
              class="text-sm font-bold shrink-0 text-right"
              :class="tx.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
            >
              {{ tx.amount >= 0 ? '+' : '' }}{{ formatCurrency(tx.amount) }}
            </p>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ formatDate(tx.date) }}</p>
          <p class="text-sm text-slate-800 dark:text-slate-200 mt-1 break-words">{{ tx.description }}</p>
          <p v-if="tx.itemsDetail" class="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">{{ tx.itemsDetail }}</p>
          <p v-if="tx.counterparty" class="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">{{ tx.counterparty }}</p>
          <p v-if="tx.officer" class="text-xs text-slate-400 mt-2">Admin: {{ tx.officer }}</p>
        </article>
      </div>

      <!-- Desktop: tabel -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full table-fixed">
          <thead class="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider w-40">
                Tanggal
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider w-28">
                Jenis
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Keterangan
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider w-32">
                Jumlah
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider w-28">
                Admin
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
            <tr v-if="transactions.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                <FileX class="w-12 h-12 mx-auto mb-2 opacity-50" />
                Tidak ada transaksi di periode ini
              </td>
            </tr>
            <tr
              v-for="tx in transactions"
              :key="tx.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <td class="px-4 py-4 text-sm text-slate-900 dark:text-white">
                {{ formatDate(tx.date) }}
              </td>
              <td class="px-4 py-4">
                <span
                  class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                  :class="getTypeClass(tx.type)"
                >
                  <component :is="getTypeIcon(tx.type)" class="w-4 h-4" />
                  {{ getTypeLabel(tx.type) }}
                </span>
              </td>
              <td class="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                <div class="break-words">{{ tx.description }}</div>
                <div v-if="tx.itemsDetail" class="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">
                  {{ tx.itemsDetail }}
                </div>
                <div v-if="tx.counterparty" class="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">
                  {{ tx.counterparty }}
                </div>
              </td>
              <td class="px-4 py-4 text-sm font-semibold text-right" :class="tx.amount >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ tx.amount >= 0 ? '+' : '' }}{{ formatCurrency(tx.amount) }}
              </td>
              <td class="px-4 py-4 text-sm text-slate-700 dark:text-slate-300 break-words">
                {{ tx.officer || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="pagination.totalPages > 1"
        class="bg-slate-50 dark:bg-slate-800 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 dark:border-slate-700"
      >
        <div class="text-xs sm:text-sm text-slate-700 dark:text-slate-300 text-center sm:text-left">
          {{ paginationStart }}–{{ paginationEnd }} dari {{ pagination.totalTransactions }} transaksi
        </div>
        <div class="flex items-center justify-center gap-2">
          <button
            type="button"
            @click="changePage(pagination.currentPage - 1)"
            :disabled="pagination.currentPage === 1"
            class="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
            {{ pagination.currentPage }} / {{ pagination.totalPages }}
          </span>
          <button
            type="button"
            @click="changePage(pagination.currentPage + 1)"
            :disabled="pagination.currentPage === pagination.totalPages"
            class="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick, watch } from 'vue';
import Chart from 'chart.js/auto';
import * as XLSX from 'xlsx';
import { useRoute } from 'vue-router';
import { getCustomerTransactions } from '@/services/bankService';
import {
  Scale,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  ChevronLeft,
  Download,
  RefreshCcw,
  Loader2,
  FileX,
  ChevronRight,
  ChevronDown,
} from 'lucide-vue-next';

const route = useRoute();
const customerId = route.params.id;

const loading = ref(false);
const exporting = ref(false);
const customer = ref(null);
const transactions = ref([]);
const summary = ref({
  weighing: { count: 0, total: 0 },
  withdrawal: { count: 0, total: 0 },
  transfer: { count: 0, totalIn: 0, totalOut: 0 },
});
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  totalTransactions: 0,
  limit: 20,
});

const trendChartRef = ref(null);
let trendChartInstance = null;

const filters = ref({
  type: 'all',
  months: '3',
  startDate: '',
  endDate: '',
  page: 1,
});

const typeOptions = [
  { value: 'all', label: 'Semua' },
  { value: 'weighing', label: 'Timbang' },
  { value: 'withdrawal', label: 'Tarik' },
  { value: 'transfer', label: 'Transfer' },
];

const periodOptions = [
  { value: '1', label: '1 Bulan Terakhir' },
  { value: '3', label: '3 Bulan Terakhir' },
  { value: '6', label: '6 Bulan Terakhir' },
  { value: '12', label: '12 Bulan Terakhir' },
  { value: 'custom', label: 'Rentang Tanggal...' },
];

const showPeriodDropdown = ref(false);
const periodDropdownRef = ref(null);

const selectedPeriodLabel = computed(() => {
  const match = periodOptions.find((opt) => opt.value === filters.value.months);
  return match?.label || 'Pilih Periode';
});

const paginationStart = computed(() => ((pagination.value.currentPage - 1) * pagination.value.limit) + 1);
const paginationEnd = computed(() => Math.min(
  pagination.value.currentPage * pagination.value.limit,
  pagination.value.totalTransactions,
));

const isMobileChart = () => typeof window !== 'undefined' && window.innerWidth < 640;

const compactCurrency = (value) => {
  const abs = Math.abs(value || 0);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)} jt`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1)} rb`;
  return formatCurrency(value).replace(',00', '');
};

const fetchTransactions = async () => {
  loading.value = true;
  try {
    const params = {
      type: filters.value.type,
      page: filters.value.page,
      limit: 20,
    };

    if (filters.value.months !== 'custom') {
      params.months = filters.value.months;
    } else if (filters.value.startDate && filters.value.endDate) {
      params.startDate = filters.value.startDate;
      params.endDate = filters.value.endDate;
    }

    const response = await getCustomerTransactions(customerId, params);

    if (response.success) {
      customer.value = response.data.customer;
      transactions.value = response.data.transactions;
      summary.value = response.data.summary;
      pagination.value = response.data.pagination;
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
  } finally {
    loading.value = false;
  }
};

const renderTrendChart = () => {
  if (!trendChartRef.value) return;

  const weighingData = transactions.value
    .filter((tx) => tx.type === 'weighing')
    .map((tx) => ({
      date: new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      amount: tx.amount,
    }))
    .reverse();

  if (weighingData.length === 0) {
    if (trendChartInstance) {
      trendChartInstance.destroy();
      trendChartInstance = null;
    }
    return;
  }

  if (trendChartInstance) {
    trendChartInstance.destroy();
  }

  const mobile = isMobileChart();
  const ctx = trendChartRef.value.getContext('2d');
  trendChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weighingData.map((d) => d.date),
      datasets: [{
        label: 'Nilai Penimbangan (Rp)',
        data: weighingData.map((d) => d.amount),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(34, 197, 94, 1)',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` ${formatCurrency(context.parsed.y)}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            maxTicksLimit: mobile ? 5 : 8,
            font: { size: mobile ? 10 : 12 },
            callback: (value) => compactCurrency(value),
          },
        },
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: mobile ? 45 : 0,
            minRotation: mobile ? 45 : 0,
            font: { size: mobile ? 10 : 12 },
          },
        },
      },
    },
  });
};

const handleChartResize = () => {
  if (trendChartInstance) {
    trendChartInstance.resize();
    renderTrendChart();
  }
};

watch(transactions, async () => {
  await nextTick();
  setTimeout(renderTrendChart, 100);
}, { deep: true });

const setTypeFilter = (value) => {
  filters.value.type = value;
  filters.value.page = 1;
  fetchTransactions();
};

const togglePeriodDropdown = () => {
  showPeriodDropdown.value = !showPeriodDropdown.value;
};

const selectPeriod = (value) => {
  filters.value.months = value;
  showPeriodDropdown.value = false;
  onMonthRangeChange();
};

const onMonthRangeChange = () => {
  if (filters.value.months !== 'custom') {
    filters.value.startDate = '';
    filters.value.endDate = '';
    filters.value.page = 1;
    fetchTransactions();
  }
};

const changePage = (page) => {
  filters.value.page = page;
  fetchTransactions();
};

const getExportParams = () => {
  const params = {
    type: filters.value.type,
    page: 1,
    limit: 100000,
  };

  if (filters.value.months !== 'custom') {
    params.months = filters.value.months;
  } else if (filters.value.startDate && filters.value.endDate) {
    params.startDate = filters.value.startDate;
    params.endDate = filters.value.endDate;
  }

  return params;
};

const getPeriodExportSlug = () => {
  if (filters.value.months === 'custom' && filters.value.startDate && filters.value.endDate) {
    return `${filters.value.startDate}_sd_${filters.value.endDate}`;
  }
  const match = periodOptions.find((opt) => opt.value === filters.value.months);
  return (match?.label || 'periode').replace(/\s+/g, '_').replace(/[^\w-]/g, '');
};

const buildExportRows = (txList) => txList.map((tx, index) => ({
  No: index + 1,
  Tanggal: formatDate(tx.date),
  'ID Transaksi': tx.id,
  Jenis: getTypeLabel(tx.type),
  Keterangan: tx.description,
  'Detail Item': tx.itemsDetail || '',
  'Pihak Lawan': tx.counterparty || '',
  'Berat (kg)': tx.weight ?? '',
  'Jumlah (Rp)': tx.amount,
  Petugas: tx.officer || '',
  Catatan: tx.notes || '',
}));

const exportToExcel = async () => {
  exporting.value = true;
  try {
    const response = await getCustomerTransactions(customerId, getExportParams());

    if (!response.success) {
      alert('Gagal mengambil data untuk export.');
      return;
    }

    const { customer: cust, transactions: txList, summary: sum } = response.data;

    if (!txList.length) {
      alert('Tidak ada transaksi untuk diekspor pada periode ini.');
      return;
    }

    const workbook = XLSX.utils.book_new();

    const summaryRows = [
      ['LAPORAN MUTASI NASABAH'],
      [],
      ['Nama Nasabah', cust.name],
      ['No. Rekening', cust.accountNumber],
      ['Saldo Saat Ini (Rp)', cust.currentBalance],
      ['Periode', selectedPeriodLabel.value],
      ['Filter Jenis', typeOptions.find((opt) => opt.value === filters.value.type)?.label || 'Semua'],
      [],
      ['Ringkasan Transaksi', 'Jumlah', 'Total (Rp)'],
      ['Penimbangan', sum.weighing.count, sum.weighing.total],
      ['Penarikan', sum.withdrawal.count, sum.withdrawal.total],
      ['Transfer Masuk', '', sum.transfer.totalIn],
      ['Transfer Keluar', '', sum.transfer.totalOut],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

    const dataSheet = XLSX.utils.json_to_sheet(buildExportRows(txList));
    XLSX.utils.book_append_sheet(workbook, dataSheet, 'Mutasi');

    const safeAccount = (cust.accountNumber || 'nasabah').replace(/[^\w-]/g, '_');
    XLSX.writeFile(workbook, `Mutasi_${safeAccount}_${getPeriodExportSlug()}.xlsx`);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    alert(`Gagal mengekspor: ${error.message || 'Terjadi kesalahan'}`);
  } finally {
    exporting.value = false;
  }
};

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(value || 0);

const formatDate = (date) => new Date(date).toLocaleDateString('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const getTypeIcon = (type) => {
  switch (type) {
    case 'weighing': return Scale;
    case 'withdrawal': return TrendingDown;
    case 'transfer': return ArrowRightLeft;
    default: return FileX;
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case 'weighing': return 'Timbang';
    case 'withdrawal': return 'Tarik';
    case 'transfer': return 'Transfer';
    default: return 'Lainnya';
  }
};

const getTypeClass = (type) => {
  switch (type) {
    case 'weighing':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    case 'withdrawal':
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    case 'transfer':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
  }
};

const handleClickOutside = (event) => {
  if (periodDropdownRef.value && !periodDropdownRef.value.contains(event.target)) {
    showPeriodDropdown.value = false;
  }
};

onMounted(() => {
  fetchTransactions();
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', handleChartResize);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', handleChartResize);
  if (trendChartInstance) {
    trendChartInstance.destroy();
    trendChartInstance = null;
  }
});
</script>

<style scoped>
.chart-canvas-wrap {
  position: relative;
  width: 100%;
  max-width: 100%;
}

.chart-canvas-wrap :deep(canvas) {
  max-width: 100% !important;
}
</style>
