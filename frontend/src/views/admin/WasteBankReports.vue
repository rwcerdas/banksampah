<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Laporan Penimbangan</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Laporan formal penimbangan sampah</p>
      </div>

      <!-- Tab Switcher -->
      <div class="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        <button
          @click="activeTab = 'internal'"
          :class="[
            'flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
            activeTab === 'internal'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          ]"
        >
          <BarChart2 class="w-4 h-4 mr-2" /> Laporan Internal
        </button>
        <button
          @click="activeTab = 'nasabah'"
          :class="[
            'flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
            activeTab === 'nasabah'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          ]"
        >
          <Users class="w-4 h-4 mr-2" /> Laporan Nasabah
        </button>
        <button
          @click="activeTab = 'dlh'"
          :class="[
            'flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
            activeTab === 'dlh'
              ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          ]"
        >
          <Leaf class="w-4 h-4 mr-2" /> Laporan Dinas LH
        </button>
      </div>

      <!-- Date Range Filter (shared) -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Tanggal Mulai</label>
            <input
              v-model="filter.startDate"
              type="date"
              class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Tanggal Akhir</label>
            <input
              v-model="filter.endDate"
              type="date"
              class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <!-- Combobox Pengepul — hanya tampil di tab DLH -->
          <div v-if="activeTab === 'dlh'" class="relative" ref="comboboxRef">
            <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Pengepul</label>
            <!-- Input display -->
            <div
              @click="comboboxOpen = !comboboxOpen"
              class="flex items-center justify-between w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              <span class="text-sm truncate" :class="dlhCollectorIds.length === 0 ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white font-medium'">
                <template v-if="dlhCollectorIds.length === 0">
                  🌐 Semua Pengepul
                </template>
                <template v-else-if="dlhCollectorIds.length === 1">
                  {{ collectorList.find(c => c._id === dlhCollectorIds[0])?.collectorName || '1 Terpilih' }}
                </template>
                <template v-else>
                  {{ dlhCollectorIds.length }} Pengepul Terpilih
                </template>
              </span>
              <!-- Clear all button if any selected -->
              <button
                v-if="dlhCollectorIds.length > 0"
                @click.stop="clearCollectors"
                class="ml-2 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <svg v-else class="w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2" :class="comboboxOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <!-- Dropdown -->
            <div
              v-if="comboboxOpen"
              class="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600
                     rounded-xl shadow-2xl overflow-hidden"
            >
              <!-- Search input -->
              <div class="p-2 border-b border-gray-100 dark:border-gray-700">
                <input
                  v-model="comboboxSearch"
                  @click.stop
                  type="text"
                  placeholder="Cari pengepul..."
                  autofocus
                  class="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg
                         dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Options list -->
              <ul class="max-h-52 overflow-y-auto text-sm">
                <!-- "Semua" option -->
                <li
                  @click="selectAllCollectors"
                  class="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <div class="flex items-center justify-center w-4 h-4 border rounded"
                       :class="dlhCollectorIds.length === 0 ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 dark:border-gray-500'">
                    <svg v-if="dlhCollectorIds.length === 0" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span class="text-base leading-none">🌐</span>
                  <span>Semua Pengepul</span>
                </li>

                <!-- Divider -->
                <li class="h-px bg-gray-100 dark:bg-gray-700 mx-2 my-1"></li>

                <!-- Filtered collector options (Multi-select) -->
                <li
                  v-for="c in filteredComboCollectors"
                  :key="c._id"
                  @click.stop="toggleCollector(c._id)"
                  class="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
                  :class="dlhCollectorIds.includes(c._id)
                    ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-300'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'"
                >
                  <!-- Checkbox -->
                  <div class="flex items-center justify-center w-4 h-4 border rounded transition-colors"
                       :class="dlhCollectorIds.includes(c._id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800'">
                    <svg v-if="dlhCollectorIds.includes(c._id)" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span class="text-base leading-none">🚚</span>
                  <span class="truncate">{{ c.collectorName }}</span>
                </li>

                <li v-if="filteredComboCollectors.length === 0" class="px-3 py-4 text-center text-gray-400 text-xs">
                  Pengepul tidak ditemukan
                </li>
              </ul>
            </div>
          </div>

          <div :class="activeTab === 'dlh' ? 'flex items-end' : 'flex items-end md:col-start-4'">
            <button
              @click="fetchCurrentReport"
              :disabled="loading || dlhLoading"
              class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {{ (loading || dlhLoading) ? 'Memuat...' : 'Tampilkan Laporan' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ======================== -->
      <!-- TAB: LAPORAN INTERNAL    -->
      <!-- ======================== -->
      <ReportInternalTab
        v-if="activeTab === 'internal'"
        :report-data="reportData"
        :loading="loading"
        :exporting="exporting"
        :insight="insight"
        :insight-loading="insightLoading"
        :insight-error="insightError"
        :audience="audience"
        :is-editing="isEditing"
        :edited-insight="editedInsight"
        @generate-insight="handleGenerateInsight"
        @start-editing="startEditing"
        @cancel-editing="cancelEditing"
        @save-editing="saveEditing"
        @update:edited-insight="editedInsight = $event"
        @update:audience="audience = $event"
        @export="exportPDF"
      />

      <!-- ============================ -->
      <!-- TAB: LAPORAN DINAS LH        -->
      <!-- ============================ -->
      <ReportDlhTab
        v-if="activeTab === 'dlh'"
        :data="dlhData"
        :loading="dlhLoading"
        :exporting="dlhExporting"
        @export="exportDLHPDF"
      />

      <!-- ============================ -->
      <!-- TAB: LAPORAN NASABAH         -->
      <!-- ============================ -->
      <ReportCustomerTab
        v-if="activeTab === 'nasabah'"
        :report-data="reportData"
        :loading="loading"
        :exporting="nasabahExporting"
        :customers="filteredCustomerBreakdown"
        :search="searchNasabah"
        @update:search="searchNasabah = $event"
        @export="exportNasabahPDF"
      />

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { getWeighingReport, getDLHReport } from '@/services/bankReportService';
import { getCollectors } from '@/services/bankService';
import { generateWeighingReportPDF, generateDLHReportPDF, generateNasabahReportPDF } from '@/utils/reportPdfGenerator';
import { useUserStore } from '@/stores/userStore';
import { useWasteBankInsights } from '@/composables/useWasteBankInsights';
import ReportInternalTab from './report-components/ReportInternalTab.vue';
import ReportDlhTab from './report-components/ReportDlhTab.vue';
import ReportCustomerTab from './report-components/ReportCustomerTab.vue';
import { ChevronDown } from 'lucide-vue-next';

const userStore = useUserStore();
const { insight, loading: insightLoading, error: insightError, audience, generateInsight, clearInsight } = useWasteBankInsights();

// Tab
const activeTab = ref('internal');

// State — Internal & Nasabah Report
const loading = ref(false);
const exporting = ref(false);
const nasabahExporting = ref(false);
const reportData = ref(null);
const searchNasabah = ref('');

const filteredCustomerBreakdown = computed(() => {
  if (!reportData.value || !reportData.value.details?.customerBreakdown) return [];
  const q = searchNasabah.value.toLowerCase().trim();
  if (!q) return reportData.value.details.customerBreakdown;
  return reportData.value.details.customerBreakdown.filter(c =>
    c.customerName.toLowerCase().includes(q) || c.customerAccountNumber.toLowerCase().includes(q)
  );
});

watch(activeTab, (newTab) => {
  if ((newTab === 'internal' || newTab === 'nasabah') && !reportData.value) {
    fetchReport();
  } else if (newTab === 'dlh' && !dlhData.value) {
    fetchDLHReport();
  }
});

// State — DLH Report
const dlhLoading = ref(false);
const dlhExporting = ref(false);
const dlhData = ref(null);
const dlhCollectorIds = ref([]);      // Array of selected ObjectId strings (empty = all)
const collectorList = ref([]);        // List from /api/collectors

// ── Combobox state (Multi-select) ──────────────────────────────────────────────
const comboboxOpen = ref(false);
const comboboxSearch = ref('');
const comboboxRef = ref(null);

const filteredComboCollectors = computed(() => {
  const q = comboboxSearch.value.toLowerCase().trim();
  if (!q) return collectorList.value;
  return collectorList.value.filter(c => c.collectorName.toLowerCase().includes(q));
});

const toggleCollector = (id) => {
  const idx = dlhCollectorIds.value.indexOf(id);
  if (idx > -1) {
    dlhCollectorIds.value.splice(idx, 1);
  } else {
    dlhCollectorIds.value.push(id);
  }
};

const selectAllCollectors = () => {
  dlhCollectorIds.value = [];
  comboboxOpen.value = false;
  comboboxSearch.value = '';
};

const clearCollectors = () => {
  dlhCollectorIds.value = [];
};

// Close combobox when clicking outside
const handleOutsideClick = (e) => {
  if (comboboxRef.value && !comboboxRef.value.contains(e.target)) {
    comboboxOpen.value = false;
    comboboxSearch.value = '';
  }
};
// ───────────────────────────────────────────────────────────────

// Edit Mode State
const isEditing = ref(false);
const editedInsight = ref('');

const startEditing = () => {
  editedInsight.value = insight.value;
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
  editedInsight.value = '';
};

const saveEditing = () => {
  insight.value = editedInsight.value;
  isEditing.value = false;
};

// Filter
const filter = ref({
  startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0]
});

// Fetch current tab's report
const fetchCurrentReport = () => {
  if (activeTab.value === 'internal' || activeTab.value === 'nasabah') {
    fetchReport();
  } else {
    fetchDLHReport();
  }
};

// Fetch internal weighing report
const fetchReport = async () => {
  loading.value = true;
  try {
    const response = await getWeighingReport(filter.value.startDate, filter.value.endDate);
    reportData.value = response.data;
  } catch (error) {
    console.error('Error fetching report:', error);
    alert('Gagal memuat laporan: ' + (error.response?.data?.message || error.message));
  } finally {
    loading.value = false;
  }
};

// Fetch DLH report
const fetchDLHReport = async () => {
  dlhLoading.value = true;
  try {
    const joinedIds = dlhCollectorIds.value.length > 0 ? dlhCollectorIds.value.join(',') : undefined;
    const response = await getDLHReport(
      filter.value.startDate,
      filter.value.endDate,
      joinedIds
    );
    dlhData.value = response.data;
  } catch (error) {
    console.error('Error fetching DLH report:', error);
    alert('Gagal memuat laporan DLH: ' + (error.response?.data?.message || error.message));
  } finally {
    dlhLoading.value = false;
  }
};

// Load collectors for dropdown
const fetchCollectors = async () => {
  try {
    const res = await getCollectors({ active: true });
    collectorList.value = res.data || [];
  } catch (e) {
    console.warn('Could not load collectors:', e.message);
  }
};

// Generate AI Insight (internal only)
const handleGenerateInsight = async () => {
  try {
    await generateInsight(filter.value.startDate, filter.value.endDate);
  } catch (error) {
    // Error already handled by composable
  }
};

// Export Internal PDF
const exportPDF = async () => {
  exporting.value = true;
  try {
    let aiInsight = insight.value;
    if (!aiInsight || aiInsight.trim() === '') {
      try {
        await generateInsight(filter.value.startDate, filter.value.endDate);
        aiInsight = insight.value;
      } catch (error) {
        aiInsight = null;
      }
    }
    await generateWeighingReportPDF(reportData.value, {
      printedBy: userStore.user?.username || userStore.username || 'Admin',
      aiInsight: aiInsight
    });
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Gagal mengekspor PDF: ' + error.message);
  } finally {
    exporting.value = false;
  }
};

// Export DLH PDF — pass byCollector data so PDF generator can render sections
const exportDLHPDF = async () => {
  dlhExporting.value = true;
  try {
    await generateDLHReportPDF(dlhData.value, {
      printedBy: userStore.user?.username || userStore.username || 'Admin'
    });
  } catch (error) {
    console.error('Error exporting DLH PDF:', error);
    alert('Gagal mengekspor PDF DLH: ' + error.message);
  } finally {
    dlhExporting.value = false;
  }
};

// Export Nasabah PDF
const exportNasabahPDF = async () => {
  nasabahExporting.value = true;
  try {
    await generateNasabahReportPDF(reportData.value, {
      printedBy: userStore.user?.username || userStore.username || 'Admin'
    });
  } catch (error) {
    console.error('Error exporting Nasabah PDF:', error);
    alert('Gagal mengekspor PDF Nasabah: ' + error.message);
  } finally {
    nasabahExporting.value = false;
  }
};

// Currency formatter
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount || 0);
};

// Auto load on mount
onMounted(() => {
  fetchReport();
  fetchCollectors();
  document.addEventListener('click', handleOutsideClick, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick, true);
});
</script>
