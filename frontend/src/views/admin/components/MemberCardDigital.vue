<template>
  <div>
    <h3 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <CreditCard class="w-5 h-5 text-green-600" />
      Kartu Member Digital
    </h3>

    <!-- Container Kartu -->
    <div class="max-w-md mx-auto mb-8" style="perspective: 1000px; -webkit-perspective: 1000px;">
      <div 
        class="relative w-full h-[220px] transition-transform duration-700 cursor-pointer"
        :style="{ 
          transformStyle: 'preserve-3d', 
          WebkitTransformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          WebkitTransform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transformOrigin: 'center center',
          WebkitTransformOrigin: 'center center'
        }"
        @click="isFlipped = !isFlipped"
      >
        <!-- SISI DEPAN -->
        <div 
          class="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-green-700 to-green-900 shadow-xl overflow-hidden p-6 text-white flex flex-col justify-between"
          style="backface-visibility: hidden; -webkit-backface-visibility: hidden; transform: translateZ(1px); -webkit-transform: translateZ(1px);"
        >
          <!-- Background Pattern -->
          <div class="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div class="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl -ml-5 -mb-5"></div>

          <!-- Header -->
          <div class="flex justify-between items-start z-10">
            <div class="flex items-center gap-2">
              <div class="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                <img src="//assets/ecobank-logo.png" alt="Logo Gas Berlin" class="w-6 h-6 object-contain brightness-0 invert" />
              </div>
              <div>
                <h2 class="font-medium text-[10px] tracking-wider opacity-90">BANK SAMPAH</h2>
                <h1 class="font-bold text-sm leading-none tracking-wide">GAS BERLIN</h1>
              </div>
            </div>
            <span class="text-[9px] font-semibold bg-white/20 px-2 py-1 rounded backdrop-blur-sm tracking-widest uppercase">Member Card</span>
          </div>

          <!-- Chip & QR -->
          <div class="flex justify-between items-center px-1">
            <!-- Chip EMV -->
            <div class="w-12 h-9 rounded-lg bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 shadow-inner border border-gray-400/50 flex flex-col relative overflow-hidden">
              <!-- Chip Contact Lines -->
              <div class="flex-1 flex border-b border-gray-400/50">
                <div class="w-1/3 border-r border-gray-400/50 bg-white/10"></div>
                <div class="w-1/3 border-r border-gray-400/50 bg-white/20"></div>
                <div class="w-1/3 bg-white/10"></div>
              </div>
              <div class="flex-1 flex border-b border-gray-400/50">
                <div class="w-1/3 border-r border-gray-400/50 bg-white/20"></div>
                <div class="w-1/3 border-r border-gray-400/50 bg-white/30 flex items-center justify-center">
                  <div class="w-2 h-2 rounded-sm border border-gray-400/30"></div>
                </div>
                <div class="w-1/3 bg-white/20"></div>
              </div>
              <div class="flex-1 flex">
                <div class="w-1/3 border-r border-gray-400/50 bg-white/10"></div>
                <div class="w-1/3 border-r border-gray-400/50 bg-white/20"></div>
                <div class="w-1/3 bg-white/10"></div>
              </div>
            </div>
            
            <!-- QR Code Otomatis berdasarkan Nomor Rekening -->
            <div class="bg-white p-1 rounded-md shadow-sm">
              <img 
                v-if="customer?.accountNumber"
                :src="`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${customer.accountNumber}`" 
                alt="QR Code" 
                class="w-14 h-14 object-contain"
              />
            </div>
          </div>

          <!-- Footer Info -->
          <div class="z-10 mt-auto w-full">
            <div class="flex justify-between items-end">
              <div class="flex-1 min-w-0 pr-4">
                <p class="text-[8px] text-gray-200 uppercase tracking-widest mb-0.5 opacity-80">NAMA NASABAH</p>
                <h3 class="font-bold text-sm sm:text-base tracking-wide uppercase truncate block text-white" :title="customer?.name">
                  {{ customer?.name || 'Loading...' }}
                </h3>
              </div>
              <div class="text-right shrink-0">
                <p class="text-[8px] text-gray-200 uppercase tracking-widest mb-0.5 opacity-80">NO. MEMBER</p>
                <p class="font-medium text-sm sm:text-base tracking-widest text-white drop-shadow-sm">
                  {{ customer?.accountNumber || '....' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- SISI BELAKANG -->
        <div 
          class="absolute inset-0 w-full h-full rounded-2xl bg-gray-800 shadow-xl overflow-hidden p-6 flex flex-col justify-between text-white" 
          style="transform: rotateY(180deg) translateZ(1px); -webkit-transform: rotateY(180deg) translateZ(1px); backface-visibility: hidden; -webkit-backface-visibility: hidden;"
        >
          <div class="absolute top-4 left-0 w-full h-12 bg-black/50"></div>
          <div class="mt-16">
            <p class="text-[10px] text-gray-400 mb-1">Tanda Tangan Pemegang Kartu</p>
            <div class="w-full h-10 bg-white/10 rounded flex items-center px-3 font-scribble text-gray-300 italic">
              {{ customer?.name }}
            </div>
          </div>

          <div class="mt-auto space-y-2 text-[10px] text-gray-400 text-center">
            <p>Kartu ini adalah bukti keanggotaan resmi Bank Sampah GAS BERLIN.</p>
            <p>Perumahan Griya Asri Serpong Jl. Garuda Raya , RW 09 Kelurahan Bakti Jaya , Kecamatan Setu , Kota Tangerang Selatan</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { CreditCard } from 'lucide-vue-next'

const props = defineProps({
  customer: {
    type: Object,
    default: () => ({})
  }
})

const isFlipped = ref(false)
</script>
