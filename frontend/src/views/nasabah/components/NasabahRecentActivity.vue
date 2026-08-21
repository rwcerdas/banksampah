<template>
  <div class="mb-24">
      <div class="flex justify-between items-center mb-4 px-1">
          <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <History class="w-5 h-5 text-green-600" />
              Aktivitas Terakhir
          </h3>
          <button @click="$emit('view-all')" class="text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400">
              Lihat Semua
          </button>
      </div>

      <div class="space-y-3">
          <div v-for="trx in transactions" :key="trx._id"
               @click="$emit('open-detail', trx)"
               class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-transform cursor-pointer">
              <div class="flex justify-between items-start mb-2">
                  <div>
                      <h4 class="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{{ trx.title }}</h4>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ trx.subtitle }}</p>
                  </div>
                  <span class="font-bold text-sm" :class="trx.inferredType === 'INCOME' ? 'text-green-600' : 'text-red-600'">
                      {{ trx.inferredType === 'INCOME' ? '+' : '-' }} {{ formatCurrency(trx.amount) }}
                  </span>
              </div>
              <div class="flex justify-between items-center pt-2 border-t border-gray-50 dark:border-gray-700/50">
                  <span class="text-[10px] text-gray-400 uppercase tracking-wider">{{ new Date(trx.transactionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        :class="trx.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600'">
                      {{ trx.status === 'COMPLETED' ? 'Berhasil' : trx.status }}
                  </span>
              </div>
          </div>

          <!-- Empty State -->
          <div v-if="transactions.length === 0" class="text-center py-8 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <p class="text-sm">Belum ada transaksi</p>
          </div>
      </div>
  </div>
</template>

<script setup>
import { History } from 'lucide-vue-next';

defineProps({
  transactions: {
    type: Array,
    default: () => []
  }
});

defineEmits(['view-all', 'open-detail']);

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};
</script>
