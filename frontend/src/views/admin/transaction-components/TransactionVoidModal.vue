<template>
<!-- VOID CONFIRMATION MODAL -->
<div v-if="showVoidModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
  <!-- Backdrop -->
  <div class="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" @click="!isVoiding && (showVoidModal = false)"></div>

  <!-- Content -->
  <div class="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden transform transition-all">
    <div class="p-8 text-center">
      <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-5">
        <AlertTriangle class="w-8 h-8" />
      </div>
      <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Batalkan Transaksi?</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 px-4">
        Aksi ini akan menarik kembali saldo nasabah jika menggunakan metode <strong>TABUNGAN</strong>. Data tidak dapat dikembalikan.
      </p>

      <div class="text-left mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
        <label class="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Alasan Pembatalan</label>
        <textarea
          v-model="voidReasonInput"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500 outline-none text-sm transition text-gray-700 dark:text-gray-200"
          placeholder="Contoh: Salah timbangan, nasabah minta ganti metode..."
          rows="3"
        ></textarea>
      </div>

      <div class="flex gap-3">
        <button
          @click="showVoidModal = false"
          :disabled="isVoiding"
          class="flex-1 py-3 px-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition disabled:opacity-50"
        >
          Kembali
        </button>
        <button
          @click="confirmVoidTransaction"
          :disabled="!voidReasonInput.trim() || isVoiding"
          class="flex-1 py-3 px-4 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50 shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
        >
          <Trash2 v-if="!isVoiding" class="w-4 h-4" />
          <span>{{ isVoiding ? 'Memproses...' : 'Ya, Batalkan' }}</span>
        </button>
      </div>
    </div>
  </div>
</div>

</template>

<script setup>
import { inject } from 'vue';
import { AlertTriangle, Banknote, Check, Copy, FileText, MessageCircle, Printer, Trash2, Wallet, X } from 'lucide-vue-next';
import { wasteBankTransactionContextKey } from './transactionContext';

const {
  customers,
  availableItems,
  collectors,
  transactions,
  saving,
  currentMarkup,
  selectedTransaction,
  showDetailModal,
  showVoidModal,
  voidReasonInput,
  isVoiding,
  customerInputRef,
  customerSearchQuery,
  customerResults,
  isSearchingCustomer,
  showCustomerDropdown,
  selectedCustomer,
  itemInputRefs,
  form,
  isCollectorLocked,
  totalWeight,
  totalPelapakValue,
  totalMarkup,
  totalCustomerValue,
  formatCurrency,
  formatWeight,
  formatNumber,
  formatDate,
  addItem,
  removeItem,
  onItemSelected,
  calculateItem,
  submitTransaction,
  debouncedCustomerSearch,
  searchCustomers,
  handleCustomerFocus,
  selectCustomer,
  handleClickOutside,
  itemDebounceTimers,
  debouncedItemSearch,
  filterItems,
  handleItemFocus,
  selectItem,
  openDetailModal,
  closeDetailModal,
  quickPrintReceipt,
  sendToWhatsapp,
  promptVoidTransaction,
  confirmVoidTransaction,
  duplicateVoidedToForm,
  fetchCustomers,
  fetchItems,
  fetchCollectors,
  onCollectorChange,
  fetchTransactions,
  fetchSettings
} = inject(wasteBankTransactionContextKey);
</script>
