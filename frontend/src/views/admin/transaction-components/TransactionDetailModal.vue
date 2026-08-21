<template>
<!-- TRANSACTION DETAIL MODAL -->
<div v-if="showDetailModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
  <!-- Backdrop -->
  <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" @click="closeDetailModal"></div>

  <!-- Modal Content -->
  <div class="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-xl transform transition-all flex flex-col max-h-[90vh] relative z-10">
    <!-- Header -->
    <div class="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
          <FileText class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">Detail Transaksi</h3>
          <p class="text-sm text-gray-500 font-mono">{{ selectedTransaction?.transactionId }}</p>
        </div>
      </div>
      <button @click="closeDetailModal" class="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Scrollable Content -->
    <div class="p-6 overflow-y-auto space-y-6">

      <!-- Status Banner - Normal -->
      <div v-if="selectedTransaction?.status !== 'VOIDED'" class="text-center py-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/50">
         <div class="text-3xl font-bold text-green-700 dark:text-green-400 mb-1">
           {{ formatCurrency(selectedTransaction?.totalValue) }}
         </div>
         <p class="text-xs text-gray-500 uppercase tracking-widest font-semibold">Total Diterima Nasabah</p>
         <div class="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
            :class="selectedTransaction?.paymentMethod === 'CASH' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-green-100 text-green-800 border-green-200'">
             <component :is="selectedTransaction?.paymentMethod === 'CASH' ? Banknote : Wallet" class="w-3.5 h-3.5" />
             {{ selectedTransaction?.paymentMethod === 'CASH' ? 'TUNAI' : 'TABUNGAN' }}
         </div>
      </div>

      <!-- Status Banner - VOIDED -->
      <div v-else class="text-center py-5 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
         <div class="text-2xl font-black text-red-700 dark:text-red-400 mb-1 line-through opacity-50">
           {{ formatCurrency(selectedTransaction?.totalValue) }}
         </div>
         <p class="text-xs text-red-600 dark:text-red-400 uppercase font-bold flex items-center justify-center gap-1.5 mb-3 tracking-widest">
           <AlertTriangle class="w-4 h-4" /> TRANSAKSI DIBATALKAN
         </p>

         <div class="px-6 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-50 dark:border-red-900/30 mx-4 text-left">
            <div class="text-[10px] text-gray-400 uppercase font-bold mb-1">Alasan Pembatalan:</div>
            <p class="text-xs text-gray-700 dark:text-gray-300 font-medium italic">"{{ selectedTransaction?.voidReason || 'Tidak ada alasan dicatat' }}"</p>
            <div class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-[9px] text-gray-400 font-medium">
               <div class="flex items-center gap-1"><Lock class="w-2.5 h-2.5" /> {{ selectedTransaction?.voidedBy || 'system' }}</div>
               <div class="flex items-center gap-1"><Clock class="w-2.5 h-2.5" /> {{ formatDate(selectedTransaction?.voidedAt) }}</div>
            </div>
         </div>
      </div>

      <!-- Customer Info -->
      <div class="space-y-3">
         <div class="flex justify-between border-b border-dashed border-gray-200 dark:border-gray-800 pb-2">
           <span class="text-sm text-gray-500 dark:text-gray-400">Tanggal</span>
           <span class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDate(selectedTransaction?.transactionDate) }}</span>
         </div>
         <div class="flex justify-between border-b border-dashed border-gray-200 dark:border-gray-800 pb-2">
           <span class="text-sm text-gray-500 dark:text-gray-400">Nasabah</span>
           <span class="text-sm font-bold text-gray-900 dark:text-white">{{ selectedTransaction?.customerName }}</span>
         </div>
         <div class="flex justify-between border-b border-dashed border-gray-200 dark:border-gray-800 pb-2">
           <span class="text-sm text-gray-500 dark:text-gray-400">No. Rekening</span>
           <span class="text-sm font-mono text-gray-900 dark:text-white">{{ selectedTransaction?.customerAccountNumber }}</span>
         </div>
      </div>

      <!-- Items Table -->
      <div>
        <h4 class="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Rincian Item</h4>
        <div class="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
           <table class="w-full text-xs">
             <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500 font-medium">
               <tr>
                 <th class="px-3 py-2 text-left">Item</th>
                 <th class="px-3 py-2 text-right">Berat</th>
                 <th class="px-3 py-2 text-right">Harga/Kg</th>
                 <th class="px-3 py-2 text-right">Total</th>
               </tr>
             </thead>
             <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr v-for="(item, idx) in selectedTransaction?.items" :key="idx" class="dark:text-gray-300">
                  <td class="px-3 py-2 font-medium">{{ item.itemName }}</td>
                  <td class="px-3 py-2 text-right">{{ formatWeight(item.weight) }}</td>
                  <td class="px-3 py-2 text-right">{{ formatNumber(item.customerPrice) }}</td>
                  <td class="px-3 py-2 text-right font-bold">{{ formatNumber(item.subtotal) }}</td>
                </tr>
             </tbody>
             <tfoot class="bg-gray-50 dark:bg-gray-800/50 font-bold border-t border-gray-200 dark:border-gray-700">
                <tr>
                  <td colspan="3" class="px-3 py-2 text-right text-gray-600 dark:text-gray-400">Grand Total</td>
                  <td class="px-3 py-2 text-right text-green-600 dark:text-green-400">{{ formatCurrency(selectedTransaction?.totalValue) }}</td>
                </tr>
             </tfoot>
           </table>
        </div>
      </div>



    </div>

    <!-- Footer Actions -->
    <div v-if="selectedTransaction?.status !== 'VOIDED'" class="p-6 border-t border-gray-100 dark:border-gray-800">
      <div class="grid grid-cols-2 gap-3 mb-3">
        <button
          @click="generateReceiptPDF"
          class="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition"
        >
           <Printer class="w-4 h-4" /> Cetak PDF
        </button>
        <button
           @click="sendToWhatsapp"
           class="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm bg-green-500 hover:bg-green-600 text-white transition shadow-lg shadow-green-500/30"
        >
           <MessageCircle class="w-5 h-5" /> Kirim WA
        </button>
      </div>
      <button
         @click="promptVoidTransaction"
         class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20 transition"
      >
         <X class="w-4 h-4" /> Batalkan Transaksi
      </button>
    </div>

    <div v-else class="p-6 border-t border-gray-100 dark:border-gray-800">
       <button
          @click="duplicateVoidedToForm"
          class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white transition shadow-lg shadow-blue-500/30"
       >
          <Copy class="w-5 h-5" /> Duplikat ke Form Baru
       </button>
       <p class="text-[10px] text-center mt-3 text-gray-500">Gunakan untuk memperbaiki baris item tanpa mengulang ketik dari awal.</p>
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
