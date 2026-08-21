<template>
  <div class="bg-gradient-to-r from-green-600 to-green-800 rounded-2xl p-4 mb-6 text-white shadow-lg relative overflow-hidden h-[150px] flex items-center w-full">
    <div class="relative z-10 flex justify-between items-center w-full h-full">
      <!-- Left Side: Greeting & Balance -->
      <div class="flex flex-col justify-center h-full space-y-3">
           <div>
              <h1 class="text-xl font-bold flex items-center leading-none">
                Halo, {{ customerName }}!
                <Hand class="w-5 h-5 text-yellow-400 ml-2 animate-pulse" />
              </h1>
              <p class="text-green-100 text-xs mt-1">Selamat datang kembali</p>
           </div>

           <div class="inline-block bg-white/20 backdrop-blur-md rounded-xl px-4 py-2 border border-white/30">
              <div class="flex items-center gap-2 mb-0.5">
                  <p class="text-[10px] text-green-100 uppercase tracking-wider">Saldo Tabungan</p>
                  <button @click="$emit('toggle-balance')" class="text-green-100 hover:text-white transition-colors focus:outline-none p-0.5 rounded-full hover:bg-white/10">
                      <Eye v-if="!showBalance" class="w-3 h-3" />
                      <EyeOff v-else class="w-3 h-3" />
                  </button>
              </div>
              <div class="flex items-center">
                  <p v-if="showBalance" class="text-xl font-bold text-white tracking-tight leading-none">{{ formattedBalance }}</p>
                  <p v-else class="text-xl font-bold text-white tracking-widest leading-none">••••••••</p>
              </div>
           </div>
      </div>

      <!-- Right Side: Decoration/Icon -->
      <div class="relative w-32 h-full flex items-center justify-center opacity-90">
          <div class="absolute inset-0 bg-white/10 rounded-full blur-2xl transform translate-x-4"></div>
          <Wallet class="w-20 h-20 text-green-200/50 transform -rotate-12" />
      </div>
    </div>

    <!-- Shared Decorative Elements -->
    <div class="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl -ml-5 -mb-5 pointer-events-none"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Hand, Eye, EyeOff, Wallet } from 'lucide-vue-next';

const props = defineProps({
  customer: {
    type: Object,
    default: () => ({})
  },
  showBalance: {
    type: Boolean,
    default: false
  }
});

defineEmits(['toggle-balance']);

const customerName = computed(() => {
  return props.customer?.name?.split(' ')[0] || 'Nasabah';
});

const formattedBalance = computed(() => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(props.customer?.balance || 0);
});
</script>
