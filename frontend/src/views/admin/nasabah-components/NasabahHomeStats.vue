<template>
  <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
          <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2 text-green-600 dark:text-green-400">
              <Scale class="w-5 h-5" />
          </div>
          <p class="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Total Sampah</p>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {{ stats.totalWeight }} <span class="text-sm font-medium text-gray-500">Kg</span>
          </h3>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
          <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400">
              <Receipt class="w-5 h-5" />
          </div>
          <p class="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Total Setor</p>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {{ stats.count }} <span class="text-sm font-medium text-gray-500">Kali</span>
          </h3>
      </div>
  </div>
</template>

<script setup>
import { Scale, Receipt } from 'lucide-vue-next';

defineProps({
  stats: {
    type: Object,
    default: () => ({ totalWeight: 0, count: 0 })
  }
});
</script>
