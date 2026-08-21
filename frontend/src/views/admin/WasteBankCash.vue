<template>
  <div class="p-4 sm:p-8 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Wallet class="w-8 h-8 text-green-600" />
          Kas Pengurus
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Kelola arus kas masuk dan keluar untuk operasional bank sampah.
        </p>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center gap-3">
        <!-- Date Filter -->
        <div class="flex items-center gap-2 bg-white dark:bg-gray-900 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
           <select v-model="selectedMonth" class="bg-transparent border-none text-sm focus:ring-0 dark:text-white">
             <option v-for="(month, index) in months" :key="index" :value="index + 1">{{ month }}</option>
           </select>
           <select v-model="selectedYear" class="bg-transparent border-none text-sm focus:ring-0 dark:text-white border-l border-gray-200 dark:border-gray-700 pl-2">
               <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
           </select>
           <button 
               @click="fetchData"
               class="ml-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
           >
               Refresh
           </button>
        </div>

        <button 
          @click="showAddModal = true"
          class="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition"
        >
          <Plus class="w-4 h-4" />
          Catat Transaksi
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Balance Card -->
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border-l-4 border-blue-500">
        <div class="flex items-center justify-between mb-4">
          <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <DollarSign class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <span class="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
            Saldo Saat Ini
          </span>
        </div>
        <h3 class="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          {{ formatCurrency(summary.balance || 0) }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Total saldo kas ditangan
        </p>
      </div>

       <!-- Income Card -->
       <div class="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border-l-4 border-green-500">
        <div class="flex items-center justify-between mb-4">
          <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
             <ArrowDownCircle class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <span class="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
            Pemasukan (Bulan Ini)
          </span>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          + {{ formatCurrency(summary.income_month || 0) }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Dari subsidi, penjualan, dll
        </p>
      </div>

       <!-- Expense Card -->
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border-l-4 border-red-500">
        <div class="flex items-center justify-between mb-4">
          <div class="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
             <ArrowUpCircle class="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <span class="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
            Pengeluaran (Bulan Ini)
          </span>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          - {{ formatCurrency(summary.expense_month || 0) }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Operasional, konsumsi, alat
        </p>
      </div>

       <!-- Shrinkage Card -->
       <div class="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border-l-4 border-orange-500">
        <div class="flex items-center justify-between mb-4">
          <div class="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
             <AlertTriangle class="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <span class="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">
            Penyusutan (Bulan Ini)
          </span>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          - {{ formatCurrency(summary.shrinkage_month || 0) }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Selisih timbangan
        </p>
      </div>
    </div>
    
    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Income by Category Chart -->
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-800">
        <h3 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <PieChart class="w-5 h-5 text-green-600" />
          Komposisi Pemasukan
        </h3>
        <div class="h-64 relative">
          <canvas ref="incomeChartRef"></canvas>
          <div v-if="!incomeChartData.labels.length" class="absolute inset-0 flex items-center justify-center text-sm text-gray-400 italic">
            Belum ada data pemasukan
          </div>
        </div>
      </div>

      <!-- Expense by Category Chart -->
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-800">
        <h3 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 class="w-5 h-5 text-red-600" />
          Komposisi Pengeluaran
        </h3>
        <div class="h-64 relative">
          <canvas ref="expenseChartRef"></canvas>
          <div v-if="!expenseChartData.labels.length" class="absolute inset-0 flex items-center justify-center text-sm text-gray-400 italic">
            Belum ada data pengeluaran
          </div>
        </div>
      </div>
    </div>

    <!-- Mockup: Ringkasan Arus Kas Tahunan (Jan - Des) -->
    <div class="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl shadow-xl p-6 border border-emerald-500/20 mb-8 overflow-hidden relative">
      <!-- Glow effects -->
      <div class="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
        <div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/30">
            <Sparkles class="w-3.5 h-3.5" />
            <span>Ringkasan Tahunan Total</span>
          </div>
          <h3 class="text-xl font-extrabold text-white flex items-center gap-2">
            <Table class="w-6 h-6 text-emerald-400" />
            <span>Rekapitulasi Kas Seluruh Bulan (Tahun {{ selectedYear }})</span>
          </h3>
          <p class="text-sm text-slate-300 mt-0.5">Ringkasan total pemasukan, pengeluaran, dan penyusutan operasional per bulan</p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="fetchYearlySummary" class="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl border border-white/10 transition flex items-center gap-1.5 shadow-sm">
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loadingYearly }" />
            <span>Refresh Rekap</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loadingYearly" class="py-12 text-center relative z-10">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto"></div>
        <p class="mt-3 text-xs text-slate-400">Menghitung akumulasi kas tahunan...</p>
      </div>

      <!-- Yearly Table -->
      <div v-else class="overflow-x-auto relative z-10 rounded-xl border border-white/10 bg-black/20 backdrop-blur-md">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-white/10 bg-white/5 text-slate-300 text-xs font-semibold uppercase tracking-wider">
              <th class="py-3.5 px-4">Bulan</th>
              <th class="py-3.5 px-4 text-right">Pemasukan</th>
              <th class="py-3.5 px-4 text-right">Pengeluaran</th>
              <th class="py-3.5 px-4 text-right">Penyusutan</th>
              <th class="py-3.5 px-4 text-right">Surplus / Defisit</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-sm">
            <tr v-for="item in yearlySummary" :key="item.monthNumber" :class="item.monthNumber === selectedMonth ? 'bg-emerald-500/20 font-medium' : 'hover:bg-white/5'" class="transition-colors">
              <td class="py-3 px-4 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" :class="item.monthNumber === selectedMonth ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'"></span>
                {{ item.monthName }}
                <span v-if="item.monthNumber === selectedMonth" class="text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded ml-1">Terpilih</span>
              </td>
              <td class="py-3 px-4 text-right text-emerald-400 font-mono">{{ formatCurrency(item.income) }}</td>
              <td class="py-3 px-4 text-right text-rose-400 font-mono">{{ formatCurrency(item.expense) }}</td>
              <td class="py-3 px-4 text-right text-amber-400 font-mono">{{ formatCurrency(item.shrinkage) }}</td>
              <td class="py-3 px-4 text-right font-mono font-bold" :class="item.net >= 0 ? 'text-teal-300' : 'text-rose-300'">
                {{ item.net >= 0 ? '+' : '' }} {{ formatCurrency(item.net) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-gradient-to-r from-emerald-900/60 to-teal-900/60 border-t-2 border-emerald-500/30 font-bold text-white text-sm">
              <td class="py-4 px-4">TOTAL TAHUN {{ selectedYear }}</td>
              <td class="py-4 px-4 text-right text-emerald-300 font-mono">{{ formatCurrency(yearlyTotals.income) }}</td>
              <td class="py-4 px-4 text-right text-rose-300 font-mono">{{ formatCurrency(yearlyTotals.expense) }}</td>
              <td class="py-4 px-4 text-right text-amber-300 font-mono">{{ formatCurrency(yearlyTotals.shrinkage) }}</td>
              <td class="py-4 px-4 text-right font-mono text-base" :class="yearlyTotals.net >= 0 ? 'text-teal-200' : 'text-rose-200'">
                {{ yearlyTotals.net >= 0 ? '+' : '' }} {{ formatCurrency(yearlyTotals.net) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Transaction List Table -->
    <div class="bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 class="font-bold text-gray-900 dark:text-white">Rincian Pemasukan Kas</h3>
        
        <div class="flex items-center gap-2 w-full sm:w-auto">
            <!-- Export Buttons -->
            <button @click="exportToPDF" class="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition" title="Export PDF">
                <FileText class="w-5 h-5" />
            </button>
            <button @click="exportToExcel" class="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition" title="Export Excel">
                <FileSpreadsheet class="w-5 h-5" />
            </button>

            <!-- Category Filter -->
            <select 
               v-model="selectedCategory" 
               class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2 outline-none"
            >
               <option value="">Semua Kategori</option>
               <option v-for="cat in availableCategories" :key="cat" :value="cat">{{ cat }}</option>
            </select>

            <!-- Search Input -->
            <div class="relative w-full sm:w-64">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Cari ID atau Nasabah..." 
                class="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                />
            </div>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="p-12 text-center">
         <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
         <p class="mt-4 text-sm text-gray-500">Memuat data kas...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="transactions.length === 0" class="p-12 text-center">
         <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <Inbox class="w-8 h-8 text-gray-400" />
         </div>
         <h3 class="text-lg font-medium text-gray-900 dark:text-white">Belum ada transaksi</h3>
         <p class="mt-1 text-gray-500 dark:text-gray-400">Belum ada pencatatan kas untuk periode ini.</p>
      </div>

      <!-- Desktop Table View -->
      <div v-else class="hidden md:block overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase font-medium">
            <tr>
              <th class="px-6 py-4 w-48">Waktu & Ref</th>
              <th class="px-6 py-4">Detail Transaksi</th>
              <th class="px-6 py-4">Kategori</th>
              <th class="px-6 py-4 text-center">Berat</th>
              <th class="px-6 py-4 text-right">Harga Pelapak</th>
              <th class="px-6 py-4 text-right">Harga Nasabah</th>
              <th class="px-6 py-4 text-right w-40">Arus Kas</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            <tr v-for="trx in filteredTransactions" :key="trx._id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
              <!-- Column 1: Waktu & Ref -->
              <td class="px-6 py-4 align-top">
                <div class="font-bold text-gray-900 dark:text-white">
                  {{ formatDate(trx.date, true) }}
                </div>
                <div class="text-xs text-gray-400 font-mono mt-0.5">
                  <span v-if="trx.source === 'SYSTEM'">{{ trx.transactionId }}</span>
                  <span v-else class="italic">Manual Entry</span>
                </div>
              </td>

              <!-- Column 2: Detail Transaksi -->
              <td class="px-6 py-4 align-top">
                 <!-- Main Subject -->
                 <div class="font-bold text-gray-900 dark:text-white text-base mb-1">
                    {{ trx.source === 'SYSTEM' ? trx.customerName : trx.description }}
                 </div>
                 
                 <!-- Badges & Metadata (Proof Only) -->
                 <div class="flex flex-wrap items-center gap-2">
                    <!-- Source Badge -->
                    <span v-if="trx.source === 'MANUAL'" class="px-2 py-0.5 rounded text-xs font-medium text-gray-400 border border-gray-200 dark:border-gray-700">
                        Manual
                    </span>

                    <!-- Proof Link -->
                    <button v-if="trx.proof_url" 
                       @click.stop="openProof(trx.proof_url)"
                       class="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition"
                       title="Lihat Bukti Transaksi"
                    >
                        <ImageIcon class="w-3 h-3" /> Bukti
                    </button>
                 </div>
              </td>

              <!-- Column 3: Kategori -->
              <td class="px-6 py-4 align-top">
                <span class="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                    {{ trx.category }}
                </span>
              </td>

              <!-- Column 4: Berat -->
              <td class="px-6 py-4 align-top text-center">
                <span v-if="trx.source === 'SYSTEM'" class="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                    {{ formatWeight(trx.totalWeight) }} kg
                </span>
                <span v-else class="text-gray-300 text-xs italic">-</span>
              </td>

              <!-- Column 3: Harga Pelapak -->
              <td class="px-6 py-4 align-top text-right">
                 <div v-if="trx.source === 'SYSTEM'" class="font-medium text-indigo-600 dark:text-indigo-400">
                    {{ formatCurrency(trx.totalPelapakValue ?? ((trx.totalValue || 0) + (trx.amount || 0))) }}
                 </div>
                 <div v-else class="text-gray-300 text-xs italic">
                    -
                 </div>
              </td>

              <!-- Column 4: Harga Nasabah -->
              <td class="px-6 py-4 align-top text-right">
                 <div v-if="trx.source === 'SYSTEM'" class="font-medium text-gray-900 dark:text-white">
                    {{ formatCurrency(trx.totalValue || 0) }}
                 </div>
                 <div v-else class="text-gray-300 text-xs italic">
                    -
                 </div>
              </td>

              <!-- Column 4: Arus Kas -->
              <td class="px-6 py-4 align-top text-right">
                 <div class="text-lg font-bold" :class="trx.type === 'IN' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'">
                    {{ trx.type === 'IN' ? '+' : '-' }} {{ formatCurrency(trx.amount) }}
                 </div>
                 <div class="text-xs font-bold uppercase tracking-wider mt-1" 
                      :class="trx.type === 'IN' ? 'text-green-600/70' : 'text-red-600/70'">
                    {{ trx.type === 'IN' ? 'Pemasukan' : 'Pengeluaran' }}
                 </div>
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <tr>
                  <td colspan="6" class="px-6 py-4 text-right font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Total Periode Ini</td>
                  <td class="px-6 py-4 text-right font-bold text-gray-900 dark:text-white text-lg">
                      {{ formatCurrency((summary.income_month || 0) - (summary.expense_month || 0)) }}
                  </td>
              </tr>
          </tfoot>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div v-if="!loading && transactions.length > 0" class="block md:hidden bg-gray-50 dark:bg-gray-900 p-4 space-y-4">
          <div v-for="trx in filteredTransactions" :key="trx._id" class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="flex justify-between items-start mb-2">
               <div>
                  <div class="text-xs text-gray-500">{{ formatDate(trx.date) }}</div>
                  
                  <template v-if="trx.source === 'SYSTEM'">
                      <div class="font-bold text-gray-900 dark:text-white">{{ trx.customerName }}</div>
                      <div class="text-xs text-gray-500">{{ trx.transactionId }}</div>
                  </template>
                  <template v-else>
                      <div class="font-bold text-gray-900 dark:text-white">{{ trx.description }}</div>
                  </template>
               </div>
               <span class="text-sm font-bold" :class="trx.type === 'IN' ? 'text-green-600' : 'text-red-600'">
                  {{ trx.type === 'IN' ? '+' : '-' }} {{ formatCurrency(trx.amount) }}
               </span>
            </div>
             <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div class="flex items-center gap-2">
                    <span class="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {{ trx.category }}
                    </span>
                    <span v-if="trx.type === 'OUT'" class="text-xs px-2 py-0.5 rounded bg-red-100 text-red-600 font-bold">KELUAR</span>
                </div>
                <span v-if="trx.source === 'MANUAL'" class="text-xs text-gray-400">Saldo: {{ formatCurrency(trx.balance_after) }}</span>
                <span v-else class="text-xs text-gray-400">Virtual</span>
             </div>
          </div>
      </div>
    </div>

    <!-- Modal -->
    <AddCashTransactionModal 
      :show="showAddModal" 
      @close="showAddModal = false"
      @saved="fetchData"
    />

    <!-- Proof Image Modal -->
    <div v-if="viewingProofUrl" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" @click="viewingProofUrl = null">
       <div class="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden max-w-4xl max-h-[90vh] shadow-2xl animate-in fade-in zoom-in-95 duration-200" @click.stop>
          <div class="absolute top-2 right-2 z-10">
             <button @click="viewingProofUrl = null" class="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition">
                <X class="w-5 h-5" />
             </button>
          </div>
          
          <div class="relative w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
              <template v-if="viewingProofUrl?.toLowerCase().endsWith('.pdf')">
                 <iframe :src="viewingProofUrl" class="w-full h-[85vh]" frameborder="0"></iframe>
              </template>
              <template v-else>
                 <img :src="viewingProofUrl" class="max-w-full max-h-[85vh] object-contain" alt="Bukti Transaksi" />
              </template>
          </div>
       </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { Wallet, DollarSign, Inbox, ArrowUpCircle, ArrowDownCircle, Search, Plus, FileText, FileSpreadsheet, Image as ImageIcon, X, AlertTriangle, PieChart, BarChart3, Sparkles, Table, RefreshCw } from 'lucide-vue-next';
import Chart from 'chart.js/auto';
import api from '@/utils/api';
import AddCashTransactionModal from '@/components/waste-bank/AddCashTransactionModal.vue';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const loading = ref(false);
const showAddModal = ref(false);
const transactions = ref([]);
const summary = ref({});
const searchQuery = ref('');
const selectedCategory = ref('');
const viewingProofUrl = ref(null); // State for modal
const yearlySummary = ref([]);
const loadingYearly = ref(false);

const yearlyTotals = computed(() => {
    return yearlySummary.value.reduce((acc, curr) => {
        acc.income += curr.income || 0;
        acc.expense += curr.expense || 0;
        acc.shrinkage += curr.shrinkage || 0;
        acc.net += curr.net || 0;
        return acc;
    }, { income: 0, expense: 0, shrinkage: 0, net: 0 });
});

// Chart Refs & Instances
const incomeChartRef = ref(null);
const expenseChartRef = ref(null);
let incomeChartInstance = null;
let expenseChartInstance = null;

// Date Filters
const today = new Date();
const selectedMonth = ref(today.getMonth() + 1);
const selectedYear = ref(today.getFullYear());

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const years = computed(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
});

// Computed Available Categories
const availableCategories = computed(() => {
    const categories = new Set(transactions.value.map(t => t.category).filter(Boolean));
    return Array.from(categories).sort();
});

// Watch Filters
watch([selectedMonth, selectedYear], () => {
  fetchData();
});

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
};

const formatWeight = (value) => {
  if (value === null || value === undefined) return '0';
  return parseFloat(Number(value).toFixed(2));
};

const formatDate = (dateString, withSecond = false) => {
  const options = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  if (withSecond) options.second = '2-digit';
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

// Filter Logic
const filteredTransactions = computed(() => {
    let filtered = transactions.value;

    // 1. Filter by Category
    if (selectedCategory.value) {
        filtered = filtered.filter(trx => trx.category === selectedCategory.value);
    }

    // 2. Filter by Search Query
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(trx => 
            (trx.description && trx.description.toLowerCase().includes(query)) ||
            (trx.category && trx.category.toLowerCase().includes(query)) ||
            (trx.transactionId && trx.transactionId.toLowerCase().includes(query)) ||
            (trx.performed_by?.nama_lengkap && trx.performed_by.nama_lengkap.toLowerCase().includes(query)) ||
            (trx.customerName && trx.customerName.toLowerCase().includes(query))
        );
    }
    
    return filtered;
});

// Method to open proof modal
const openProof = (url) => {
    viewingProofUrl.value = url;
};

// Aggregate Chart Data
const incomeChartData = computed(() => {
    const map = {};
    transactions.value.filter(t => t.type === 'IN').forEach(t => {
        const cat = t.category || 'Lainnya';
        map[cat] = (map[cat] || 0) + (t.amount || 0);
    });
    return {
        labels: Object.keys(map),
        data: Object.values(map)
    };
});

const expenseChartData = computed(() => {
    const map = {};
    transactions.value.filter(t => t.type === 'OUT').forEach(t => {
        const cat = t.category || 'Lainnya';
        map[cat] = (map[cat] || 0) + (t.amount || 0);
    });
    return {
        labels: Object.keys(map),
        data: Object.values(map)
    };
});

const renderCharts = async () => {
    await nextTick();
    
    // 1. Income Chart
    if (incomeChartRef.value) {
        if (incomeChartInstance) incomeChartInstance.destroy();
        if (incomeChartData.value.labels.length > 0) {
            incomeChartInstance = new Chart(incomeChartRef.value, {
                type: 'doughnut',
                data: {
                    labels: incomeChartData.value.labels,
                    datasets: [{
                        data: incomeChartData.value.data,
                        backgroundColor: ['#22c55e', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } },
                        tooltip: {
                            callbacks: {
                                label: (context) => ` ${context.label}: ${formatCurrency(context.parsed)}`
                            }
                        }
                    },
                    cutout: '70%'
                }
            });
        }
    }

    // 2. Expense Chart
    if (expenseChartRef.value) {
        if (expenseChartInstance) expenseChartInstance.destroy();
        if (expenseChartData.value.labels.length > 0) {
            expenseChartInstance = new Chart(expenseChartRef.value, {
                type: 'bar',
                data: {
                    labels: expenseChartData.value.labels,
                    datasets: [{
                        label: 'Pengeluaran (Rp)',
                        data: expenseChartData.value.data,
                        backgroundColor: ['#ef4444', '#f87171', '#fb923c', '#fca5a5', '#fecaca'],
                        borderRadius: 6,
                    }]
                },
                options: {
                    indexAxis: 'y', // Horizontal bars
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) => ` ${context.label}: ${formatCurrency(context.parsed.x)}`
                            }
                        }
                    },
                    scales: {
                        x: { 
                            beginAtZero: true,
                            grid: { display: false },
                            ticks: { 
                                callback: (value) => formatCurrency(value).replace(',00', ''),
                                font: { size: 10 }
                            }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { font: { weight: 'bold' } }
                        }
                    }
                }
            });
        }
    }
};

async function fetchYearlySummary() {
    loadingYearly.value = true;
    try {
        const promises = [];
        for (let m = 1; m <= 12; m++) {
            promises.push(api.get('/api/cash/summary', {
                params: { month: m, year: selectedYear.value }
            }));
        }
        const results = await Promise.all(promises);
        yearlySummary.value = results.map((res, idx) => {
            const data = res.data?.data || {};
            const inc = data.income_month || 0;
            const exp = data.expense_month || 0;
            const shr = data.shrinkage_month || 0;
            return {
                monthName: months[idx],
                monthNumber: idx + 1,
                income: inc,
                expense: exp,
                shrinkage: shr,
                net: inc - exp - shr
            };
        });
    } catch (err) {
        console.error("Failed fetching yearly summary:", err);
    } finally {
        loadingYearly.value = false;
    }
}

async function fetchData() {
    loading.value = true;
    try {
        fetchYearlySummary(); // trigger in background concurrently

        // 1. Get Summary (with month/year filter)
        const summaryRes = await api.get('/api/cash/summary', {
            params: {
                month: selectedMonth.value,
                year: selectedYear.value
            }
        });
        summary.value = summaryRes.data.data;

        // 2. Get Transactions (Monthly Filter)
        const startDate = new Date(selectedYear.value, selectedMonth.value - 1, 1);
        const endDate = new Date(selectedYear.value, selectedMonth.value, 0, 23, 59, 59);

        const trxRes = await api.get('/api/cash/transactions', {
            params: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                limit: 200 // Higher limit for cash history
            }
        });
        
        transactions.value = trxRes.data.data || [];
        renderCharts();
    } catch (error) {
        console.error("Failed to load cash data:", error);
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchData();
});

const getExportData = () => {
    return filteredTransactions.value.map(trx => ({
        'Tanggal': formatDate(trx.date),
        'Keterangan': trx.source === 'SYSTEM' ? `${trx.description} - ${trx.customerName}` : trx.description,
        'Kategori': trx.category,
        'Berat': trx.source === 'SYSTEM' ? `${formatWeight(trx.totalWeight)} kg` : '-',
        'Harga Pelapak': trx.source === 'SYSTEM' ? (trx.totalPelapakValue ?? ((trx.totalValue || 0) + (trx.amount || 0))) : '-',
        'Harga Nasabah': trx.source === 'SYSTEM' ? (trx.totalValue || 0) : '-',
        'Arus Kas': trx.amount,
        'Saldo Akhir': trx.balance_after,
        'Petugas': trx.performed_by?.nama_lengkap || 'System'
    }));
};

const exportToExcel = () => {
    const data = getExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Kas");
    
    // Auto column width
    const maxWidth = data.reduce((w, r) => Math.max(w, JSON.stringify(r).length), 10);
    const colWidth = { wch: maxWidth };
    
    XLSX.writeFile(workbook, `Laporan_Kas_${months[selectedMonth.value - 1]}_${selectedYear.value}.xlsx`);
};

const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Laporan Kas Operasional Bank Sampah', 14, 22);
    
    // Period & Summary
    doc.setFontSize(11);
    doc.text(`Periode: ${months[selectedMonth.value - 1]} ${selectedYear.value}`, 14, 32);
    doc.text(`Saldo Akhir: ${formatCurrency(summary.value.balance || 0)}`, 14, 38);
    doc.text(`Total Pemasukan: ${formatCurrency(summary.value.income_month || 0)}`, 14, 44);
    doc.text(`Total Pengeluaran: ${formatCurrency(summary.value.expense_month || 0)}`, 14, 50);

    // Table
    const tableColumn = ["Tanggal", "Keterangan", "Kat", "Berat", "Pelapak", "Nasabah", "Arus Kas", "Saldo"];
    const tableRows = filteredTransactions.value.map(trx => [
        formatDate(trx.date),
        trx.source === 'SYSTEM' ? `${trx.description}\n${trx.customerName}` : trx.description,
        trx.category,
        trx.source === 'SYSTEM' ? `${formatWeight(trx.totalWeight)} kg` : '-',
        trx.source === 'SYSTEM' ? formatCurrency(trx.totalPelapakValue ?? ((trx.totalValue || 0) + (trx.amount || 0))) : '-',
        trx.source === 'SYSTEM' ? formatCurrency(trx.totalValue || 0) : '-',
        formatCurrency(trx.amount),
        formatCurrency(trx.balance_after)
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 55,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 163, 74] } // Green-600
    });

    doc.save(`Laporan_Kas_${months[selectedMonth.value - 1]}_${selectedYear.value}.pdf`);
};
</script>
