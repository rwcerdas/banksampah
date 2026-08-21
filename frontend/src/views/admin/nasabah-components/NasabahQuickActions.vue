<template>
  <div class="grid grid-cols-2 gap-4">
      <button @click="$emit('open-transfer')" class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-green-50 dark:hover:bg-gray-700 transition active:scale-95 group">
          <div class="bg-green-100 dark:bg-green-900/30 p-3 rounded-full text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
              <ArrowRightLeft class="w-6 h-6" />
          </div>
          <span class="font-semibold text-gray-700 dark:text-gray-200">Transfer</span>
      </button>

      <button @click="$emit('open-withdraw')" class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-gray-700 transition active:scale-95 group">
          <div class="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Banknote class="w-6 h-6" />
          </div>
          <span class="font-semibold text-gray-700 dark:text-gray-200">Tarik Saldo</span>
      </button>
  </div>
</template>

<script setup>
import { ArrowRightLeft, Banknote } from 'lucide-vue-next';

defineEmits(['open-transfer', 'open-withdraw']);
</script>
