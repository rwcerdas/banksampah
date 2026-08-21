<template>
  <!-- TRANSFER MODAL - 3 STEP SECURITY FLOW -->
  <div v-if="show" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal"></div>
      
      <div class="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl relative z-10 overflow-hidden transform transition-all">
          <!-- Header with Step Indicator -->
          <div class="p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800">
              <div class="flex justify-between items-center mb-3">
                  <h3 class="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                      <ArrowRightLeft class="w-5 h-5 text-green-600" /> Transfer Saldo
                  </h3>
                  <button @click="closeModal" class="p-1 rounded-full hover:bg-white/50 dark:hover:bg-gray-700">
                      <X class="w-5 h-5" />
                  </button>
              </div>
              
              <!-- Step Progress -->
              <div class="flex gap-2">
                  <div v-for="s in 3" :key="s" class="flex-1 h-1 rounded-full transition-all" 
                       :class="s <= step ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-700'"></div>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                  Step {{ step }}/3: 
                  <span v-if="step === 1">Cek Rekening</span>
                  <span v-else-if="step === 2">Input Transfer</span>
                  <span v-else>Konfirmasi</span>
              </p>
          </div>
          
          <!-- Error Message -->
          <div v-if="error" class="mx-6 mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-lg">
              {{ error }}
          </div>

          <!-- STEP 1: Account Lookup -->
          <div v-if="step === 1" class="p-6 space-y-4">
              <div class="relative">
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Rekening Tujuan
                  </label>
                  <input 
                      v-model="form.receiverAccountNumber" 
                      type="text" 
                      placeholder="Cari nama atau nomor rekening..." 
                      class="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-mono text-sm focus:ring-2 focus:ring-green-500 outline-none uppercase" 
                      @input="handleSearch"
                      @keyup.enter="handleLookup"
                  />
                  
                  <!-- Autocomplete Dropdown -->
                  <div v-if="searchResults.length > 0" class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 max-h-48 overflow-y-auto">
                      <div v-for="result in searchResults" :key="result.accountNumber" 
                           @click="selectRecipient(result)"
                           class="p-3 hover:bg-green-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-0"
                      >
                          <p class="font-bold text-gray-900 dark:text-white text-sm">{{ result.name }}</p>
                          <p class="text-xs text-gray-500 font-mono">{{ result.accountNumber }}</p>
                      </div>
                  </div>

                  <p v-if="isSearching" class="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                      <Loader2 class="w-3 h-3 animate-spin" /> Mencari...
                  </p>
                  <p v-else class="text-[10px] text-gray-400 mt-1">Ketik nama nasabah atau nomor rekening</p>
              </div>

              <button 
                  @click="handleLookup" 
                  :disabled="loading || !form.receiverAccountNumber" 
                  class="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2 transition disabled:cursor-not-allowed">
                  <div v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span v-else>🔍 Cek Penerima</span>
              </button>
          </div>

          <!-- STEP 2: Amount & Notes (After Verification) -->
          <div v-else-if="step === 2" class="p-6 space-y-4">
              <!-- Verified Recipient -->
              <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <div class="flex items-start gap-3">
                      <div class="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                          <Check class="w-6 h-6 text-white" />
                      </div>
                      <div class="flex-1">
                          <p class="text-xs text-green-600 dark:text-green-400 font-bold uppercase">Penerima Terverifikasi</p>
                          <p class="font-bold text-gray-900 dark:text-white mt-1">{{ lookedUpRecipient?.name }}</p>
                          <p class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ lookedUpRecipient?.accountNumber }}</p>
                      </div>
                  </div>
              </div>

              <!-- Amount Input -->
              <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Nominal Transfer
                  </label>
                  <div class="relative">
                       <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                       <input 
                           v-model="form.amount" 
                           type="number" 
                           min="100" 
                           max="10000000"
                           placeholder="0" 
                           class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-bold text-lg focus:ring-2 focus:ring-green-500 outline-none" 
                       />
                  </div>
                  <div class="flex justify-between items-center mt-1">
                      <p class="text-[10px] text-gray-400">Saldo: {{ formatCurrency(customer?.balance) }}</p>
                      <p class="text-[10px] text-orange-500">Maks: Rp 10 juta</p>
                  </div>
              </div>

              <!-- Notes Input -->
              <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Catatan (Opsional)
                  </label>
                  <textarea 
                      v-model="form.notes" 
                      rows="2" 
                      placeholder="Untuk apa transfer ini?"
                      class="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-green-500 outline-none">
                  </textarea>
              </div>

              <!-- Navigation Buttons -->
              <div class="flex gap-3">
                  <button 
                      @click="goBack" 
                      class="flex-1 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-bold rounded-xl transition">
                      ← Kembali
                  </button>
                  <button 
                      @click="goToStep3" 
                      :disabled="!form.amount || form.amount < 100"
                      class="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold rounded-xl shadow-lg transition disabled:cursor-not-allowed">
                      Lanjutkan →
                  </button>
              </div>
          </div>

          <!-- STEP 3: Password Confirmation -->
          <div v-else-if="step === 3" class="relative overflow-hidden flex-1">
              <div class="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
                   style="background-image: url('//assets/ecobank-logo.png'); background-repeat: repeat; background-size: 80px; transform: rotate(-12deg) scale(1.5);">
              </div>
              <div class="p-6 space-y-4 relative z-10 h-full overflow-y-auto w-full">
              <!-- Transaction Summary -->
              <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div class="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Ringkasan Transfer</p>
                  </div>
                  <div class="p-4 space-y-3">
                      <div class="flex justify-between items-center text-sm">
                          <span class="text-gray-500 dark:text-gray-400">Penerima</span>
                          <span class="font-bold text-gray-900 dark:text-white">{{ lookedUpRecipient?.name }}</span>
                      </div>
                      <div class="flex justify-between items-center text-sm">
                          <span class="text-gray-500 dark:text-gray-400">Rekening</span>
                          <span class="font-mono text-gray-900 dark:text-white">{{ lookedUpRecipient?.accountNumber }}</span>
                      </div>
                      <div class="flex justify-between items-center text-sm">
                          <span class="text-gray-500 dark:text-gray-400">Nominal</span>
                          <span class="font-bold text-green-600 dark:text-green-400 text-lg">{{ formatCurrency(form.amount) }}</span>
                      </div>
                      <div v-if="form.notes" class="flex justify-between items-start text-sm">
                          <span class="text-gray-500 dark:text-gray-400">Catatan</span>
                          <span class="text-gray-700 dark:text-gray-300 text-right max-w-[200px]">{{ form.notes }}</span>
                      </div>
                      <div class="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                          <span class="text-xs text-gray-500 dark:text-gray-400">Saldo Akhir</span>
                          <span class="font-bold text-gray-900 dark:text-white">
                              {{ formatCurrency((customer?.balance || 0) - (form.amount || 0)) }}
                          </span>
                      </div>
                  </div>
              </div>

              <!-- Disclaimer Alert -->
              <div class="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl flex gap-3">
                  <div class="w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle class="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <p class="text-[10px] leading-relaxed text-yellow-800 dark:text-yellow-200">
                      Pastikan nominal dan nomor rekening yang dimasukkan sudah sesuai. 
                      Jika terdapat kesalahan data, maka sepenuhnya menjadi <span class="font-bold">tanggung jawab nasabah</span>.
                  </p>
              </div>

              <!-- Password Input -->
              <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Lock class="w-3.5 h-3.5" /> Masukkan Password
                  </label>
                  <input 
                      v-model="form.password" 
                      type="password" 
                      placeholder="Password akun Anda" 
                      class="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-mono text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                      @keyup.enter="handleSubmit"
                  />
                  <p class="text-[10px] text-gray-400 mt-1">Untuk keamanan, konfirmasi dengan password Anda</p>
              </div>

              <!-- Navigation Buttons -->
              <div class="flex gap-3">
                  <button 
                      @click="step = 2" 
                      class="flex-1 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-bold rounded-xl transition">
                      ← Kembali
                  </button>
                  <button 
                      @click="handleSubmit" 
                      :disabled="loading || !form.password"
                      class="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2 transition disabled:cursor-not-allowed">
                      <div v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span v-else class="flex items-center gap-2"><Lock class="w-4 h-4" /> Transfer</span>
                  </button>
              </div>
          </div>
          </div>
      </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ArrowRightLeft, X, Loader2, Check, AlertTriangle, Lock } from 'lucide-vue-next'
import * as bankService from '@/services/bankService'
import api from '@/utils/api'
import { apiUrl } from '@/utils/apiUrl'

const props = defineProps({
  show: Boolean,
  customer: Object
})

const emit = defineEmits(['update:show', 'success'])

// State
const step = ref(1)
const lookedUpRecipient = ref(null)
const form = ref({
  receiverAccountNumber: '',
  amount: '',
  notes: '',
  password: ''
})
const loading = ref(false)
const error = ref('')
const searchResults = ref([])
const isSearching = ref(false)

// Format currency
const formatCurrency = (value) => {
  if (!value) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value)
}

// Close modal
const closeModal = () => {
  emit('update:show', false)
}

// Reset on open
watch(() => props.show, (newVal) => {
  if (newVal) {
    step.value = 1
    lookedUpRecipient.value = null
    form.value = { receiverAccountNumber: '', amount: '', notes: '', password: '' }
    error.value = ''
    searchResults.value = []
  }
})

// Search recipient
const handleSearch = async () => {
  const query = form.value.receiverAccountNumber
  if (!query || query.length < 3) {
    searchResults.value = []
    return
  }
  
  isSearching.value = true
  try {
    const res = await api.get(apiUrl('waste-bank/customers/search'), {
      params: { q: query }
    })
    if (res.data.success) {
      searchResults.value = res.data.data
    } else {
      searchResults.value = []
    }
  } catch (err) {
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

// Select recipient from dropdown
const selectRecipient = (recipient) => {
  lookedUpRecipient.value = recipient
  form.value.receiverAccountNumber = recipient.accountNumber
  searchResults.value = []
  step.value = 2
}

// Lookup recipient (button click)
const handleLookup = async () => {
  loading.value = true
  error.value = ''
  searchResults.value = []
  
  try {
    const accountNumber = form.value.receiverAccountNumber.trim()
    if (!accountNumber) {
      error.value = 'Masukkan nomor rekening atau nama nasabah'
      loading.value = false
      return
    }

    const res = await api.get(apiUrl('waste-bank/customers/search'), {
      params: { q: accountNumber }
    })

    if (res.data.success && res.data.data.length > 0) {
      if (res.data.data.length === 1) {
        selectRecipient(res.data.data[0])
      } else {
        const exactMatch = res.data.data.find(r => 
          r.accountNumber.toUpperCase() === accountNumber.toUpperCase()
        )
        if (exactMatch) {
          selectRecipient(exactMatch)
        } else {
          searchResults.value = res.data.data
          error.value = 'Ditemukan beberapa hasil, silakan pilih di bawah'
        }
      }
    } else {
      error.value = 'Penerima tidak ditemukan'
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Gagal mencari rekening'
  } finally {
    loading.value = false
  }
}

// Go back to step 1
const goBack = () => {
  step.value = 1
  lookedUpRecipient.value = null
}

// Go to step 3
const goToStep3 = () => {
  step.value = 3
}

// Submit transfer
const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await bankService.transferBalance({
      receiverAccountNumber: lookedUpRecipient.value.accountNumber,
      amount: Number(form.value.amount),
      notes: form.value.notes,
      password: form.value.password
    })
    
    // Success - emit event to parent
    emit('success')
    closeModal()
  } catch (err) {
    console.error(err)
    error.value = err.response?.data?.message || 'Transfer Gagal'
  } finally {
    loading.value = false
  }
}
</script>
