<template>
  <!-- Section header -->
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 mt-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/80 dark:border-gray-700/80 rounded-3xl p-4 md:p-5 shadow-sm">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
        <TrendingUp class="w-5 h-5" />
      </div>
      <div>
        <h2 class="text-sm md:text-base font-black text-gray-900 dark:text-white tracking-tight">Analisa Trend & Distribusi</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Visualisasi penimbangan, nilai, dan partisipasi nasabah</p>
      </div>
    </div>
    <div class="inline-flex bg-gray-100 dark:bg-gray-900/80 p-1.5 rounded-2xl text-xs font-semibold border border-gray-200/50 dark:border-gray-700/50">
      <button
        @click="changeTrendView('monthly')"
        :class="selectedTrendView === 'monthly' ? 'bg-white dark:bg-gray-800 shadow-sm text-emerald-600 dark:text-emerald-400 font-bold border border-gray-200/60 dark:border-gray-700' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'"
        class="px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
      >
        <Calendar class="w-3.5 h-3.5" /><span>Bulanan</span>
      </button>
      <button
        @click="changeTrendView('session')"
        :class="selectedTrendView === 'session' ? 'bg-white dark:bg-gray-800 shadow-sm text-emerald-600 dark:text-emerald-400 font-bold border border-gray-200/60 dark:border-gray-700' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'"
        class="px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
      >
        <Scale class="w-3.5 h-3.5" /><span>Tiap Penimbangan</span>
      </button>
    </div>
  </div>

  <!-- Enterprise Bento Grid -->
  <div class="charts-bento-enterprise mb-8">
    <!-- HERO: Trend Berat (8 col × 2 row) -->
    <article class="bento-cell bento-cell--hero lg:col-span-8 lg:row-span-2">
      <div class="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:18px_18px] pointer-events-none"></div>
      <header class="bento-header relative z-10">
        <div class="bento-badge bento-badge--emerald">
          <Scale class="w-3.5 h-3.5" /><span>TREN UTAMA</span>
        </div>
        <span class="bento-year">{{ selectedYear }}</span>
      </header>
      <h3 class="bento-title relative z-10">Trend Penimbangan ({{ trendPeriodLabel }})</h3>
      <div class="bento-chart bento-chart--hero relative z-10 flex-1">
        <canvas ref="weightChart"></canvas>
      </div>
    </article>

    <!-- SIDE: Trend Nilai -->
    <article class="bento-cell lg:col-span-4 lg:col-start-9 lg:row-start-1">
      <header class="bento-header">
        <div class="bento-badge bento-badge--blue">
          <Banknote class="w-3.5 h-3.5" /><span>NILAI</span>
        </div>
      </header>
      <h3 class="bento-title">Trend Nilai Transaksi</h3>
      <div class="bento-chart bento-chart--side">
        <canvas ref="valueChart"></canvas>
      </div>
    </article>

    <!-- SIDE: Profit Kategori -->
    <article class="bento-cell lg:col-span-4 lg:col-start-9 lg:row-start-2">
      <header class="bento-header">
        <div class="bento-badge bento-badge--amber">
          <PieChart class="w-3.5 h-3.5" /><span>PROFIT</span>
        </div>
      </header>
      <h3 class="bento-title">Breakdown Kategori</h3>
      <div class="bento-chart bento-chart--side">
        <canvas ref="categoryChart"></canvas>
      </div>
    </article>

    <!-- TILE ROW: 4 compact RT charts -->
    <article class="bento-cell bento-cell--tile lg:col-span-3 lg:row-start-3">
      <h3 class="bento-title bento-title--sm">Individu / RT (Kg)</h3>
      <div v-if="hasIndWeightData" class="bento-chart bento-chart--tile">
        <canvas ref="rtWeightIndChart"></canvas>
      </div>
      <div v-else class="bento-empty bento-empty--tile">
        <Scale class="w-4 h-4 text-indigo-400" />
        <span>Belum ada data</span>
      </div>
    </article>

    <article class="bento-cell bento-cell--tile lg:col-span-3 lg:col-start-4 lg:row-start-3">
      <h3 class="bento-title bento-title--sm">Kelompok / RT (Kg)</h3>
      <div v-if="hasGrpWeightData" class="bento-chart bento-chart--tile">
        <canvas ref="rtWeightGrpChart"></canvas>
      </div>
      <div v-else class="bento-empty bento-empty--tile">
        <Scale class="w-4 h-4 text-amber-400" />
        <span>Belum ada data</span>
      </div>
    </article>

    <article class="bento-cell bento-cell--tile lg:col-span-3 lg:col-start-7 lg:row-start-3">
      <h3 class="bento-title bento-title--sm">Aktif Individu</h3>
      <div v-if="hasIndActiveData" class="bento-chart bento-chart--tile">
        <canvas ref="rtActiveIndChart"></canvas>
      </div>
      <div v-else class="bento-empty bento-empty--tile">
        <Users class="w-4 h-4 text-emerald-400" />
        <span>Belum ada data</span>
      </div>
    </article>

    <article class="bento-cell bento-cell--tile lg:col-span-3 lg:col-start-10 lg:row-start-3">
      <h3 class="bento-title bento-title--sm">Aktif Kelompok</h3>
      <div v-if="hasGrpActiveData" class="bento-chart bento-chart--tile">
        <canvas ref="rtActiveGrpChart"></canvas>
      </div>
      <div v-else class="bento-empty bento-empty--tile">
        <Users class="w-4 h-4 text-blue-400" />
        <span>Belum ada data</span>
      </div>
    </article>

    <!-- WIDE FOOTER: Nasabah aktif tahunan -->
    <article class="bento-cell bento-cell--wide lg:col-span-12 lg:row-start-4">
      <header class="bento-header">
        <div class="bento-badge bento-badge--teal">
          <Users class="w-3.5 h-3.5" /><span>PARTISIPASI</span>
        </div>
        <span class="text-xs text-gray-400 dark:text-gray-500 font-medium">Jan – Des {{ selectedYear }}</span>
      </header>
      <h3 class="bento-title">Trend Nasabah Aktif</h3>
      <div class="bento-chart bento-chart--wide">
        <canvas ref="customersChart"></canvas>
      </div>
    </article>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue';
import { Calendar, Scale, TrendingUp, Users, Banknote, PieChart } from 'lucide-vue-next';
import { wasteBankDashboardContextKey } from './dashboardContext';

const {
  selectedYear,
  selectedTrendView,
  hasIndWeightData,
  hasGrpWeightData,
  hasIndActiveData,
  hasGrpActiveData,
  weightChart,
  valueChart,
  categoryChart,
  rtWeightIndChart,
  rtWeightGrpChart,
  rtActiveIndChart,
  rtActiveGrpChart,
  customersChart,
  changeTrendView,
} = inject(wasteBankDashboardContextKey);

const trendPeriodLabel = computed(() =>
  selectedTrendView.value === 'monthly'
    ? `Jan – Des ${selectedYear.value}`
    : `Tiap Penimbangan ${selectedYear.value}`
);
</script>

<style scoped>
.charts-bento-enterprise {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  min-width: 0;
}

@media (min-width: 1024px) {
  .charts-bento-enterprise {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    grid-template-rows: auto auto auto auto;
    gap: 1.25rem;
  }
}

.bento-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  background: rgb(255 255 255 / 0.92);
  border: 1px solid rgb(243 244 246);
  border-radius: 1.5rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.06), 0 4px 16px rgb(0 0 0 / 0.03);
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}

.bento-cell:hover {
  box-shadow: 0 8px 28px rgb(0 0 0 / 0.08);
}

:global(.dark) .bento-cell {
  background: rgb(31 41 55 / 0.92);
  border-color: rgb(55 65 81 / 0.7);
}

.bento-cell--hero {
  min-height: 420px;
}

.bento-cell--tile {
  min-height: 200px;
}

.bento-cell--wide {
  min-height: 240px;
}

.bento-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.625rem;
}

.bento-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  border: 1px solid transparent;
}

.bento-badge--emerald {
  background: rgb(236 253 245);
  color: rgb(4 120 87);
  border-color: rgb(167 243 208);
}
.bento-badge--blue {
  background: rgb(239 246 255);
  color: rgb(29 78 216);
  border-color: rgb(191 219 254);
}
.bento-badge--amber {
  background: rgb(255 251 235);
  color: rgb(180 83 9);
  border-color: rgb(253 230 138);
}
.bento-badge--teal {
  background: rgb(240 253 250);
  color: rgb(15 118 110);
  border-color: rgb(153 246 228);
}

:global(.dark) .bento-badge--emerald { background: rgb(6 78 59 / 0.35); color: rgb(110 231 183); border-color: rgb(6 95 70 / 0.5); }
:global(.dark) .bento-badge--blue { background: rgb(30 58 138 / 0.35); color: rgb(147 197 253); border-color: rgb(30 64 175 / 0.5); }
:global(.dark) .bento-badge--amber { background: rgb(120 53 15 / 0.35); color: rgb(252 211 77); border-color: rgb(146 64 14 / 0.5); }
:global(.dark) .bento-badge--teal { background: rgb(19 78 74 / 0.35); color: rgb(94 234 212); border-color: rgb(17 94 89 / 0.5); }

.bento-year {
  font-size: 0.6875rem;
  font-weight: 700;
  color: rgb(107 114 128);
  background: rgb(249 250 251);
  padding: 0.2rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid rgb(229 231 235);
}

:global(.dark) .bento-year {
  color: rgb(156 163 175);
  background: rgb(17 24 39 / 0.6);
  border-color: rgb(55 65 81);
}

.bento-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: rgb(15 23 42);
  margin: 0 0 0.75rem 0;
  line-height: 1.35;
}

.bento-title--sm {
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

:global(.dark) .bento-title {
  color: rgb(241 245 249);
}

.bento-chart {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
}

.bento-chart--hero {
  min-height: 300px;
}

.bento-chart--side {
  min-height: 155px;
}

.bento-chart--tile {
  min-height: 130px;
}

.bento-chart--wide {
  min-height: 180px;
}

.bento-chart canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

@media (min-width: 1024px) {
  .bento-cell--hero {
    min-height: 460px;
  }

  .bento-chart--hero {
    min-height: 360px;
  }

  .bento-chart--side {
    min-height: 165px;
  }
}

.bento-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  border-radius: 1rem;
  border: 2px dashed rgb(229 231 235);
  background: rgb(249 250 251 / 0.6);
  color: rgb(156 163 175);
  font-size: 0.6875rem;
  font-weight: 600;
}

.bento-empty--tile {
  min-height: 130px;
}

:global(.dark) .bento-empty {
  border-color: rgb(55 65 81);
  background: rgb(17 24 39 / 0.4);
  color: rgb(107 114 128);
}
</style>
