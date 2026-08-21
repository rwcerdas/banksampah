<template>
  <div
    class="px-0 py-2 sm:p-8 bg-gray-50 dark:bg-gray-950 min-h-full transition-colors relative overflow-hidden touch-pan-y"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- Pull Indicator -->
    <div
        class="absolute -top-16 left-0 w-full flex justify-center pointer-events-none transition-transform duration-200 z-10"
        :style="{ transform: isRefreshing ? 'translateY(100px)' : `translateY(${pullDistance}px)` }"
    >
        <div class="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg border border-gray-100 dark:border-gray-700">
             <Loader2 class="w-5 h-5 text-green-600 animate-spin" :class="isRefreshing || pullDistance > 30 ? 'opacity-100' : 'opacity-0'" />
        </div>
    </div>

    <!-- Main Content Wrapper with Transform -->
    <div :style="{ transform: `translateY(${isRefreshing ? 60 : pullDistance}px)`, transition: isDragging ? 'none' : 'transform 0.3s ease-out' }">

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>

    <div v-else-if="!customer" class="text-center py-12">
      <h2 class="text-xl font-bold text-red-600">Profil Nasabah Tidak Ditemukan</h2>
      <p class="text-gray-600 mt-2">Akun Anda mungkin belum terhubung dengan data Bank Sampah.</p>
    </div>

    <div v-else class="max-w-4xl mx-auto">
      <!-- ========================================== -->
      <!-- TAB 1: HOME (KARTU & SALDO UTAMA)        -->
      <!-- ========================================== -->
      <div v-show="activeBottomTab === 'home'" class="px-4 py-6 sm:p-6 pb-nav-mobile space-y-6">


        <NasabahHeader
          :customer="customer"
          :show-balance="showBalance"
          @toggle-balance="showBalance = !showBalance"
        />

        <!-- Quick Actions Row -->
        <NasabahQuickActions
          @open-transfer="openTransferModal"
          @open-withdraw="openWithdrawalModal"
        />


        <!-- Kartu Member Digital -->
        <MemberCardDigital :customer="customer" />

            <!-- QUICK STATS -->
            <NasabahHomeStats :stats="homeStats" />


            <!-- RECENT ACTIVITY -->
            <NasabahRecentActivity
              :transactions="recentTransactions"
              @view-all="activeBottomTab = 'tracker'"
              @open-detail="openDetailModal"
            />
        </div>


      <!-- ========================================== -->
      <!-- TAB 2: TRACKER (MUTASI & ANALISIS)       -->
      <!-- ========================================== -->
      <div v-show="activeBottomTab === 'tracker'" class="bg-white dark:bg-gray-900 min-h-dvh pb-nav-mobile">
        <NasabahTracker
          v-model:selectedMonth="selectedMonth"
          v-model:selectedYear="selectedYear"
          :weekly-chart-data="weeklyChartData"
          :total-withdraw="totalWithdraw"
          :total-income="totalIncome"
          :transfers="transfers"
          :withdrawals="withdrawals"
          :category-stats="categoryStats"
          :donut-chart-data="donutChartData"
          :grouped-transactions="groupedTransactions"
          :loading-transactions="loadingTransactions"
          :customer="customer"
          :home-stats="homeStats"
          @open-detail="openDetailModal"
          @view-proof="viewProof"
        />
      </div>
  </div>
<!-- ========================================== -->
      <!-- TAB PRICES: DAFTAR HARGA                   -->
      <!-- ========================================== -->
      <div v-show="activeBottomTab === 'prices'">
        <NasabahPriceList
          :items="items"
          :loading="loadingPrices"
          :markup-percentage="markupPercentage"
        />
      </div>

<!-- ========================================== -->
<!-- TAB 3: PROFIL (INFO PRIBADI)             -->
<!-- ========================================== -->
      <!-- TAB 3: PROFIL (INFO PRIBADI)             -->
      <!-- ========================================== -->
      <div v-show="activeBottomTab === 'profile'">
        <NasabahProfile :customer="customer" />
      </div>

      <!-- ABOUT US MODAL REMOVED (Moved to separate page) -->

      <!-- ========================================== -->
      <!-- TAB 4: EDUKASI (Premium Redesign)        -->
      <!-- ========================================== -->
      <!-- TAB 4: EDUKASI (Premium Redesign)        -->
      <!-- ========================================== -->
      <div v-show="activeBottomTab === 'education'" class="light">
        <NasabahEducation
          :articles="educationArticles"
          :loading="loadingArticles"
        />
      </div>
  </div>

  <NasabahTransactionDetail
    :show="showDetailModal"
    :transaction="selectedTransaction"
    @close="closeDetailModal"
    @share="shareReceipt"
  />

  <TransferModal
    v-model:show="showTransferModal"
    :customer="customer"
    @success="handleTransferSuccess"
  />

  <NasabahBottomNavigation v-model="activeBottomTab" />

  <NasabahNotificationModal
    v-model:show="showNotificationModal"
    :notifications="notifications"
  />

  <NasabahProofViewer
    :show="showProofModal"
    :image-url="getImgUrl(selectedProofUrl)"
    @close="closeProofModal"
    @download="downloadImage(selectedProofUrl)"
  />

    <WithdrawalModal
      :show="showWithdrawalModal"
      :balance="customer?.balance || 0"
      :customerId="customer?._id"
      @close="showWithdrawalModal = false"
      @success="() => { fetchWithdrawals(); fetchCustomerData(); Swal.fire('Berhasil', 'Permintaan penarikan berhasil dikirim!', 'success'); }"
    />
  </div> <!-- End Root Wrapper -->
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Loader2 } from 'lucide-vue-next';
import * as bankService from '@/services/bankService';
import NasabahHeader from './nasabah-components/NasabahHeader.vue';
import NasabahQuickActions from './nasabah-components/NasabahQuickActions.vue';
import NasabahHomeStats from './nasabah-components/NasabahHomeStats.vue';
import NasabahRecentActivity from './nasabah-components/NasabahRecentActivity.vue';
import NasabahTracker from './nasabah-components/NasabahTracker.vue';
import NasabahPriceList from './nasabah-components/NasabahPriceList.vue';
import NasabahProfile from './nasabah-components/NasabahProfile.vue';
import NasabahEducation from './nasabah-components/NasabahEducation.vue';
import MemberCardDigital from './components/MemberCardDigital.vue';
import WithdrawalModal from './WithdrawalModal.vue';
import TransferModal from './components/TransferModal.vue';
import NasabahBottomNavigation from './nasabah-components/NasabahBottomNavigation.vue';
import NasabahNotificationModal from './nasabah-components/NasabahNotificationModal.vue';
import NasabahProofViewer from './nasabah-components/NasabahProofViewer.vue';
import NasabahTransactionDetail from './nasabah-components/NasabahTransactionDetail.vue';

import { useUserStore } from '@/stores/userStore';

import Swal from 'sweetalert2';
import { getImgUrl } from '@/utils/apiUrl';

// Composables
import { useTransactions } from './composables/useTransactions';
import { useTransfers } from './composables/useTransfers';
import { useWithdrawals } from './composables/useWithdrawals';
import { useNotifications } from './composables/useNotifications';
import { usePriceList } from './composables/usePriceList';
import { useNasabahActivity } from './composables/useNasabahActivity';
import { usePullToRefresh } from './composables/usePullToRefresh';
import { useReceiptSharing } from './composables/useReceiptSharing';

// Core Setup
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// Local State
const loading = ref(true);
const customer = ref(null);
const showBalance = ref(true);

// Education state
const educationArticles = ref([]);
const loadingArticles = ref(false);

const loadEducationArticles = async () => {
    loadingArticles.value = true;
    try {
        const res = await bankService.getEducationArticles({ limit: 10, status: 'PUBLISHED', t: Date.now() });
        educationArticles.value = res.data || [];
    } catch (error) {
        console.error('Failed to load articles', error);
    } finally {
        loadingArticles.value = false;
    }
};

// --- COMPOSABLES ---

const {
    transactions, loadingTransactions, selectedMonth, selectedYear,
    homeStats, weeklyChartData, categoryStats, donutChartData, totalIncome, totalWithdraw,
    fetchTransactions, getInferredType
} = useTransactions();

const {
    showNotificationModal, notifications, fetchNotifications
} = useNotifications();

const {
    showTransferModal,
    transfers,
    openTransferModal,
    fetchTransfers,
} = useTransfers();

const {
    showWithdrawalModal, withdrawals, openWithdrawalModal, fetchWithdrawals
} = useWithdrawals();

const {
    loadingPrices, items, markupPercentage,
    fetchPriceList
} = usePriceList();

// --- Shared Logic ---

const fetchCustomerData = async () => {
    try {
        customer.value = await bankService.getMyProfile();
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
};

const handleTransferSuccess = async () => {
    await Promise.all([
        fetchCustomerData(),
        fetchTransfers(),
        fetchNotifications(),
    ]);
    Swal.fire('Berhasil', 'Transfer saldo berhasil.', 'success');
};

const refreshDashboard = async () => {
    await Promise.all([
        fetchCustomerData(),
        fetchTransactions(),
        fetchTransfers(),
        fetchWithdrawals(),
        fetchNotifications(),
    ]);
    if (activeBottomTab.value === 'education') await loadEducationArticles();
    if (activeBottomTab.value === 'prices') await fetchPriceList();
};

const {
    isDragging,
    isRefreshing,
    pullDistance,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
} = usePullToRefresh(refreshDashboard);

// Detail Modal & Proof
const showDetailModal = ref(false);
const selectedTransaction = ref(null);
const showProofModal = ref(false);
const selectedProofUrl = ref(null);

const viewProof = (url) => { selectedProofUrl.value = url; showProofModal.value = true; };
const closeProofModal = () => { showProofModal.value = false; selectedProofUrl.value = null; };
const openDetailModal = (trx) => { selectedTransaction.value = trx; showDetailModal.value = true; };
const closeDetailModal = () => { showDetailModal.value = false; setTimeout(() => selectedTransaction.value = null, 300); };

const { shareReceipt } = useReceiptSharing({ selectedTransaction, customer });

const {
    groupedTransactions,
    recentTransactions,
} = useNasabahActivity({
    transactions,
    transfers,
    customer,
    getInferredType,
});

// Navigation & Init
const activeBottomTab = ref(route.query.tab || 'home');
watch(() => route.query.tab, (newTab) => {
    if (newTab) activeBottomTab.value = newTab;
    // Trigger lazy loads
    if (newTab === 'prices' && items.value.length === 0) fetchPriceList();
    if (newTab === 'education' && educationArticles.value.length === 0) loadEducationArticles();
});

onMounted(async () => {
    loading.value = true;
    try {
        await fetchCustomerData();
    } finally {
        loading.value = false;
    }
    // Initial fetches
    await Promise.all([
        fetchTransactions(),
        fetchTransfers(),
        fetchWithdrawals(),
        fetchNotifications(),
        loadEducationArticles(),
        fetchPriceList()
    ]);
});

// Logout
const logout = () => {
  Swal.fire({
    title: 'Logout?',
    text: "Anda yakin ingin keluar dari aplikasi?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Ya, Keluar',
    cancelButtonText: 'Batal'
  }).then((result) => {
    if (result.isConfirmed) {
      userStore.logout();
      router.push('/login');
    }
  });
};


// Image Download
const downloadImage = async (url) => {
    if (!url) return;
    try {
        const fullUrl = getImgUrl(url);
        const response = await fetch(fullUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `Bukti-Transfer-${Date.now()}.webp`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Download failed:', error);
        Swal.fire('Gagal', 'Gagal mengunduh gambar', 'error');
    }
};



</script>
