<template>
  <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in p-4">
    <button
      class="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-50 backdrop-blur-sm"
      @click="$emit('close')"
    >
      <X class="w-6 h-6" />
    </button>

    <div class="w-full h-full flex items-center justify-center">
      <img :src="imageUrl" alt="Bukti Transfer" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
    </div>

    <button
      class="absolute bottom-6 right-6 p-4 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20 transition z-50 flex items-center justify-center"
      title="Download Gambar"
      @click="$emit('download')"
    >
      <Download class="w-6 h-6" />
    </button>
  </div>
</template>

<script setup>
import { Download, X } from 'lucide-vue-next';

defineProps({
  show: Boolean,
  imageUrl: {
    type: String,
    default: '',
  },
});

defineEmits(['close', 'download']);
</script>
