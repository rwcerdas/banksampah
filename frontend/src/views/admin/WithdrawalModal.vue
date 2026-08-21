<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" @click="close"></div>
    
    <div class="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all transform scale-100">
      
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div>
           <h3 class="font-bold text-lg text-gray-900 dark:text-white">Tarik Tunai</h3>
           <p class="text-xs text-gray-500">Cairkan saldo tabungan sampah Anda</p>
        </div>
        <button @click="close" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <X class="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 overflow-y-auto custom-scrollbar">
        
        <!-- Saldo Info -->
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-6 flex items-center justify-between">
           <div>
               <p class="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Saldo Tersedia</p>
               <h2 class="text-xl font-bold text-blue-700 dark:text-blue-300">{{ formatCurrency(balance) }}</h2>
           </div>
           <Wallet class="w-8 h-8 text-blue-500 opacity-50" />
        </div>

        <form @submit.prevent="submitWithdrawal" class="space-y-5">
           
           <!-- Nominal -->
           <div>
               <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nominal Penarikan</label>
               <div class="relative">
                   <span class="absolute left-4 top-3 text-gray-500 font-semibold">Rp</span>
                   <input 
                     type="number" 
                     v-model="form.amount" 
                     class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition font-semibold text-lg"
                     placeholder="0"
                     min="10000"
                     required
                   />
               </div>
               <p v-if="form.amount > balance" class="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle class="w-3 h-3" /> Saldo tidak mencukupi
               </p>
               <p class="text-[10px] text-gray-400 mt-1">Minimal penarikan Rp 10.000</p>
           </div>

           <!-- Metode -->
           <div>
               <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Metode Pencairan</label>
               <div class="grid grid-cols-3 gap-2">
                   <button 
                     type="button"
                     v-for="method in methods" 
                     :key="method.id"
                     @click="form.method = method.id"
                     class="flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 gap-2"
                     :class="form.method === method.id 
                       ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-1 ring-green-500' 
                       : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'"
                   >
                       <component :is="method.icon" class="w-5 h-5" />
                       <span class="text-xs font-medium">{{ method.label }}</span>
                   </button>
               </div>
           </div>

           <!-- Detail Rekening (If Transfer/Ewallet) -->
           <div v-if="form.method !== 'CASH'" class="space-y-4 animate-fadeIn">
               <div>
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       {{ form.method === 'TRANSFER' ? 'Nama Bank' : 'E-Wallet' }}
                   </label>
                   <select 
                     v-model="form.destinationDetail.bankName" 
                     class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-green-500 outline-none"
                     required
                   >
                       <option value="" disabled>Pilih {{ form.method === 'TRANSFER' ? 'Bank' : 'E-Wallet' }}</option>
                       <option v-for="opt in (form.method === 'TRANSFER' ? bankOptions : ewalletOptions)" :key="opt" :value="opt">{{ opt }}</option>
                   </select>
               </div>
               
               <div>
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nomor Rekening / HP</label>
                   <input 
                     type="text" 
                     v-model="form.destinationDetail.accountNumber" 
                     class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-green-500 outline-none"
                     placeholder="Contoh: 1234567890"
                     required
                   />
               </div>

                <div>
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Atas Nama</label>
                   <input 
                     type="text" 
                     v-model="form.destinationDetail.accountName" 
                     class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-green-500 outline-none"
                     placeholder="Nama pemilik rekening"
                     required
                   />
               </div>
           </div>

           <!-- Password Confirm -->
           <div>
               <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Konfirmasi Password</label>
               <div class="relative">
                   <Lock class="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                   <input 
                     :type="showPassword ? 'text' : 'password'" 
                     v-model="form.password" 
                     class="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-green-500 outline-none transition"
                     placeholder="Masukkan password akun Anda"
                     required
                   />
                   <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                      <component :is="showPassword ? EyeOff : Eye" class="w-4 h-4" />
                   </button>
               </div>
               <p class="text-[10px] text-gray-500 mt-1">Password digunakan untuk verifikasi keamanan.</p>
           </div>

           <!-- Error Message -->
           <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
               <AlertTriangle class="w-4 h-4 shrink-0" />
               {{ error }}
           </div>

           <!-- Submit Button -->
           <button 
             type="submit" 
             :disabled="loading || form.amount > balance || !isFormValid"
             class="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-200 dark:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
           >
               <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
               <span v-else>Ajukan Penarikan</span>
           </button>

        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue';
import { X, Wallet, AlertTriangle, Building2, Banknote, Smartphone, Lock, Eye, EyeOff, Loader2 } from 'lucide-vue-next';
import { createWithdrawal } from '@/services/bankService';

const props = defineProps({
  show: Boolean,
  balance: {
    type: Number,
    default: 0
  },
  customerId: String
});

const emit = defineEmits(['close', 'success']);

const loading = ref(false);
const error = ref('');
const showPassword = ref(false);

const methods = [
    { id: 'CASH', label: 'Tunai', icon: Banknote },
    { id: 'TRANSFER', label: 'Transfer Bank', icon: Building2 },
    { id: 'EWALLET', label: 'E-Wallet', icon: Smartphone }
];

const bankOptions = ['BCA', 'BNI', 'BRI', 'Mandiri', 'BSI', 'CIMB Niaga', 'Jago', 'SeaBank'];
const ewalletOptions = ['GoPay', 'OVO', 'Dana', 'ShopeePay', 'LinkAja'];

const form = reactive({
    amount: '',
    method: 'CASH',
    destinationDetail: {
        bankName: '',
        accountNumber: '',
        accountName: ''
    },
    password: ''
});

// Reset form when modal opens
watch(() => props.show, (val) => {
    if (val) {
        form.amount = '';
        form.method = 'CASH';
        form.destinationDetail = { bankName: '', accountNumber: '', accountName: '' };
        form.password = '';
        error.value = '';
    }
});

const isFormValid = computed(() => {
    if (!form.amount || form.amount < 10000 || !form.password) return false;
    if (form.method !== 'CASH') {
        return form.destinationDetail.bankName && form.destinationDetail.accountNumber && form.destinationDetail.accountName;
    }
    return true;
});

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value || 0);
};

const submitWithdrawal = async () => {
    if (form.amount > props.balance) {
        error.value = 'Saldo tidak mencukupi';
        return;
    }

    loading.value = true;
    error.value = '';

    try {
        await createWithdrawal({
            customerId: props.customerId,
            amount: Number(form.amount),
            withdrawalDate: new Date(),
            method: form.method,
            destinationDetail: form.method !== 'CASH' ? form.destinationDetail : undefined,
            password: form.password
        });
        
        emit('success');
        emit('close');
    } catch (err) {
        // Handle specific password error from backend
        error.value = err.response?.data?.message || err.message || 'Gagal mengajukan penarikan';
        // If password wrong, maybe clear password field
        if (error.value.toLowerCase().includes('password')) {
            form.password = '';
        }
    } finally {
        loading.value = false;
    }
};

const close = () => {
    if (loading.value) return;
    emit('close');
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 20px;
}
.animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
