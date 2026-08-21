<template>
  <div class="waste-bank-dashboard mobile-gutter md:px-6">
    <!-- Floating Bento Header & Filter Bar -->
    <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/80 dark:border-gray-700/80 rounded-3xl p-4 md:p-5 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
          <BarChart3 class="w-6 h-6" />
        </div>
        <div>
          <h1 class="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Dashboard Bank Sampah
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Analisa finansial kas pengurus & statistik perputaran sampah warga</p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
        <!-- Quick Filter Pills -->
        <div class="flex bg-gray-100 dark:bg-gray-900/80 p-1.5 rounded-2xl w-full sm:w-auto justify-between border border-gray-200/50 dark:border-gray-700/50">
          <button
            v-for="q in [3, 6, 12]"
            :key="q"
            @click="setQuickFilter(q)"
            class="flex-1 sm:flex-none px-3.5 py-1.5 text-xs rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-1"
            :class="selectedQuickFilter == q ? 'bg-white dark:bg-gray-800 shadow-sm text-emerald-600 dark:text-emerald-400 font-bold border border-gray-200/60 dark:border-gray-700' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'"
          >
            <span>{{ q }} Bln</span>
          </button>
        </div>

        <!-- Date Range Selector Pill -->
        <div class="flex items-center gap-1 bg-gray-100/80 dark:bg-gray-900/80 px-3.5 py-1.5 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-inner w-full sm:w-auto text-xs font-semibold">
          <select v-model="selectedMonthFrom" @change="onRangeChange" class="bg-transparent border-none focus:ring-0 cursor-pointer text-gray-700 dark:text-gray-200 flex-1 min-w-0 py-1 font-semibold">
            <option v-for="month in months" :key="month.value" :value="month.value">{{ month.label }}</option>
          </select>
          <span class="text-gray-400 px-1 font-bold shrink-0">s/d</span>
          <select v-model="selectedMonthTo" @change="onRangeChange" class="bg-transparent border-none focus:ring-0 cursor-pointer text-gray-700 dark:text-gray-200 flex-1 min-w-0 py-1 font-semibold">
            <option v-for="month in months" :key="month.value" :value="month.value">{{ month.label }}</option>
          </select>
          <div class="w-[1px] h-4 bg-gray-300 dark:bg-gray-700 mx-1.5 shrink-0"></div>
          <select v-model="selectedYear" @change="onRangeChange" class="bg-transparent border-none focus:ring-0 cursor-pointer text-emerald-600 dark:text-emerald-400 font-extrabold shrink-0 py-1">
            <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Memuat data...</p>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="dashboard-content">
      <!-- Stats Cards -->
      <!-- True Bento Grid UI (12-Column Asymmetric Enterprise Layout) -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-5 mb-8">
        <!-- Hero Bento 1: Kas & Profit Operasional (col-span-12 lg:col-span-5 row-span-2) -->
        <div class="md:col-span-12 lg:col-span-5 bg-white dark:bg-gray-800/90 rounded-3xl p-6 md:p-7 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700/80 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
          <!-- Background Accent Grid Pattern -->
          <div class="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

          <div>
            <div class="flex items-center justify-between mb-4 relative z-10">
              <div class="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/50 px-3 py-1.5 rounded-full text-emerald-700 dark:text-emerald-300 text-xs font-bold tracking-wide">
                <Coins class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>RINGKASAN KAS & PROFIT</span>
              </div>
              <span class="text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">Operasional</span>
            </div>

            <p class="text-sm text-gray-500 dark:text-gray-400 font-semibold relative z-10">Saldo Kas Saat Ini</p>
            <h2 class="text-3xl md:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1 mb-2 relative z-10">
              {{ formatCurrency(cashStats.balance) }}
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-6 relative z-10">Total kas tunai & rekening tersedia pengurus</p>
          </div>

          <!-- Mini KPI Bento Cells Inside Hero 1 -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-700/80 relative z-10">
            <div class="bg-gray-50 dark:bg-gray-900/60 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col justify-between">
              <span class="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Keuntungan Periode</span>
              <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">{{ formatCurrency(stats.totalProfit) }}</p>
              <span class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Est. Margin {{ stats.marginPercentage || 15 }}%</span>
            </div>
            <div class="bg-gray-50 dark:bg-gray-900/60 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col justify-between">
              <span class="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Profit Akumulatif</span>
              <p class="text-sm font-bold text-teal-600 dark:text-teal-400 mt-1">{{ formatCurrency(stats.totalProfitAllTime) }}</p>
              <span class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Total Margin All-Time</span>
            </div>
            <div class="bg-gray-50 dark:bg-gray-900/60 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col justify-between">
              <span class="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Pengeluaran Kas</span>
              <p class="text-sm font-bold text-red-600 dark:text-red-400 mt-1">{{ formatCurrency(cashStats.expense_month) }}</p>
              <span class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Beban Operasional</span>
            </div>
          </div>
        </div>

        <!-- Hero Bento 2: Ringkasan Tabungan Nasabah (col-span-12 md:col-span-6 lg:col-span-4 row-span-2) -->
        <div class="md:col-span-6 lg:col-span-4 bg-white dark:bg-gray-800/90 rounded-3xl p-6 md:p-7 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700/80 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
          <div>
            <div class="flex items-center justify-between mb-4 relative z-10">
              <div class="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 px-3 py-1.5 rounded-full text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide">
                <PiggyBank class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>RINGKASAN TABUNGAN NASABAH</span>
              </div>
              <span class="text-xs text-blue-700 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">Kewajiban</span>
            </div>

            <p class="text-sm text-gray-500 dark:text-gray-400 font-semibold relative z-10">Total Tabungan Nasabah</p>
            <h2 class="text-3xl md:text-4xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight mt-1 mb-2 relative z-10">
              {{ formatCurrency(stats.totalCustomerBalance) }}
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-6 relative z-10">Kewajiban saldo tertahan milik seluruh warga</p>
          </div>

          <!-- Customer Liabilities Sub-Metrics -->
          <div class="pt-4 border-t border-gray-100 dark:border-gray-700/80 relative z-10 flex flex-col gap-3">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-gray-50 dark:bg-gray-900/60 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col justify-between">
                <span class="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Nilai Transaksi</span>
                <p class="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">{{ formatCurrency(stats.totalValue) }}</p>
                <span v-if="stats.valueGrowth" class="text-[10px] block mt-0.5 font-semibold" :class="stats.valueGrowth > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                  {{ stats.valueGrowth > 0 ? '+' : '' }}{{ stats.valueGrowth }}% vs lalu
                </span>
              </div>
              <div class="bg-gray-50 dark:bg-gray-900/60 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col justify-between">
                <span class="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Sudah Dicairkan</span>
                <p class="text-sm font-bold text-orange-600 dark:text-orange-400 mt-1">{{ formatCurrency(stats.totalWithdrawalsAllTime) }}</p>
                <span class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Penarikan Tunai</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Supporting Bento Column: Operational Pulse (col-span-12 md:col-span-6 lg:col-span-3 flex flex-col gap-5) -->
        <div class="md:col-span-6 lg:col-span-3 flex flex-col gap-4 justify-between">
          <!-- Active Customers Bento Card -->
          <div class="bg-white dark:bg-gray-800/90 rounded-3xl p-5 border border-gray-100 dark:border-gray-700/80 shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-between group flex-1">
            <div>
              <p class="text-xs font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider">Nasabah Aktif</p>
              <h3 class="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{{ stats.activeCustomers || 0 }} <span class="text-sm font-normal text-gray-500">Warga</span></h3>
              <p class="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Partisipasi Aktif
              </p>
            </div>
            <div class="w-13 h-13 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center p-3.5 group-hover:scale-110 transition-transform duration-300 shrink-0">
              <Users class="w-7 h-7" />
            </div>
          </div>

          <!-- Total Transactions Bento Card -->
          <div class="bg-white dark:bg-gray-800/90 rounded-3xl p-5 border border-gray-100 dark:border-gray-700/80 shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-between group flex-1">
            <div>
              <p class="text-xs font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider">Total Transaksi</p>
              <h3 class="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{{ stats.totalTransactions || 0 }} <span class="text-sm font-normal text-gray-500">Kali</span></h3>
              <p class="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1">Aktivitas Penimbangan</p>
            </div>
            <div class="w-13 h-13 rounded-2xl bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center p-3.5 group-hover:scale-110 transition-transform duration-300 shrink-0">
              <FileText class="w-7 h-7" />
            </div>
          </div>

          <!-- Total Weight Bento Card -->
          <div class="bg-white dark:bg-gray-800/90 rounded-3xl p-5 border border-gray-100 dark:border-gray-700/80 shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-between group flex-1">
            <div>
              <p class="text-xs font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider">Total Berat Sampah</p>
              <div class="flex items-baseline gap-2 mt-1">
                <h3 class="text-2xl md:text-3xl font-extrabold text-green-600 dark:text-green-400">{{ formatWeight(stats.totalWeight) }}</h3>
                <span class="text-sm font-bold text-gray-500 dark:text-gray-400">Kg</span>
              </div>
              <span v-if="stats.weightGrowth" class="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold mt-1" :class="stats.weightGrowth > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'">
                {{ stats.weightGrowth > 0 ? '+' : '' }}{{ stats.weightGrowth }}% vs periode lalu
              </span>
            </div>
            <div class="w-13 h-13 rounded-2xl bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center p-3.5 group-hover:scale-110 transition-transform duration-300 shrink-0">
              <Scale class="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>

      <DashboardChartsSection />

      <DashboardLeaderboards />

    </div>
  </div>
</template>

<script setup>
import { provide } from 'vue';
import { Users, FileText, Scale, Coins, PiggyBank, Banknote, TrendingUp, Landmark } from 'lucide-vue-next';
import DashboardChartsSection from './dashboard-components/DashboardChartsSection.vue';
import DashboardLeaderboards from './dashboard-components/DashboardLeaderboards.vue';
import { wasteBankDashboardContextKey } from './dashboard-components/dashboardContext';
import { useWasteBankDashboard } from './composables/useWasteBankDashboard';

const dashboardContext = useWasteBankDashboard();
const {
  loading,
  selectedMonthFrom,
  selectedMonthTo,
  selectedYear,
  selectedQuickFilter,
  selectedTrendView,
  stats,
  cashStats,
  rtBreakdownData,
  hasIndWeightData,
  hasGrpWeightData,
  hasIndActiveData,
  hasGrpActiveData,
  topIndNominal,
  topIndWeight,
  topIndCount,
  topGroupNominal,
  topGroupWeight,
  topGroupCount,
  weightChart,
  valueChart,
  categoryChart,
  categoryWeightChart,
  rtWeightIndChart,
  rtWeightGrpChart,
  rtActiveIndChart,
  rtActiveGrpChart,
  customersChart,
  months,
  years,
  formatCurrency,
  formatWeight,
  getGrowthClass,
  isMobileView,
  compactAxisNumber,
  getLineChartOptions,
  resizeAllCharts,
  handleChartResize,
  setQuickFilter,
  onRangeChange,
  loadTrendCharts,
  changeTrendView,
  loadDashboard,
  renderWeightChart,
  renderValueChart,
  renderCategoryChart,
  renderCategoryWeightChart,
  renderRTWeightIndChart,
  renderRTWeightGrpChart,
  renderRTActiveIndChart,
  renderRTActiveGrpChart,
  renderCustomersChart
} = dashboardContext;

provide(wasteBankDashboardContextKey, dashboardContext);
</script>

<style scoped src="./dashboard-components/waste-bank-dashboard.css"></style>
