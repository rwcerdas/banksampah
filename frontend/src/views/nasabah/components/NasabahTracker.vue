<template>
  <div class="bg-white dark:bg-gray-900 min-h-dvh pb-nav-mobile">

    <!-- Header Section with Month Picker -->
    <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-20">
        <div>
            <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                Tracker
            </h3>
        </div>
        <!-- Month Picker -->
        <div class="relative">
            <button
              @click="showMonthPicker = !showMonthPicker"
              class="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
                {{ getMonthName(selectedMonth) }} {{ selectedYear }}
                <Calendar class="w-4 h-4 text-gray-500" />
            </button>

            <!-- Dropdown -->
            <div v-if="showMonthPicker" class="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-4">
                <div class="flex justify-between items-center mb-4">
                    <button @click="$emit('update:selectedYear', selectedYear - 1)" class="p-1 hover:bg-gray-100 rounded"><ChevronLeft class="w-4 h-4" /></button>
                    <span class="font-bold">{{ selectedYear }}</span>
                    <button @click="$emit('update:selectedYear', selectedYear + 1)" class="p-1 hover:bg-gray-100 rounded"><ChevronRight class="w-4 h-4" /></button>
                </div>
                <div class="grid grid-cols-3 gap-2">
                    <button
                      v-for="m in 12"
                      :key="m"
                      @click="selectMonth(m)"
                      class="p-2 text-xs rounded hover:bg-green-50 dark:hover:bg-green-900"
                      :class="selectedMonth === m ? 'bg-green-600 text-white font-bold' : 'text-gray-700 dark:text-gray-300'"
                    >
                      {{ getMonthName(m).substring(0, 3) }}
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Summary & Chart Section -->
    <div class="px-4 sm:px-6 py-6 pb-2">
        <!-- Tabs -->
        <div class="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              v-for="tab in ['Mutasi', 'Transfer', 'Penarikan', 'Analisis']"
              :key="tab"
              class="pb-2 text-sm font-medium transition relative"
              :class="activeTab === tab ? 'text-green-600 dark:text-green-400' : 'text-gray-500 hover:text-gray-700'"
              @click="activeTab = tab"
            >
                {{ tab }}
                <div v-if="activeTab === tab" class="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-t-full"></div>
            </button>
        </div>

        <!-- Chart (Simple Bar Visualization) -->
        <div v-if="activeTab === 'Mutasi'" class="mb-8">
            <div class="flex h-72 gap-3 mb-4 px-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div v-for="(val, idx) in weeklyChartData" :key="idx" class="flex-1 flex flex-col justify-end items-center group cursor-pointer relative h-full">
                    <div
                      v-if="val.amount > 0"
                      class="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg shadow-md transition-all duration-500 group-hover:from-green-500 group-hover:to-green-300"
                      :style="{ height: Math.max(val.percentage, 5) + '%', minHeight: '8px' }"
                    ></div>
                    <div
                      v-else
                      class="w-full bg-gray-300 dark:bg-gray-700 rounded-t-sm"
                      style="height: 3px"
                    ></div>
                    <!-- Tooltip -->
                    <div class="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap z-10 transition shadow-lg">
                        {{ formatCurrency(val.amount) }}
                    </div>
                </div>
            </div>
            <!-- X-Axis Labels -->
            <div class="flex justify-between text-[10px] text-gray-400 px-2 font-mono">
                <span>Minggu 1</span>
                <span>Minggu 2</span>
                <span>Minggu 3</span>
                <span>Minggu 4</span>
            </div>

            <!-- Divider -->
            <div class="border-t border-dashed border-gray-200 dark:border-gray-700 my-6"></div>

            <!-- Financial Summary -->
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-xs text-yellow-600 dark:text-yellow-500 mb-1 font-medium">Pengeluaran (Withdraw)</p>
                    <p class="text-lg font-bold text-yellow-600 dark:text-yellow-500">{{ formatCurrency(totalWithdraw) }}</p>
                </div>
                <div class="text-right border-l border-gray-100 pl-4">
                     <p class="text-xs text-green-600 dark:text-green-400 mb-1 font-medium">Pemasukan (Setor)</p>
                     <p class="text-lg font-bold text-green-600 dark:text-green-400">{{ formatCurrency(totalIncome) }}</p>
                </div>
            </div>
        </div>

        <!-- Transfer History Tab -->
        <div v-if="activeTab === 'Transfer'" class="mb-8">
            <div v-if="transfers.length === 0" class="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <ArrowRightLeft class="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p class="text-gray-500 font-medium">Belum ada riwayat transfer</p>
            </div>

            <div v-else class="space-y-3">
                <div v-for="trf in transfers" :key="trf._id"
                     class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center"
                >
                    <!-- Icon & Info -->
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                             :class="trf.senderId === customer?._id ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'"
                        >
                            <ArrowUpRight v-if="trf.senderId === customer?._id" class="w-5 h-5" />
                            <ArrowDownLeft v-else class="w-5 h-5" />
                        </div>
                        <div>
                            <h4 class="font-bold text-sm text-gray-900 dark:text-white">
                                {{ trf.senderId === customer?._id ? 'Kirim ke ' + trf.receiverName : 'Terima dari ' + trf.senderName }}
                            </h4>
                            <p class="text-xs text-gray-500">{{ formatDate(trf.transferDate) }}</p>
                            <p v-if="trf.notes" class="text-[10px] text-gray-400 mt-0.5 italic">"{{ trf.notes }}"</p>
                        </div>
                    </div>

                    <!-- Amount -->
                    <div class="text-right">
                         <p class="font-bold text-sm"
                            :class="trf.senderId === customer?._id ? 'text-red-600' : 'text-green-600'"
                         >
                            {{ trf.senderId === customer?._id ? '-' : '+' }} {{ formatCurrency(trf.amount) }}
                         </p>
                         <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                             {{ trf.status }}
                         </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Penarikan History Tab -->
        <div v-if="activeTab === 'Penarikan'" class="mb-8">
             <div v-if="withdrawals.length === 0" class="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <Banknote class="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p class="text-gray-500 font-medium">Belum ada riwayat penarikan</p>
            </div>

            <div v-else class="space-y-3">
                <div v-for="wth in withdrawals" :key="wth._id"
                     class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center"
                >
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
                            <Wallet class="w-5 h-5" />
                        </div>
                        <div>
                            <h4 class="font-bold text-sm text-gray-900 dark:text-white">
                                {{ wth.method === 'CASH' ? 'Tarik Tunai' : (wth.destinationDetail?.bankName || 'Transfer') }}
                            </h4>
                            <p class="text-xs text-gray-500">{{ formatDate(wth.withdrawalDate) }}</p>
                            <p class="text-[10px] text-gray-400 font-mono mt-0.5">{{ wth.withdrawalId }}</p>

                            <!-- Rejection Reason -->
                            <p v-if="wth.status === 'REJECTED' && wth.cancelReason" class="text-[11px] text-red-500 mt-1 italic">
                                "{{ wth.cancelReason }}"
                            </p>

                            <!-- View Proof Button -->
                            <button v-if="wth.status === 'COMPLETED' && wth.proofUrl" @click.stop="$emit('view-proof', wth.proofUrl)" class="text-[10px] text-blue-600 underline mt-1 flex items-center gap-1">
                                <FileText class="w-3 h-3" /> Lihat Bukti Transfer
                            </button>
                        </div>
                    </div>

                    <div class="text-right">
                         <p class="font-bold text-sm text-red-600">
                            - {{ formatCurrency(wth.amount) }}
                         </p>
                         <span class="text-[10px] px-2 py-0.5 rounded-full font-medium"
                           :class="{
                             'bg-yellow-100 text-yellow-700': wth.status === 'PENDING',
                             'bg-green-100 text-green-700': wth.status === 'COMPLETED' || wth.status === 'APPROVED',
                             'bg-red-100 text-red-700': wth.status === 'REJECTED' || wth.status === 'CANCELLED'
                           }"
                         >
                             {{ wth.status }}
                         </span>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="activeTab === 'Analisis'" class="py-6 space-y-8">
            <!-- Chart Section -->
            <div v-if="categoryStats.length > 0" class="flex flex-col items-center">
                <h4 class="text-sm font-bold text-gray-900 dark:text-white mb-6">Komposisi Sampah</h4>
                <div class="relative w-48 h-48">
                    <svg viewBox="-1.2 -1.2 2.4 2.4" class="w-full h-full -rotate-90">
                        <path
                            v-for="(stat, idx) in donutChartData"
                            :key="idx"
                            :d="stat.path"
                            :fill="stat.color"
                            stroke="white"
                            stroke-width="0.05"
                            class="dark:stroke-gray-900"
                        />
                        <!-- Hole -->
                        <circle cx="0" cy="0" r="0.6" fill="white" class="dark:fill-gray-900" />
                    </svg>
                    <!-- Center Text -->
                    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span class="text-xs text-gray-400">Total</span>
                        <span class="text-lg font-bold text-gray-900 dark:text-white">{{ homeStats.totalWeight }} Kg</span>
                    </div>
                </div>
            </div>

            <!-- Stats List -->
            <div v-if="categoryStats.length > 0" class="space-y-5 px-2">
                <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rincian Kategori</h4>
                <div v-for="stat in categoryStats" :key="stat.name" class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
                    <div class="flex items-center gap-3">
                        <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: stat.color }"></div>
                        <div>
                            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ stat.name }}</p>
                            <p class="text-xs text-gray-500">{{ stat.percentage.toFixed(1) }}%</p>
                        </div>
                    </div>
                    <div class="text-right">
                         <p class="text-sm font-bold text-gray-900 dark:text-white">{{ stat.weight }} Kg</p>
                         <p class="text-xs text-gray-500">{{ formatCurrency(stat.value) }}</p>
                    </div>
                </div>
            </div>

            <!-- Empty State for Analysis -->
            <div v-else class="text-center py-12">
                <div class="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PieChart class="w-8 h-8 text-gray-400" />
                </div>
                <p class="text-gray-500 font-medium">Belum ada data untuk dianalisis</p>
                <p class="text-xs text-gray-400 mt-1">Lakukan setor sampah untuk melihat statistik.</p>
            </div>
        </div>
    </div>

    <!-- Transaction List Section (MUTASI ONLY) -->
    <div v-if="activeTab === 'Mutasi'" class="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 min-h-[300px]">
        <div class="p-3 bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0">
            {{ getMonthName(selectedMonth) }} {{ selectedYear }}
        </div>

        <div v-if="loadingTransactions" class="p-8 text-center text-gray-500">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto mb-2"></div>
            Memuat data...
        </div>

        <div v-else-if="groupedTransactions.length === 0" class="p-12 text-center text-gray-400 text-sm">
            Tidak ada transaksi bulan ini.
        </div>

        <div v-else class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            <!-- Group By Date -->
            <div v-for="(group, gIdx) in groupedTransactions" :key="gIdx">
                <!-- Date Header -->
                <div class="px-6 py-2 bg-gray-50/50 dark:bg-black/20 text-xs font-semibold text-gray-500 flex justify-between">
                    <span>{{ formatDateFull(group.date) }}</span>
                </div>

        <!-- Items -->
        <div
          v-for="trx in group.items"
          :key="trx._id"
          @click="$emit('open-detail', trx)"
          class="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition group cursor-pointer"
        >
            <div class="flex items-center gap-4">
                <!-- Icon Box -->
                <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    :class="trx.inferredType === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'"
                >
                    <Recycle v-if="trx.inferredType === 'INCOME'" class="w-5 h-5" />
                    <ArrowUp v-else class="w-5 h-5" />
                </div>
                <div>
                    <h4 class="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                        {{ trx.title }}
                    </h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                        {{ trx.subtitle }}
                    </p>
                </div>
            </div>
            <div class="text-right">
                 <span class="block text-sm font-bold"
                    :class="trx.inferredType === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-black dark:text-white'"
                 >
                    {{ trx.inferredType === 'INCOME' ? '+' : '-' }} {{ formatCurrency(trx.amount) }}
                 </span>
                 <span class="text-[10px] text-gray-400 capitalize">{{ trx.method }}</span>
            </div>
        </div>
    </div>
</div>


</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Calendar, ChevronLeft, ChevronRight, ArrowRightLeft, ArrowUpRight, ArrowDownLeft, Banknote, Wallet, FileText, PieChart, Recycle, ArrowUp, Scale } from 'lucide-vue-next';

const props = defineProps({
  selectedMonth: Number,
  selectedYear: Number,
  weeklyChartData: Array,
  totalWithdraw: Number,
  totalIncome: Number,
  transfers: Array,
  withdrawals: Array,
  categoryStats: Array,
  donutChartData: Array,
  groupedTransactions: Array,
  loadingTransactions: Boolean,
  customer: Object,
  homeStats: Object
});

const emit = defineEmits(['update:selectedMonth', 'update:selectedYear', 'open-detail', 'view-proof']);

const activeTab = ref('Mutasi');
const showMonthPicker = ref(false);

const selectMonth = (m) => {
    emit('update:selectedMonth', m);
    showMonthPicker.value = false;
};

// Utils
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDateFull = (date) => {
    return new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const getMonthName = (monthIndex) => {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[monthIndex - 1] || '';
};
</script>
