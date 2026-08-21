<template>
  <div class="bg-gray-50 dark:bg-gray-950 min-h-screen overflow-x-hidden pb-nav-mobile md:px-6 md:py-6">
    <!-- Header -->
    <div class="px-3 md:px-0 py-3 md:py-0 md:mb-6">
      <h2 class="hidden md:flex text-2xl font-bold text-gray-900 dark:text-white items-center">
        <HistoryIcon class="h-8 w-8 mr-3 text-green-600" />
        Riwayat Transaksi
      </h2>
    </div>

    <!-- Filters -->
    <TransactionFilters @filter="handleFilter" />

    <!-- Tab Switcher -->
    <div class="section-card md:rounded-xl mb-0 border-b-0 md:border-b">
      <nav class="grid grid-cols-2 gap-1" aria-label="Tabs">
        <button
          type="button"
          @click="activeTab = 'transactions'"
          class="py-3 px-2 rounded-lg text-sm font-medium transition-colors text-center"
          :class="activeTab === 'transactions'
            ? 'bg-green-600 text-white'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          Transaksi Sampah
        </button>
        <button
          type="button"
          @click="activeTab = 'transfers'"
          class="py-3 px-2 rounded-lg text-sm font-medium transition-colors text-center"
          :class="activeTab === 'transfers'
            ? 'bg-green-600 text-white'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          Transfer Nasabah
        </button>
      </nav>
    </div>

    <!-- Transactions (Tab 1) -->
    <div v-if="activeTab === 'transactions'" class="section-card md:rounded-xl md:mt-4 border-t-0 md:border-t">
      <div v-if="loading" class="py-12 text-center">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto"></div>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Memuat data transaksi...</p>
      </div>

      <div v-else-if="transactions.length === 0" class="py-12 text-center">
        <InboxIcon class="mx-auto h-10 w-10 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Belum ada transaksi</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tidak ditemukan data transaksi dengan filter yang dipilih.
        </p>
      </div>

      <template v-else>
        <!-- Mobile -->
        <div class="md:hidden divide-y divide-gray-200 dark:divide-gray-700 -mx-3">
          <article
            v-for="trx in transactions"
            :key="trx._id"
            class="px-3 py-4"
          >
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="min-w-0 flex-1">
                <p class="text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate">{{ trx.transactionId }}</p>
                <p class="text-sm font-semibold text-gray-900 dark:text-white break-words mt-0.5">{{ trx.customerName }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                  {{ trx.customer?.accountNumber || trx.customerAccountNumber }}
                </p>
              </div>
              <span
                class="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full"
                :class="getTransactionStatusClass(trx.status)"
              >
                {{ trx.status === 'COMPLETED' ? 'Selesai' : 'Dibatalkan' }}
              </span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">{{ formatDate(trx.transactionDate) }}</p>
            <div class="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">Berat</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatWeight(trx.totalWeight) }} Kg</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-500 dark:text-gray-400">Nilai</p>
                <p class="text-sm font-bold text-green-600 dark:text-green-400">{{ formatCurrency(trx.totalValue) }}</p>
              </div>
            </div>
            <button
              type="button"
              @click="openDetail(trx)"
              class="w-full py-2.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 transition-colors"
            >
              Lihat Detail
            </button>
          </article>
        </div>

        <!-- Desktop -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">ID</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Tanggal</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nasabah</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Berat</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Nilai</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Status</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Aksi</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="trx in transactions" :key="trx._id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="px-4 py-4 text-sm font-mono text-gray-900 dark:text-white break-all">{{ trx.transactionId }}</td>
                <td class="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{{ formatDate(trx.transactionDate) }}</td>
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900 dark:text-white break-words">{{ trx.customerName }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ trx.customer?.accountNumber || trx.customerAccountNumber }}</div>
                </td>
                <td class="px-4 py-4 text-sm text-gray-900 dark:text-white text-right">{{ formatWeight(trx.totalWeight) }} Kg</td>
                <td class="px-4 py-4 text-sm text-green-600 font-semibold text-right">{{ formatCurrency(trx.totalValue) }}</td>
                <td class="px-4 py-4 text-center">
                  <span class="px-2 py-0.5 text-xs font-semibold rounded-full" :class="getTransactionStatusClass(trx.status)">
                    {{ trx.status === 'COMPLETED' ? 'Selesai' : 'Dibatalkan' }}
                  </span>
                </td>
                <td class="px-4 py-4 text-right text-sm">
                  <button type="button" @click="openDetail(trx)" class="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                    Detail
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Halaman {{ currentPage }} dari {{ totalPages }}
        </p>
        <div class="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <button
            type="button"
            @click="changePage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-50"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>

    <!-- Transfers (Tab 2) -->
    <div v-if="activeTab === 'transfers'" class="section-card md:rounded-xl md:mt-4 border-t-0 md:border-t">
      <div v-if="loading" class="py-12 text-center">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto"></div>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Memuat data transfer...</p>
      </div>

      <div v-else-if="transfers.length === 0" class="py-12 text-center">
        <ArrowRightLeft class="mx-auto h-10 w-10 text-gray-300" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Belum ada transfer</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Belum ada riwayat transfer antar nasabah.</p>
      </div>

      <template v-else>
        <!-- Mobile -->
        <div class="md:hidden divide-y divide-gray-200 dark:divide-gray-700 -mx-3">
          <article
            v-for="t in transfers"
            :key="t._id"
            class="px-3 py-4"
          >
            <div class="flex items-start justify-between gap-3 mb-2">
              <p class="text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate min-w-0">{{ t.transferId }}</p>
              <span
                class="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full"
                :class="t.status === 'SUCCESS' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'"
              >
                {{ t.status }}
              </span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">{{ formatDate(t.transferDate) }}</p>
            <div class="space-y-2 mb-3">
              <div class="rounded-lg bg-gray-50 dark:bg-gray-800/60 px-3 py-2">
                <p class="text-[10px] uppercase tracking-wide text-gray-400">Pengirim</p>
                <p class="text-sm font-semibold text-gray-900 dark:text-white break-words">{{ t.senderName }}</p>
                <p class="text-xs text-gray-500 font-mono">{{ t.senderAccountNumber }}</p>
              </div>
              <div class="rounded-lg bg-gray-50 dark:bg-gray-800/60 px-3 py-2">
                <p class="text-[10px] uppercase tracking-wide text-gray-400">Penerima</p>
                <p class="text-sm font-semibold text-gray-900 dark:text-white break-words">{{ t.receiverName }}</p>
                <p class="text-xs text-gray-500 font-mono">{{ t.receiverAccountNumber }}</p>
              </div>
            </div>
            <p class="text-right text-sm font-bold text-gray-900 dark:text-white">{{ formatCurrency(t.amount) }}</p>
          </article>
        </div>

        <!-- Desktop -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">ID</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Tanggal</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengirim</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penerima</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Jumlah</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="t in transfers" :key="t._id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="px-4 py-4 text-sm font-mono text-gray-500 break-all">{{ t.transferId }}</td>
                <td class="px-4 py-4 text-sm text-gray-500">{{ formatDate(t.transferDate) }}</td>
                <td class="px-4 py-4">
                  <div class="text-sm font-bold text-gray-900 dark:text-white break-words">{{ t.senderName }}</div>
                  <div class="text-xs text-gray-500">{{ t.senderAccountNumber }}</div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm font-bold text-gray-900 dark:text-white break-words">{{ t.receiverName }}</div>
                  <div class="text-xs text-gray-500">{{ t.receiverAccountNumber }}</div>
                </td>
                <td class="px-4 py-4 text-sm font-bold text-gray-900 dark:text-white text-right">{{ formatCurrency(t.amount) }}</td>
                <td class="px-4 py-4 text-center">
                  <span
                    class="px-2 py-0.5 text-xs font-semibold rounded-full"
                    :class="t.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  >
                    {{ t.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <!-- Detail Modal -->
    <TransactionDetailModal
      :isOpen="isModalOpen"
      :transaction="selectedTransaction"
      @close="closeModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import * as bankService from '@/services/bankService';
import { HistoryIcon, InboxIcon, ArrowRightLeft } from 'lucide-vue-next';
import TransactionFilters from './components/TransactionFilters.vue';
import TransactionDetailModal from './components/TransactionDetailModal.vue';

const activeTab = ref('transactions');
const loading = ref(false);
const transactions = ref([]);
const transfers = ref([]);

const currentPage = ref(1);
const totalPages = ref(1);
const activeFilters = ref({ status: 'ALL' });

const isModalOpen = ref(false);
const selectedTransaction = ref(null);

const getTransactionStatusClass = (status) => {
  if (status === 'COMPLETED') {
    return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  }
  return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
};

const fetchTransactions = async (page = 1, filters = {}) => {
  loading.value = true;
  try {
    const params = {
      page,
      limit: 20,
      ...filters,
    };
    const response = await bankService.getTransactions(params);
    transactions.value = response.data;
    if (response.pagination) {
      currentPage.value = response.pagination.page;
      totalPages.value = response.pagination.pages;
    }
  } catch (error) {
    console.error('Failed to load transaction history:', error);
  } finally {
    loading.value = false;
  }
};

const handleFilter = (filters) => {
  activeFilters.value = filters;
  fetchTransactions(1, filters);
};

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    fetchTransactions(page, activeFilters.value);
  }
};

const fetchTransfers = async () => {
  loading.value = true;
  try {
    const response = await bankService.getAllTransfers(activeFilters.value);
    transfers.value = response.data || [];
  } catch (e) {
    console.error('Failed to fetch transfers:', e);
  } finally {
    loading.value = false;
  }
};

watch(activeTab, (newTab) => {
  if (newTab === 'transfers' && transfers.value.length === 0) {
    fetchTransfers();
  } else if (newTab === 'transactions' && transactions.value.length === 0) {
    fetchTransactions(1, activeFilters.value);
  }
});

const openDetail = async (transaction) => {
  try {
    selectedTransaction.value = transaction;
    isModalOpen.value = true;

    const response = await bankService.getTransactionById(transaction._id || transaction.transactionId);
    if (response?.data) {
      selectedTransaction.value = response.data;
    }
  } catch (e) {
    console.error('Failed to fetch transaction detail:', e);
  }
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedTransaction.value = null;
};

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(value);

const formatWeight = (value) => {
  if (value === null || value === undefined) return '0';
  return parseFloat(Number(value).toFixed(2));
};

const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

onMounted(() => {
  // Initial fetch driven by TransactionFilters emit
});
</script>
