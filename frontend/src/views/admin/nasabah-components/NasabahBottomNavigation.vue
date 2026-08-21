<template>
  <div class="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-6 py-3 flex justify-around items-center z-50">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="flex flex-col items-center gap-1 transition-all duration-300"
      :class="modelValue === tab.value ? 'text-green-600 scale-105' : 'text-gray-400 hover:text-gray-600'"
      @click="$emit('update:modelValue', tab.value)"
    >
      <div
        class="p-1.5 rounded-xl transition-colors"
        :class="modelValue === tab.value ? 'bg-green-100 dark:bg-green-900/30' : ''"
      >
        <component
          :is="tab.icon"
          class="w-6 h-6"
          :class="modelValue === tab.value ? 'fill-current' : ''"
        />
      </div>
      <span class="text-[10px] font-medium">{{ tab.label }}</span>
    </button>
  </div>
</template>

<script setup>
import { Home, PieChart, Coins, BookOpen, User } from 'lucide-vue-next';

defineProps({
  modelValue: {
    type: String,
    required: true,
  },
});

defineEmits(['update:modelValue']);

const tabs = [
  { value: 'home', label: 'Beranda', icon: Home },
  { value: 'tracker', label: 'Tracker', icon: PieChart },
  { value: 'prices', label: 'Harga', icon: Coins },
  { value: 'education', label: 'Edukasi', icon: BookOpen },
  { value: 'profile', label: 'Profil', icon: User },
];
</script>
