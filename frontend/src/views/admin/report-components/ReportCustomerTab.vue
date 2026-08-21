<template>
<!-- Info Banner -->
<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex items-start gap-3">
  <Users class="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
  <div>
    <p class="text-sm font-semibold text-blue-800 dark:text-blue-300">Laporan Penimbangan Nasabah</p>
    <p class="text-xs text-blue-700 dark:text-blue-400 mt-0.5" style="line-height: normal;">
      Laporan ini menampilkan rincian penimbangan berdasarkan <strong>Harga Nasabah</strong>.
    </p>
  </div>
</div>

<!-- Summary Cards -->
<div v-if="reportData" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
  <!-- Total Nasabah Aktif -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-500">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Nasabah Aktif</p>
        <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
          {{ reportData.details?.customerBreakdown?.length || reportData.summary.customers.uniqueCustomers }}
        </p>
        <p class="text-xs text-gray-500 mt-1">{{ reportData.summary.customers.totalTransactions }} transaksi penimbangan</p>
      </div>
      <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
        <Users class="w-8 h-8 text-blue-600 dark:text-blue-300" />
      </div>
    </div>
  </div>

  <!-- Total Berat -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-green-500">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sampah Ditimbang</p>
        <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
          {{ reportData.summary.weight.total }}
        </p>
        <p class="text-xs text-gray-500 mt-1">Kg Sampah Daur Ulang</p>
      </div>
      <div class="p-3 bg-green-100 dark:bg-green-900 rounded-full">
        <Leaf class="w-8 h-8 text-green-600 dark:text-green-300" />
      </div>
    </div>
  </div>

  <!-- Total Uang Nasabah -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-yellow-500">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Uang Nasabah</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-2">
          {{ formatCurrency(reportData.summary.financial.totalTransactionValue) }}
        </p>
        <p class="text-xs text-gray-500 mt-1">Berdasarkan Harga Nasabah</p>
      </div>
      <div class="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
        <svg class="w-8 h-8 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
    </div>
  </div>
</div>

<!-- Search & Filter Bar for Nasabah Table -->
<div v-if="reportData && reportData.details?.customerBreakdown" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h3 class="text-lg font-bold text-gray-900 dark:text-white">Rincian Penimbangan Per Nasabah</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400">Daftar nasabah beserta item yang disetor dan uang yang didapatkan</p>
    </div>
    <div class="relative w-full sm:w-72">
      <input
        v-model="searchModel"
        type="text"
        placeholder="Cari nama atau no. rekening..."
        class="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Search class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
    </div>
  </div>

  <!-- Customer Table -->
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">No. Rekening</th>
          <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
          <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Nama Nasabah</th>
          <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Jenis Penimbangan (Item)</th>
          <th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Berat (Kg)</th>
          <th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Harga Nasabah</th>
          <th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Uang Didapatkan</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
        <template v-for="cust in customers" :key="cust.customerId">
          <!-- Customer Row with Items -->
          <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
            <td class="py-3 px-4 font-mono font-medium text-gray-900 dark:text-white align-top">
              {{ cust.customerAccountNumber }}
            </td>
            <td class="py-3 px-4 align-top font-mono text-gray-600 dark:text-gray-400">
              <ul class="space-y-1">
                <li v-for="(item, idx) in cust.items" :key="idx">
                  {{ item.date }}
                </li>
              </ul>
            </td>
            <td class="py-3 px-4 font-bold text-gray-900 dark:text-white align-top">
              {{ cust.customerName }}
              <span class="block text-xs font-normal text-gray-500">{{ cust.totalTransactions }} transaksi</span>
            </td>
            <td class="py-3 px-4 align-top">
              <ul class="space-y-1">
                <li v-for="(item, idx) in cust.items" :key="idx" class="text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block shrink-0"></span>
                  <span>{{ item.itemName }}</span>
                </li>
              </ul>
            </td>
            <td class="py-3 px-4 text-right align-top font-mono">
              <ul class="space-y-1">
                <li v-for="(item, idx) in cust.items" :key="idx" class="text-gray-700 dark:text-gray-300">
                  {{ item.weight }}
                </li>
              </ul>
            </td>
            <td class="py-3 px-4 text-right align-top">
              <ul class="space-y-1">
                <li v-for="(item, idx) in cust.items" :key="idx" class="text-gray-500 dark:text-gray-400">
                  {{ formatCurrency(item.avgCustomerPrice) }}/kg
                </li>
              </ul>
            </td>
            <td class="py-3 px-4 text-right align-top font-semibold text-gray-900 dark:text-white">
              <ul class="space-y-1">
                <li v-for="(item, idx) in cust.items" :key="idx" class="text-emerald-600 dark:text-emerald-400 font-mono">
                  {{ formatCurrency(item.value) }}
                </li>
              </ul>
            </td>
          </tr>
          <!-- Subtotal Row for Customer -->
          <tr class="bg-gray-50/80 dark:bg-gray-900/40 font-semibold border-b-2 border-gray-200 dark:border-gray-600">
            <td colspan="4" class="py-2 px-4 text-right text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total {{ cust.customerName }}
            </td>
            <td class="py-2 px-4 text-right text-gray-900 dark:text-white font-mono">
              {{ cust.totalWeight }} Kg
            </td>
            <td class="py-2 px-4 text-right text-gray-400">—</td>
            <td class="py-2 px-4 text-right text-emerald-700 dark:text-emerald-400 font-bold font-mono">
              {{ formatCurrency(cust.totalValue) }}
            </td>
          </tr>
        </template>
        <tr v-if="customers.length === 0">
          <td colspan="7" class="text-center py-8 text-gray-500 dark:text-gray-400">
            Tidak ada data nasabah yang cocok dengan pencarian
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Export Button Nasabah -->
  <div class="text-center mt-8">
    <button
      @click="exportNasabahPDF"
      :disabled="exporting"
      class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg shadow-lg disabled:opacity-50 transition"
    >
      <svg v-if="!exporting" class="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
      {{ exporting ? 'Mengekspor PDF...' : '📄 Export PDF Laporan Nasabah' }}
    </button>
  </div>
</div>

<!-- Empty State Nasabah -->
<div v-if="!loading && !reportData" class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
  <svg class="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
  </svg>
  <p class="text-gray-600 dark:text-gray-400 text-lg">Pilih rentang tanggal untuk menampilkan laporan penimbangan nasabah</p>
</div>

</template>

<script setup>
import { computed } from 'vue';
import { Leaf, Search, Users } from 'lucide-vue-next';

const props = defineProps({
  reportData: { type: Object, default: null },
  loading: Boolean,
  exporting: Boolean,
  customers: { type: Array, default: () => [] },
  search: { type: String, default: '' },
});
const emit = defineEmits(['update:search', 'export']);
const searchModel = computed({
  get: () => props.search,
  set: (value) => emit('update:search', value),
});
const exportNasabahPDF = () => emit('export');
const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);

</script>
