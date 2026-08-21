<template>
<!-- Info Banner -->
<div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 flex items-start gap-3">
  <Leaf class="w-6 h-6 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
  <div>
    <p class="text-sm font-semibold text-green-800 dark:text-green-300">Laporan untuk Dinas Lingkungan Hidup</p>
    <p class="text-xs text-green-700 dark:text-green-400 mt-0.5" style="line-height: normal;">
      Nilai sampah menggunakan <strong>harga pengepul</strong> (harga pasar). Informasi keuangan internal tidak ditampilkan.<br/>
      <span v-if="data?.meta?.mode === 'all'" class="font-semibold text-[11px] mt-1 inline-block">Mencakup semua pengepul — tiap seksi menunjukkan satu pengepul.</span>
      <span v-else-if="data?.meta?.selectedCollectors?.length > 0" class="font-semibold text-[11px] mt-1 inline-block text-emerald-800 dark:text-emerald-300">
        Filter Pengepul: {{ data.meta.selectedCollectors.map(c => c.collectorName).join(', ') }}
      </span>
    </p>
  </div>
</div>

<!-- Loading Spinner -->
<div v-if="loading" class="bg-white dark:bg-gray-800 rounded-lg shadow p-16 text-center">
  <div class="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
  <p class="text-gray-500 dark:text-gray-400">Sedang memuat laporan DLH...</p>
</div>

<!-- Report Content -->
<template v-else-if="data">

  <!-- ═══ GRAND SUMMARY CARDS ═══ -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
    <!-- Total Nasabah -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Total Nasabah</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {{ data.summary.customers.uniqueCustomers }}
          </p>
          <p class="text-xs text-gray-500 mt-1">{{ data.summary.customers.totalTransactions }} transaksi</p>
        </div>
        <div class="p-3 bg-green-100 dark:bg-green-900 rounded-full">
          <svg class="w-8 h-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Total Berat -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Total Berat Sampah</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">{{ data.summary.weight.total }}</p>
          <p class="text-xs text-gray-500 mt-1">Kg</p>
        </div>
        <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
          <svg class="w-8 h-8 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Total Nilai Pengepul -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Total Nilai Sampah</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white mt-2">{{ formatCurrency(data.summary.pelapakValue.totalValue) }}</p>
          <p class="text-xs text-gray-500 mt-1">Harga pengepul</p>
        </div>
        <div class="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
          <svg class="w-8 h-8 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ PER-COLLECTOR SECTIONS ═══ -->
  <!-- Multi-collector badge row -->
  <div v-if="data.meta.mode === 'all' && data.byCollector.length > 1"
       class="flex flex-wrap gap-2 mb-4">
    <span class="text-sm font-semibold text-gray-600 dark:text-gray-400 self-center">Pengepul:</span>
    <span
      v-for="g in data.byCollector" :key="g.collectorKey"
      class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
    >
      🚚 {{ g.collectorName }}
    </span>
  </div>

  <!-- One card per collector group -->
  <div
    v-for="(group, idx) in data.byCollector"
    :key="group.collectorKey"
    class="bg-white dark:bg-gray-800 rounded-lg shadow mb-4 overflow-hidden"
  >
    <!-- Collector Header -->
    <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
         :class="idx % 2 === 0
           ? 'bg-emerald-50 dark:bg-emerald-900/20'
           : 'bg-teal-50 dark:bg-teal-900/20'"
    >
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-full"
             :class="idx % 2 === 0 ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-teal-200 dark:bg-teal-800'">
          <Truck class="w-5 h-5"
                 :class="idx % 2 === 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-teal-700 dark:text-teal-300'" />
        </div>
        <div>
          <h3 class="font-bold text-gray-900 dark:text-white text-base">{{ group.collectorName }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ group.transactionCount }} transaksi · {{ group.totalWeight }} Kg</p>
        </div>
      </div>
      <div class="flex gap-4 text-sm">
        <div class="text-center">
          <p class="text-xs text-gray-500 dark:text-gray-400">Berat</p>
          <p class="font-bold text-gray-900 dark:text-white">{{ group.totalWeight }} Kg</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-500 dark:text-gray-400">Nilai Pengepul</p>
          <p class="font-bold text-emerald-700 dark:text-emerald-400">{{ formatCurrency(group.totalPelapakValue) }}</p>
        </div>
      </div>
    </div>

    <!-- Item table for this collector -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
            <th class="text-left px-6 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Item</th>
            <th class="text-right px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Berat (Kg)</th>
            <th class="text-right px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Harga Satuan</th>
            <th class="text-right px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total</th>
            <th class="text-right px-6 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">%</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in group.weightByItem"
            :key="item.itemCode"
            class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
          >
            <td class="px-6 py-3 text-gray-900 dark:text-white font-medium">{{ item.itemName }}</td>
            <td class="text-right px-4 py-3 text-gray-700 dark:text-gray-300 font-mono">{{ item.weight.toFixed(2) }}</td>
            <td class="text-right px-4 py-3 text-gray-700 dark:text-gray-300">{{ formatCurrency(item.avgPelapakPrice) }}</td>
            <td class="text-right px-4 py-3 text-gray-900 dark:text-white font-semibold">{{ formatCurrency(item.pelapakValue) }}</td>
            <td class="text-right px-6 py-3 text-gray-500 dark:text-gray-400">
              <span class="inline-block bg-gray-100 dark:bg-gray-700 rounded px-1.5 py-0.5 text-xs font-mono">
                {{ item.percentage }}%
              </span>
            </td>
          </tr>
          <tr v-if="group.weightByItem.length === 0">
            <td colspan="5" class="text-center py-6 text-gray-400">Tidak ada data item</td>
          </tr>
        </tbody>
        <!-- Subtotal row -->
        <tfoot>
          <tr class="border-t-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/40 font-bold">
            <td class="px-6 py-3 text-gray-900 dark:text-white">Total</td>
            <td class="text-right px-4 py-3 text-gray-900 dark:text-white font-mono">{{ group.totalWeight.toFixed(2) }}</td>
            <td class="text-right px-4 py-3 text-gray-500">—</td>
            <td class="text-right px-4 py-3 text-emerald-700 dark:text-emerald-400">{{ formatCurrency(group.totalPelapakValue) }}</td>
            <td class="text-right px-6 py-3 text-gray-500">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>

  <!-- No collector data -->
  <div v-if="data.byCollector.length === 0"
       class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
    <p class="text-gray-500 dark:text-gray-400">Tidak ada transaksi pada periode ini</p>
  </div>

  <!-- Export Button DLH -->
  <div class="text-center mt-6">
    <button
      @click="exportDLHPDF"
      :disabled="exporting"
      class="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg shadow-lg disabled:opacity-50"
    >
      <svg v-if="!exporting" class="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {{ exporting ? 'Mengekspor PDF...' : '🌿 Export PDF Laporan DLH' }}
    </button>
  </div>
</template>

<!-- Empty State DLH -->
<div v-if="!loading && !data" class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
  <svg class="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
  <p class="text-gray-600 dark:text-gray-400 text-lg">Pilih rentang tanggal &amp; pengepul untuk menampilkan laporan DLH</p>
</div>

</template>

<script setup>
import { Leaf, Truck } from 'lucide-vue-next';

defineProps({
  data: { type: Object, default: null },
  loading: Boolean,
  exporting: Boolean,
});
const emit = defineEmits(['export']);
const exportDLHPDF = () => emit('export');
const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);

</script>
