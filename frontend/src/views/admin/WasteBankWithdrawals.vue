<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Permintaan Penarikan</h1>
        <p class="text-sm text-gray-500">Kelola permintaan pencairan dana nasabah</p>
      </div>
      <div class="flex gap-2">
         <button @click="fetchWithdrawals" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
             <RefreshCw class="w-5 h-5 text-gray-500" :class="{'animate-spin': loading}" />
         </button>
      </div>
    </div>

    <!-- Status Filter -->
    <div class="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        <button 
          v-for="status in ['PENDING', 'APPROVED', 'REJECTED']"
          :key="status"
          @click="activeFilter = status"
          class="pb-3 px-2 text-sm font-medium transition relative"
          :class="activeFilter === status ? 'text-green-600 dark:text-green-400' : 'text-gray-500 hover:text-gray-700'"
        >
            {{ status === 'PENDING' ? 'Menunggu Konfirmasi' : (status === 'APPROVED' ? 'Disetujui' : 'Ditolak') }}
            <span v-if="activeFilter === status" class="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-t-full"></span>
        </button>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div v-if="loading" class="p-12 text-center">
            <Loader2 class="w-8 h-8 mx-auto animate-spin text-green-600 mb-2" />
            <p class="text-gray-500">Memuat data...</p>
        </div>

        <div v-else-if="filteredWithdrawals.length === 0" class="p-12 text-center">
            <Inbox class="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p class="text-gray-500">Tidak ada data penarikan dengan status {{ activeFilter.toLowerCase() }}</p>
        </div>

        <table v-else class="w-full text-left text-sm">
            <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500 border-b border-gray-100 dark:border-gray-700">
                <tr>
                    <th class="px-6 py-4 font-medium">Tanggal</th>
                    <th class="px-6 py-4 font-medium">Nasabah</th>
                    <th class="px-6 py-4 font-medium">Nominal</th>
                    <th class="px-6 py-4 font-medium">Metode</th>
                    <th class="px-6 py-4 font-medium">Tujuan</th>
                    <th class="px-6 py-4 font-medium">Bukti Transfer</th>
                    <th class="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr v-for="wd in filteredWithdrawals" :key="wd._id" class="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <td class="px-6 py-4 text-gray-500">
                        {{ formatDateFull(wd.createdAt) }}
                        <div class="text-xs text-gray-400">{{ formatTime(wd.createdAt) }}</div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="font-medium text-gray-900 dark:text-white">{{ wd.customerName }}</div>
                        <div class="text-xs text-gray-500">{{ wd.customerAccountNumber }}</div>
                    </td>
                    <td class="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        {{ formatCurrency(wd.amount) }}
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 rounded-full text-xs font-medium" 
                          :class="{
                              'bg-green-100 text-green-700': wd.method === 'CASH',
                              'bg-blue-100 text-blue-700': wd.method === 'TRANSFER',
                              'bg-purple-100 text-purple-700': wd.method === 'EWALLET'
                          }">
                            {{ wd.method === 'CASH' ? 'Tunai' : (wd.method === 'TRANSFER' ? 'Transfer Bank' : 'E-Wallet') }}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs">
                        <div v-if="wd.method === 'CASH'">-</div>
                        <div v-else>
                            <div class="font-medium">{{ wd.destinationDetail?.bankName }}</div>
                            <div class="text-xs">{{ wd.destinationDetail?.accountNumber }}</div>
                            <div class="text-xs uppercase">{{ wd.destinationDetail?.accountName }}</div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <button 
                          v-if="wd.proofUrl" 
                          @click="openProofModal(wd.proofUrl)"
                          class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium dark:text-blue-400 hover:underline"
                        >
                            <FileText class="w-3 h-3" /> Lihat Bukti
                        </button>
                        <span v-else class="text-gray-400 text-xs">-</span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div v-if="wd.status === 'PENDING'" class="flex justify-end gap-2">
                            <button @click="openRejectModal(wd)" class="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition">
                                Tolak
                            </button>
                            <button @click="openApproveModal(wd)" class="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 text-xs font-bold transition shadow-lg shadow-green-200 dark:shadow-none">
                                Setujui & Proses
                            </button>
                        </div>
                        <span v-else class="text-xs font-medium" 
                          :class="wd.status === 'COMPLETED' || wd.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'">
                           {{ wd.status === 'COMPLETED' || wd.status === 'APPROVED' ? 'Selesai' : 'Ditolak' }}
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- REJECT MODAL -->
    <div v-if="showRejectModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeRejectModal"></div>
        <div class="relative bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-xl">
            <h3 class="font-bold text-lg mb-4 text-gray-900 dark:text-white">Tolak Penarikan</h3>
            <p class="text-sm text-gray-500 mb-4">Berikan alasan penolakan. Saldo nasabah akan dikembalikan.</p>
            
            <textarea 
              v-model="rejectReason" 
              class="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-red-500 outline-none h-32 resize-none"
              placeholder="Contoh: Nomor rekening tidak valid..."
            ></textarea>

            <div class="flex gap-3 mt-6">
                <button @click="closeRejectModal" class="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-sm">Batal</button>
                <button @click="confirmReject" :disabled="!rejectReason" class="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-50">Tolak Permintaan</button>
            </div>
        </div>
    </div>

    <!-- APPROVE MODAL -->
    <div v-if="showApproveModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeApproveModal"></div>
        <div class="relative bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-xl">
            <h3 class="font-bold text-lg mb-4 text-gray-900 dark:text-white">Setujui Penarikan</h3>
            <p class="text-sm text-gray-500 mb-4">
                Konfirmasi penarikan sebesar <span class="font-bold text-gray-900 dark:text-white">{{ formatCurrency(selectedWd?.amount) }}</span> ke {{ selectedWd?.customerName }}.
            </p>
            
            <div v-if="selectedWd?.method !== 'CASH'">
                <label class="block text-xs font-bold text-gray-500 mb-2">Bukti Transfer (Wajib untuk Transfer)</label>
                <div class="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer relative">
                    <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*,.pdf" class="absolute inset-0 opacity-0 cursor-pointer" />
                    <div v-if="approveProofFile">
                        <Check class="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p class="text-xs text-gray-900 dark:text-white font-medium truncate">{{ approveProofFile.name }}</p>
                    </div>
                    <div v-else>
                         <UploadCloud class="w-8 h-8 text-gray-400 mx-auto mb-2" />
                         <p class="text-xs text-gray-500">Klik untuk upload bukti</p>
                    </div>
                </div>
            </div>

            <div class="flex gap-3 mt-6">
                <button @click="closeApproveModal" class="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-sm">Batal</button>
                <button 
                  @click="confirmApprove" 
                  :disabled="loadingApprove || (selectedWd?.method !== 'CASH' && !approveProofFile)" 
                  class="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm disabled:opacity-50 flex justify-center items-center gap-2"
                >
                    <Loader2 v-if="loadingApprove" class="w-4 h-4 animate-spin" />
                    <span>{{ loadingApprove ? 'Memproses...' : 'Konfirmasi' }}</span>
                </button>
            </div>
        </div>
    </div>

    <!-- PROOF VIEWER MODAL -->
    <div v-if="showProofModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="closeProofModal"></div>
        <div class="relative bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 class="font-bold text-gray-900 dark:text-white">Bukti Transfer</h3>
                <button @click="closeProofModal" class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                    <X class="w-5 h-5 text-gray-500" />
                </button>
            </div>
            <div class="p-4 overflow-auto bg-gray-50 dark:bg-black flex items-center justify-center min-h-[300px]">
                <img :src="getImgUrl(selectedProofUrl)" alt="Bukti Transfer" class="max-w-full h-auto rounded-lg shadow-sm" />
            </div>
             <div class="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button @click="downloadImage(selectedProofUrl)" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600 transition" title="Download Gambar">
                    <Download class="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { RefreshCw, Loader2, Inbox, Check, X, UploadCloud, FileText, Download } from 'lucide-vue-next';
import * as bankService from '@/services/bankService';
import { getImgUrl } from '@/utils/apiUrl';
import Swal from 'sweetalert2';

const loading = ref(true);
const withdrawals = ref([]);
const activeFilter = ref('PENDING');

// Reject Modal State
const showRejectModal = ref(false);
const selectedWd = ref(null);
const rejectReason = ref('');

// Approve Modal State
const showApproveModal = ref(false);
const approveProofFile = ref(null);
const loadingApprove = ref(false);

// Proof Viewer State
const showProofModal = ref(false);
const selectedProofUrl = ref(null);

const openProofModal = (url) => {
    selectedProofUrl.value = url;
    showProofModal.value = true;
};

const closeProofModal = () => {
    showProofModal.value = false;
    selectedProofUrl.value = null;
};

const fetchWithdrawals = async () => {
    loading.value = true;
    try {
        const res = await bankService.getWithdrawals({ limit: 100 }); // Get all for admin
        if (res.success) {
            withdrawals.value = res.data;
        }
    } catch (err) {
        console.error("Failed to load withdrawals", err);
    } finally {
        loading.value = false;
    }
};

const filteredWithdrawals = computed(() => {
    let filtered = withdrawals.value.filter(wd => {
        if (activeFilter.value === 'PENDING') return wd.status === 'PENDING';
        if (activeFilter.value === 'APPROVED') return wd.status === 'APPROVED' || wd.status === 'COMPLETED';
        if (activeFilter.value === 'REJECTED') return wd.status === 'REJECTED' || wd.status === 'CANCELLED';
        return true;
    });
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

const openApproveModal = (wd) => {
    selectedWd.value = wd;
    approveProofFile.value = null;
    showApproveModal.value = true;
};

const closeApproveModal = () => {
    showApproveModal.value = false;
    selectedWd.value = null;
    approveProofFile.value = null;
    loadingApprove.value = false;
};

const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            Swal.fire('Error', 'Ukuran file maksimal 5MB', 'warning');
            e.target.value = '';
            return;
        }
        approveProofFile.value = file;
    }
};

const confirmApprove = async () => {
    if (!selectedWd.value) return;
    
    loadingApprove.value = true;
    let proofUrl = null;

    try {
        // Upload Proof if exists
        if (approveProofFile.value) {
            const formData = new FormData();
            formData.append('proof', approveProofFile.value);
            const uploadRes = await bankService.uploadWithdrawalProof(formData);
            if (uploadRes.success) {
                proofUrl = uploadRes.url;
            }
        }

        await bankService.updateWithdrawalStatus(selectedWd.value._id, {
            status: 'APPROVED',
            proofUrl
        });

        Swal.fire('Berhasil', 'Penarikan berhasil disetujui', 'success');
        closeApproveModal();
        await fetchWithdrawals();

    } catch (err) {
        console.error(err);
        Swal.fire('Gagal', err.response?.data?.message || 'Gagal memproses', 'error');
    } finally {
        loadingApprove.value = false;
    }
};

const openRejectModal = (wd) => {
    selectedWd.value = wd;
    rejectReason.value = '';
    showRejectModal.value = true;
};

const closeRejectModal = () => {
    showRejectModal.value = false;
    selectedWd.value = null;
};

const confirmReject = async () => {
    if (!selectedWd.value || !rejectReason.value) return;

    try {
        await bankService.updateWithdrawalStatus(selectedWd.value._id, {
            status: 'REJECTED',
            rejectionReason: rejectReason.value
        });
        closeRejectModal();
        await fetchWithdrawals();
        Swal.fire('Berhasil', 'Penarikan ditolak dan saldo dikembalikan', 'success');
    } catch (err) {
        Swal.fire('Gagal', err.response?.data?.message || 'Gagal memproses', 'error');
    }
};

// Download Helper
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

// Helpers
const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value || 0);
};

const formatDateFull = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
    fetchWithdrawals();
});
</script>
