<template>
<!-- Summary Cards -->
<div v-if="reportData" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
  <!-- Total Nasabah -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-600 dark:text-gray-400">Total Nasabah</p>
        <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
          {{ reportData.summary.customers.uniqueCustomers }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {{ reportData.summary.customers.totalTransactions }} transaksi
        </p>
      </div>
      <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
        <svg class="w-8 h-8 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
      </div>
    </div>
  </div>

  <!-- Total Berat -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-600 dark:text-gray-400">Total Berat</p>
        <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
          {{ reportData.summary.weight.total }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">Kg</p>
      </div>
      <div class="p-3 bg-green-100 dark:bg-green-900 rounded-full">
        <svg class="w-8 h-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
        </svg>
      </div>
    </div>
  </div>

  <!-- Total Tabungan Nasabah -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-600 dark:text-gray-400">Tabungan Nasabah</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-2">
          {{ formatCurrency(reportData.summary.financial.customerSavings) }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Total: {{ formatCurrency(reportData.summary.financial.totalTransactionValue) }}
        </p>
      </div>
      <div class="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
        <svg class="w-8 h-8 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
    </div>
  </div>

  <!-- Profit/Kas Pengurus -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-600 dark:text-gray-400">Kas Pengurus</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-2">
          {{ formatCurrency(reportData.summary.financial.totalProfit) }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">Profit margin</p>
      </div>
      <div class="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
        <svg class="w-8 h-8 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
      </div>
    </div>
  </div>
</div>

<!-- Details Section -->
<div v-if="reportData" class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
  <!-- Berat per Item -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Berat per Jenis Item</h3>
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b dark:border-gray-700">
            <th class="text-left py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Item</th>
            <th class="text-right py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Berat (Kg)</th>
            <th class="text-right py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">%</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in reportData.details.weightByItem" :key="item.itemCode" class="border-b dark:border-gray-700">
            <td class="py-2 text-sm text-gray-900 dark:text-white">{{ item.itemName }}</td>
            <td class="text-right py-2 text-sm text-gray-900 dark:text-white">{{ item.weight.toFixed(2) }}</td>
            <td class="text-right py-2 text-sm text-gray-600 dark:text-gray-400">{{ item.percentage }}%</td>
          </tr>
          <tr v-if="reportData.details.weightByItem.length === 0">
            <td colspan="3" class="text-center py-4 text-gray-500 dark:text-gray-400">Tidak ada data</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Distribusi Pengepul -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Distribusi Pengepul</h3>
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b dark:border-gray-700">
            <th class="text-left py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Pengepul</th>
            <th class="text-right py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Berat (Kg)</th>
            <th class="text-right py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">%</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="collector in reportData.details.collectorDistribution" :key="collector.collectorName" class="border-b dark:border-gray-700">
            <td class="py-2 text-sm text-gray-900 dark:text-white">{{ collector.collectorName }}</td>
            <td class="text-right py-2 text-sm text-gray-900 dark:text-white">{{ collector.weight.toFixed(2) }}</td>
            <td class="text-right py-2 text-sm text-gray-600 dark:text-gray-400">{{ collector.percentage }}%</td>
          </tr>
          <tr v-if="reportData.details.collectorDistribution.length === 0">
            <td colspan="3" class="text-center py-4 text-gray-500 dark:text-gray-400">Belum ada data distribusi</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Financial Summary -->
<div v-if="reportData" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
  <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Ringkasan Keuangan</h3>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="flex justify-between py-2 border-b dark:border-gray-700">
      <span class="text-gray-600 dark:text-gray-400">Total Nilai Transaksi:</span>
      <span class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(reportData.summary.financial.totalTransactionValue) }}</span>
    </div>
    <div class="flex justify-between py-2 border-b dark:border-gray-700">
      <span class="text-gray-600 dark:text-gray-400">Tabungan Nasabah:</span>
      <span class="font-semibold text-green-600 dark:text-green-400">{{ formatCurrency(reportData.summary.financial.customerSavings) }}</span>
    </div>
    <div class="flex justify-between py-2 border-b dark:border-gray-700">
      <span class="text-gray-600 dark:text-gray-400">Pembayaran Tunai:</span>
      <span class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(reportData.summary.financial.cashPayments) }}</span>
    </div>
    <div class="flex justify-between py-2 border-b dark:border-gray-700">
      <span class="text-gray-600 dark:text-gray-400">Total Profit/Kas:</span>
      <span class="font-semibold text-purple-600 dark:text-purple-400">{{ formatCurrency(reportData.summary.financial.totalProfit) }}</span>
    </div>
  </div>
</div>

<!-- Export Button -->
<div v-if="reportData" class="text-center">
  <button
    @click="exportPDF"
    :disabled="exporting"
    class="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg shadow-lg disabled:opacity-50"
  >
    <svg v-if="!exporting" class="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
    </svg>
    {{ exporting ? 'Mengekspor PDF...' : '📄 Export PDF Formal' }}
  </button>
</div>

<!-- AI Executive Summary Section -->
<div v-if="reportData" class="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow border border-emerald-100 dark:border-emerald-900 overflow-hidden">
  <!-- Header -->
  <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
         <Sparkles class="w-5 h-5" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          Executive Summary
          <span class="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">AI Analysis</span>
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">Evaluasi otomatis performa &amp; rekomendasi manajemen</p>
      </div>
    </div>

    <div class="flex items-center gap-2">
       <!-- Audience Selector -->
      <div class="relative">
        <select
          v-model="audienceModel"
          :disabled="isEditing"
          class="appearance-none pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-shadow"
        >
          <option value="management">Untuk Pengurus</option>
          <option value="public">Untuk Warga</option>
        </select>
        <ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      <!-- Main Actions -->
       <div v-if="!isEditing" class="flex items-center gap-2">
          <!-- Regenerate -->
          <button
            @click="handleGenerateInsight"
            :disabled="insightLoading"
            class="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
            title="Generate Ulang"
          >
            <RefreshCw :class="{'animate-spin': insightLoading}" class="w-5 h-5" />
          </button>

           <!-- Edit Button -->
          <button
            v-if="insight"
            @click="startEditing"
            class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Edit2 class="w-4 h-4" />
            Edit
          </button>
           <!-- Initial Generate Button -->
          <button
            v-else
            @click="handleGenerateInsight"
            :disabled="insightLoading"
            class="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
          >
            <Sparkles class="w-4 h-4" />
            Generate
          </button>
       </div>
    </div>
  </div>

  <!-- Content Area -->
  <div class="p-6 relative">
    <!-- Loading State -->
    <div v-if="insightLoading" class="min-h-[150px] flex flex-col items-center justify-center text-center animate-pulse">
      <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mb-3"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      <p class="mt-4 text-emerald-600 font-medium text-sm animate-bounce">Sedang menganalisis data laporan...</p>
    </div>

    <!-- Edit Mode -->
    <div v-else-if="isEditing" class="animate-fade-in-up">
      <textarea
        v-model="editedInsightModel"
        rows="12"
        class="w-full p-4 bg-white dark:bg-gray-900 border-2 border-emerald-500/30 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-gray-800 dark:text-gray-200 leading-relaxed transition-all resize-y font-mono text-sm"
        placeholder="Tulis analisis Anda..."
      ></textarea>

      <div class="flex items-center justify-between mt-4">
         <p class="text-xs text-gray-400">
           💡 <strong>Tip:</strong> Hasil edit ini akan digunakan saat Export PDF.
         </p>
         <div class="flex gap-3">
            <button
              @click="cancelEditing"
              class="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
            >
              Batal
            </button>
            <button
              @click="saveEditing"
              class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
            >
              <Save class="w-4 h-4" />
              Simpan Perubahan
            </button>
         </div>
      </div>
    </div>

    <!-- Display Mode -->
    <div v-else-if="insight" class="prose prose-emerald prose-sm max-w-none dark:prose-invert">
       <div class="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300 font-medium">
         {{ insight }}
       </div>
       <div class="mt-6 flex items-center justify-end border-t border-gray-100 dark:border-gray-800 pt-4">
         <div class="flex items-center gap-2 text-xs text-gray-400">
           <Sparkles class="w-3 h-3 text-emerald-500" />
           Generated by Gemini AI • <span class="text-gray-300 dark:text-gray-600">{{ new Date().toLocaleDateString('id-ID') }}</span>
         </div>
       </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
       <Sparkles class="w-10 h-10 text-gray-300 mx-auto mb-3" />
       <p class="text-gray-500 text-sm mb-4">Belum ada analisis untuk periode ini.</p>
       <button
            @click="handleGenerateInsight"
            class="px-5 py-2.5 bg-white border border-gray-300 hover:border-emerald-500 hover:text-emerald-600 text-gray-600 rounded-lg text-sm font-medium transition-all shadow-sm"
          >
            Generate Analisis
      </button>
    </div>

     <!-- Error State -->
    <div v-if="insightError" class="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3 border border-red-100">
      <AlertTriangle class="w-5 h-5 shrink-0" />
      <div class="text-sm">
        <span class="font-bold">Gagal:</span> {{ insightError }}
      </div>
    </div>
  </div>
</div>

<!-- Empty State Internal -->
<div v-if="!loading && !reportData" class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
  <svg class="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
  </svg>
  <p class="text-gray-600 dark:text-gray-400 text-lg">Pilih rentang tanggal untuk menampilkan laporan</p>
</div>

</template>

<script setup>
import { computed } from 'vue';
import { AlertTriangle, BarChart2, ChevronDown, Edit2, RefreshCw, Save, Sparkles } from 'lucide-vue-next';

const props = defineProps({
  reportData: { type: Object, default: null },
  loading: Boolean,
  exporting: Boolean,
  insight: { type: String, default: '' },
  insightLoading: Boolean,
  insightError: { type: String, default: '' },
  audience: { type: String, default: '' },
  isEditing: Boolean,
  editedInsight: { type: String, default: '' },
});
const emit = defineEmits(['generate-insight', 'start-editing', 'cancel-editing', 'save-editing', 'update:edited-insight', 'update:audience', 'export']);
const editedInsightModel = computed({
  get: () => props.editedInsight,
  set: (value) => emit('update:edited-insight', value),
});
const audienceModel = computed({
  get: () => props.audience,
  set: (value) => emit('update:audience', value),
});
const handleGenerateInsight = () => emit('generate-insight');
const startEditing = () => emit('start-editing');
const cancelEditing = () => emit('cancel-editing');
const saveEditing = () => emit('save-editing');
const exportPDF = () => emit('export');
const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);

</script>
