<template>
<!-- Individual Leaderboards -->
<div class="section-divider mb-4 mt-8 flex items-center gap-2 text-slate-500 uppercase tracking-wider text-sm font-bold">
   <User class="w-5 h-5" /> Peringkat Nasabah Individu
</div>
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
  <!-- Top by Value -->
  <div class="top-customers-section">
    <h3 class="flex items-center gap-2">
      <Trophy class="w-5 h-5 text-yellow-500" />
      Top Nominal (Ind)
    </h3>
    <div class="table-wrapper">
      <table class="customers-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Nama</th>
            <th class="text-right">Total Nilai</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in topIndNominal" :key="customer.customerId">
            <td class="rank">{{ customer.rank }}</td>
            <td class="customer-name text-xs">{{ customer.customerName }}</td>
            <td class="value text-right text-xs">{{ formatCurrency(customer.totalValue) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Top by Weight -->
  <div class="top-customers-section">
    <h3 class="flex items-center gap-2">
      <Scale class="w-5 h-5 text-green-600" />
      Top Berat (Ind)
    </h3>
    <div class="table-wrapper">
      <table class="customers-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Nama</th>
            <th class="text-right">Total Berat</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in topIndWeight" :key="customer.customerId">
            <td class="rank">{{ customer.rank }}</td>
            <td class="customer-name text-xs">{{ customer.customerName }}</td>
            <td class="value text-right font-bold text-green-600 text-xs">{{ formatWeight(customer.totalWeight) }} Kg</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Top by Transactions -->
  <div class="top-customers-section">
    <h3 class="flex items-center gap-2">
      <History class="w-5 h-5 text-blue-600" />
      Top Frekuensi (Ind)
    </h3>
    <div class="table-wrapper">
      <table class="customers-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Nama</th>
            <th class="text-right">Transaksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in topIndCount" :key="customer.customerId">
            <td class="rank">{{ customer.rank }}</td>
            <td class="customer-name text-xs">{{ customer.customerName }}</td>
            <td class="value text-right font-bold text-blue-600 text-xs">{{ customer.totalTransactions }}x</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Group Leaderboards -->
<div class="section-divider mb-4 mt-12 flex items-center gap-2 text-slate-500 uppercase tracking-wider text-sm font-bold">
   <Users class="w-5 h-5" /> Peringkat Nasabah Grup / Kelompok
</div>
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
  <!-- Top by Value -->
  <div class="top-customers-section grp-theme">
    <h3 class="flex items-center gap-2">
      <Trophy class="w-5 h-5 text-yellow-500" />
      Top Nominal (Grup)
    </h3>
    <div class="table-wrapper">
      <table class="customers-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Nama</th>
            <th class="text-right">Total Nilai</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in topGroupNominal" :key="customer.customerId">
            <td class="rank">{{ customer.rank }}</td>
            <td class="customer-name text-xs">{{ customer.customerName }}</td>
            <td class="value text-right text-xs">{{ formatCurrency(customer.totalValue) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Top by Weight -->
  <div class="top-customers-section grp-theme">
    <h3 class="flex items-center gap-2">
      <Scale class="w-5 h-5 text-green-600" />
      Top Berat (Grup)
    </h3>
    <div class="table-wrapper">
      <table class="customers-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Nama</th>
            <th class="text-right">Total Berat</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in topGroupWeight" :key="customer.customerId">
            <td class="rank">{{ customer.rank }}</td>
            <td class="customer-name text-xs">{{ customer.customerName }}</td>
            <td class="value text-right font-bold text-green-600 text-xs">{{ formatWeight(customer.totalWeight) }} Kg</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Top by Transactions -->
  <div class="top-customers-section grp-theme">
    <h3 class="flex items-center gap-2">
      <History class="w-5 h-5 text-blue-600" />
      Top Frekuensi (Grup)
    </h3>
    <div class="table-wrapper">
      <table class="customers-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Nama</th>
            <th class="text-right">Transaksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in topGroupCount" :key="customer.customerId">
            <td class="rank">{{ customer.rank }}</td>
            <td class="customer-name text-xs">{{ customer.customerName }}</td>
            <td class="value text-right font-bold text-blue-600 text-xs">{{ customer.totalTransactions }}x</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
</template>

<script setup>
import { inject } from 'vue';
import { History, Scale, Trophy, User, Users } from 'lucide-vue-next';
import { wasteBankDashboardContextKey } from './dashboardContext';

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
} = inject(wasteBankDashboardContextKey);
</script>
