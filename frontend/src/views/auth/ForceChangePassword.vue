<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 flex items-center justify-center p-4 relative overflow-hidden">
    
    <!-- Animated background patterns -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/2 left-1/4 w-64 h-64 bg-green-400/5 rounded-full blur-2xl animate-pulse" style="animation-delay: 2s;"></div>
    </div>

    <!-- Main Card -->
    <div class="relative w-full max-w-md">
      <!-- Glass card -->
      <div class="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 text-white">
        
        <!-- Icon & Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-yellow-400/20 border-2 border-yellow-400/50 mb-4 ring-4 ring-yellow-400/10">
            <ShieldAlert class="w-10 h-10 text-yellow-300" />
          </div>
          <h1 class="text-2xl font-bold text-white mb-2">Buat Password Baru Anda</h1>
          <p class="text-sm text-white/60 leading-relaxed">
            Untuk keamanan akun tabungan Anda, <br/>Anda <strong class="text-yellow-300">wajib</strong> mengganti password sekarang sebelum dapat melanjutkan.
          </p>
        </div>

        <!-- Alert: mandatory context -->
        <div class="bg-yellow-400/15 border border-yellow-400/30 rounded-xl px-4 py-3 mb-6 flex gap-3 items-start">
          <AlertTriangle class="w-4 h-4 text-yellow-300 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-yellow-200 leading-relaxed">
            Password saat ini dibuat oleh admin. Hanya Anda yang boleh tahu password akun rekening sampah Anda.
          </p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-5">
          
          <!-- New Password -->
          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              Password Baru <span class="text-red-400">*</span>
            </label>
            <div class="relative">
              <input
                :type="showNew ? 'text' : 'password'"
                v-model="form.newPassword"
                placeholder="Minimal 6 karakter"
                autocomplete="new-password"
                class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition pr-12"
                :class="{'border-red-400 ring-1 ring-red-400': errors.newPassword}"
              />
              <button type="button" @click="showNew = !showNew"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition">
                <Eye v-if="!showNew" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
            <!-- Strength indicator -->
            <div class="mt-2 flex gap-1" v-if="form.newPassword">
              <div v-for="i in 4" :key="i"
                class="h-1 rounded-full flex-1 transition-all duration-300"
                :class="strengthBar(i)"></div>
            </div>
            <p v-if="errors.newPassword" class="mt-1 text-xs text-red-400">{{ errors.newPassword }}</p>
          </div>

          <!-- Confirm Password -->
          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              Konfirmasi Password <span class="text-red-400">*</span>
            </label>
            <div class="relative">
              <input
                :type="showConfirm ? 'text' : 'password'"
                v-model="form.confirmPassword"
                placeholder="Ulangi password baru"
                autocomplete="new-password"
                class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition pr-12"
                :class="{'border-red-400 ring-1 ring-red-400': errors.confirmPassword}"
              />
              <button type="button" @click="showConfirm = !showConfirm"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition">
                <Eye v-if="!showConfirm" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
            <p v-if="form.confirmPassword && form.newPassword && form.confirmPassword !== form.newPassword" 
               class="mt-1 text-xs text-red-400">Password tidak cocok</p>
            <p v-if="form.confirmPassword && form.newPassword && form.confirmPassword === form.newPassword"
               class="mt-1 text-xs text-emerald-400 flex items-center gap-1">
               <Check class="w-3 h-3" /> Password cocok
            </p>
            <p v-if="errors.confirmPassword" class="mt-1 text-xs text-red-400">{{ errors.confirmPassword }}</p>
          </div>

          <!-- General error -->
          <div v-if="errorMessage" class="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3 flex gap-2 items-center">
            <X class="w-4 h-4 text-red-400 flex-shrink-0" />
            <p class="text-sm text-red-300">{{ errorMessage }}</p>
          </div>

          <!-- Success state -->
          <div v-if="success" class="bg-emerald-500/20 border border-emerald-400/40 rounded-xl px-4 py-4 text-center">
            <CheckCircle class="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p class="text-sm font-semibold text-emerald-300">Password berhasil diubah!</p>
            <p class="text-xs text-white/60 mt-1">Anda akan dialihkan ke halaman login...</p>
          </div>

          <!-- Submit -->
          <button
            v-if="!success"
            type="submit"
            :disabled="loading || !isFormValid"
            class="w-full py-3.5 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2"
            :class="isFormValid && !loading
              ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/40 active:scale-95'
              : 'bg-white/10 text-white/30 cursor-not-allowed'"
          >
            <span v-if="loading" class="flex items-center gap-2">
              <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Menyimpan...
            </span>
            <span v-else class="flex items-center gap-2">
              <ShieldCheck class="w-5 h-5" />
              Buat Password & Lanjutkan
            </span>
          </button>
        </form>

        <!-- Footer info -->
        <div class="mt-6 text-center">
          <p class="text-xs text-white/40">
            Sistem Bank Sampah — EcoBank
          </p>
          <button @click="logout" class="mt-2 text-xs text-white/40 hover:text-white/70 underline transition">
            Kembali ke Login
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ShieldAlert, AlertTriangle, Eye, EyeOff, Check, X, CheckCircle, ShieldCheck } from 'lucide-vue-next';
import { useUserStore } from '@/stores/userStore';
import { selfChangePassword } from '@/services/bankService';
import { confirmLogout } from '@/utils/confirmDialog';

const router = useRouter();
const userStore = useUserStore();

// Form state
const form = ref({ newPassword: '', confirmPassword: '' });
const showNew = ref(false);
const showConfirm = ref(false);
const loading = ref(false);
const success = ref(false);
const errorMessage = ref('');
const errors = ref({ newPassword: '', confirmPassword: '' });

// Password strength: 0–4
const passwordStrength = computed(() => {
  const pw = form.value.newPassword;
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || /[A-Z]/.test(pw)) score++;
  return score;
});

const strengthBar = (index) => {
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400'];
  if (index <= passwordStrength.value) return colors[passwordStrength.value - 1] || 'bg-white/20';
  return 'bg-white/20';
};

const isFormValid = computed(() => {
  return form.value.newPassword.length >= 6 &&
    form.value.confirmPassword === form.value.newPassword;
});

const handleSubmit = async () => {
  errors.value = { newPassword: '', confirmPassword: '' };
  errorMessage.value = '';

  if (form.value.newPassword.length < 6) {
    errors.value.newPassword = 'Password minimal 6 karakter';
    return;
  }
  if (form.value.confirmPassword !== form.value.newPassword) {
    errors.value.confirmPassword = 'Konfirmasi password tidak cocok';
    return;
  }

  loading.value = true;
  try {
    await selfChangePassword(form.value.newPassword, form.value.confirmPassword);
    success.value = true;

    // Reset flag di store agar guard tidak memblok lagi
    if (userStore.user) {
      userStore.user.mustChangePassword = false;
      localStorage.setItem('user', JSON.stringify(userStore.user));
    }

    // Logout setelah 2 detik agar token baru dihasilkan via login ulang
    setTimeout(() => {
      userStore.logout();
      router.replace('/login');
    }, 2000);

  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Gagal menyimpan password. Coba lagi.';
  } finally {
    loading.value = false;
  }
};

const logout = async () => {
  const ok = await confirmLogout();
  if (!ok) return;
  userStore.logout();
  router.replace('/login');
};
</script>
