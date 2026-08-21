<template>
  <div v-if="show" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" @click="$emit('close')" />

    <div class="bg-white dark:bg-gray-900 w-full sm:max-w-md pointer-events-auto rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
      <div class="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start">
        <div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">Detail Transaksi</h3>
          <p class="text-xs text-gray-500 font-mono">{{ transactionDate }}</p>
        </div>
        <button class="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full bg-gray-50 dark:bg-gray-800" @click="$emit('close')">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="relative overflow-hidden flex-1">
        <div
          class="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
          style="background-image: url('//assets/ecobank-logo.png'); background-repeat: repeat; background-size: 80px; transform: rotate(-12deg) scale(1.5);"
        />
        <div class="p-6 overflow-y-auto h-full relative z-10 space-y-6">
          <div class="text-center py-6">
            <div class="w-20 h-20 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm relative animate-success-circle">
              <svg class="w-10 h-10 text-green-600 dark:text-green-400 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" class="animate-check-stroke" />
              </svg>
              <div class="absolute inset-0 rounded-full border-4 border-green-200 dark:border-green-700 opacity-0 animate-ripple" />
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
              {{ transaction?.type === 'TRANSFER' ? 'Kirim ke' : transaction?.title }}
            </p>
            <h3 v-if="transaction?.type === 'TRANSFER' && transaction?.receiverName" class="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {{ transaction.receiverName }}
            </h3>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {{ transaction?.inferredType === 'INCOME' ? '+' : '-' }} {{ formatCurrency(transaction?.amount) }}
            </h2>
            <span class="inline-block mt-3 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border border-green-200 dark:border-green-800">
              Berhasil
            </span>
          </div>

          <div class="space-y-4">
            <div v-if="transaction?.notes" class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
              <p class="text-xs text-gray-500 italic">"{{ transaction.notes }}"</p>
            </div>
            <div v-if="transaction?.items?.length">
              <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Package class="w-3.5 h-3.5" /> Rincian Sampah
              </h4>
              <div class="rounded-xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 overflow-hidden backdrop-blur-sm">
                <div class="divide-y divide-gray-50 dark:divide-gray-800">
                  <div v-for="(item, index) in transaction.items" :key="index" class="p-3">
                    <div class="flex justify-between items-start">
                      <span class="font-bold text-xs text-gray-900 dark:text-white">{{ item.itemName || item.name || 'Item' }}</span>
                      <span class="font-bold text-xs text-gray-900 dark:text-white">{{ formatCurrency(item.subtotal || (item.customerPrice * item.weight)) }}</span>
                    </div>
                    <div class="text-[10px] text-gray-500 mt-1">
                      {{ item.weight }} kg &times; {{ formatCurrency(item.customerPrice || item.price) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800 space-y-3">
            <div class="flex justify-between items-center text-xs">
              <span class="text-gray-500 flex items-center gap-2"><Receipt class="w-3.5 h-3.5" /> Metode Pembayaran</span>
              <span class="font-bold text-gray-900 dark:text-white capitalize">{{ transaction?.method }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-gray-500 flex items-center gap-2"><Tags class="w-3.5 h-3.5" /> ID Transaksi</span>
              <span class="font-mono text-gray-900 dark:text-white select-all">{{ shortTransactionId }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex flex-col gap-3">
        <button class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 dark:shadow-none flex items-center justify-center gap-2 transition active:scale-[0.98]" @click="$emit('share')">
          <Share2 class="w-5 h-5" /> Bagikan Bukti
        </button>
        <button class="w-full py-3 bg-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 font-bold rounded-xl active:scale-[0.98] transition-transform" @click="$emit('close')">
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Package, Receipt, Share2, Tags, X } from 'lucide-vue-next';

const props = defineProps({
  show: { type: Boolean, default: false },
  transaction: { type: Object, default: null },
});

defineEmits(['close', 'share']);

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(value || 0);

const transactionDate = computed(() => {
  const value = props.transaction?.date || props.transaction?.transactionDate;
  if (!value) return '-';
  const date = new Date(value);
  return `${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} • ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
});

const shortTransactionId = computed(() => props.transaction?._id?.substring(0, 8).toUpperCase() || '-');
</script>

<style scoped>
@keyframes success-circle {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.animate-success-circle { animation: success-circle 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

@keyframes check-stroke {
  0% { stroke-dashoffset: 24; opacity: 0; }
  20% { stroke-dashoffset: 24; opacity: 1; }
  50%, 80% { stroke-dashoffset: 0; opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 0; }
}
.animate-check-stroke {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: check-stroke 3s cubic-bezier(0.65, 0, 0.45, 1) infinite;
}

@keyframes ripple {
  0% { transform: scale(0.8); opacity: 0.5; border-width: 4px; }
  100% { transform: scale(1.5); opacity: 0; border-width: 0; }
}
.animate-ripple { animation: ripple 1.5s 0.3s infinite ease-out; }
</style>
