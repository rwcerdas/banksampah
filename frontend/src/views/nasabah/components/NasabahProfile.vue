<template>
  <div class="px-4 py-6 sm:p-6 pb-nav-mobile space-y-6">
      <h3 class="font-bold text-xl text-gray-900 dark:text-white">Profil Saya</h3>

      <!-- Foto Profil -->
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center">
        <ProfilePhotoUpload
          :display-name="customer?.name || userStore.namaLengkap"
          size="lg"
          @uploaded="onPhotoFeedback('Foto profil berhasil diperbarui!', 'success')"
          @removed="onPhotoFeedback('Foto profil telah dihapus', 'success')"
          @error="onPhotoFeedback($event, 'error')"
        />
        <p class="mt-3 text-sm font-medium text-gray-900 dark:text-white">{{ customer?.name || userStore.namaLengkap }}</p>
        <p v-if="userStore.username" class="text-xs text-gray-500 dark:text-gray-400">@{{ userStore.username }}</p>
      </div>

      <!-- Informasi Rekening -->
    <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h3 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard class="w-5 h-5 text-purple-600" />
            Informasi Rekening
        </h3>
        <div class="space-y-4">
            <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span class="text-sm text-gray-500 dark:text-gray-400">No. Rekening</span>
                <div class="flex items-center gap-2">
                    <span class="font-mono font-medium text-gray-900 dark:text-white">{{ customer?.accountNumber || '-' }}</span>
                    <button v-if="customer?.accountNumber" @click="copyToClipboard(customer.accountNumber, 'account')" class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                         <component :is="copiedId === 'account' ? 'Check' : 'Copy'" class="w-3.5 h-3.5" :class="copiedId === 'account' ? 'text-green-600' : ''" />
                    </button>
                </div>
            </div>
             <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span class="text-sm text-gray-500 dark:text-gray-400">Status Akun</span>
                 <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                    {{ customer?.isActive ? 'Aktif' : 'Tidak Aktif' }}
                </span>
            </div>
        </div>
    </div>

    <!-- Data Diri -->
    <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
         <h3 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User class="w-5 h-5 text-blue-600" />
            Data Diri
        </h3>
        <div class="space-y-4">
            <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span class="text-sm text-gray-500 dark:text-gray-400">Nama Lengkap</span>
                <span class="font-medium text-gray-900 dark:text-white text-right">{{ customer?.name || '-' }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span class="text-sm text-gray-500 dark:text-gray-400">Username</span>
                <span class="font-medium text-gray-900 dark:text-white text-right">{{ userStore.username ? '' + userStore.username : '-' }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span class="text-sm text-gray-500 dark:text-gray-400">NIK</span>
                <div class="flex items-center gap-2">
                     <span class="font-mono font-medium text-gray-900 dark:text-white">
                         {{ showNik ? (customer?.nik || '-') : maskNik(customer?.nik) }}
                     </span>
                     <button @click="showNik = !showNik" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                         <component :is="showNik ? 'EyeOff' : 'Eye'" class="w-4 h-4" />
                     </button>
                </div>
            </div>
             <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span class="text-sm text-gray-500 dark:text-gray-400">No. HP</span>
                <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900 dark:text-white">{{ customer?.phone || '-' }}</span>
                    <button v-if="customer?.phone" @click="copyToClipboard(customer.phone, 'phone')" class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                         <component :is="copiedId === 'phone' ? 'Check' : 'Copy'" class="w-3.5 h-3.5" :class="copiedId === 'phone' ? 'text-green-600' : ''" />
                    </button>
                </div>
            </div>
             <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span class="text-sm text-gray-500 dark:text-gray-400">Alamat</span>
                <span class="font-medium text-gray-900 dark:text-white text-right text-xs max-w-[200px]">{{ customer?.address || '-' }}</span>
            </div>
        </div>
    </div>
      <!-- Pengaturan Akun -->
    <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
         <h3 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Settings class="w-5 h-5 text-gray-600" />
            Pengaturan Akun
        </h3>
        <div class="space-y-1">
            <button @click="activateNotifications" class="w-full flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 rounded-lg transition-colors">
                <div class="flex items-center gap-3">
                    <div class="bg-orange-100 p-2 rounded-full text-orange-600">
                         <Bell class="w-4 h-4" />
                    </div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Aktifkan Notifikasi</span>
                </div>
                <ChevronRight class="w-4 h-4 text-gray-400" />
            </button>

            <button @click="showChangePasswordModal = true" class="w-full flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 rounded-lg transition-colors">
                <div class="flex items-center gap-3">
                    <div class="bg-blue-100 p-2 rounded-full text-blue-600">
                         <KeyRound class="w-4 h-4" />
                    </div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Ganti Password</span>
                </div>
                <ChevronRight class="w-4 h-4 text-gray-400" />
            </button>

            <button @click="logout" class="w-full flex justify-between items-center py-3 hover:bg-red-50 dark:hover:bg-red-900/10 px-2 rounded-lg transition-colors group">
                <div class="flex items-center gap-3">
                    <div class="bg-red-100 p-2 rounded-full text-red-600 group-hover:bg-red-200 transition-colors">
                         <LogOut class="w-4 h-4" />
                    </div>
                    <span class="text-sm font-medium text-red-600">Log Out</span>
                </div>
            </button>
        </div>
    </div>


    <!-- Bantuan & Dukungan -->
    <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
         <h3 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <HelpCircle class="w-5 h-5 text-teal-600" />
            Bantuan & Dukungan
        </h3>
        <div class="space-y-1">
            <button type="button" @click="showComingSoon('Panduan')" class="w-full flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 rounded-lg transition-colors">
                <div class="flex items-center gap-3">
                    <div class="bg-teal-100 p-2 rounded-full text-teal-600">
                         <FileText class="w-4 h-4" />
                    </div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Panduan</span>
                </div>
                <ChevronRight class="w-4 h-4 text-gray-400" />
            </button>

            <button type="button" @click="router.push({ name: 'WasteBankAbout' })" class="w-full flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 rounded-lg transition-colors">
                <div class="flex items-center gap-3">
                    <div class="bg-blue-100 p-2 rounded-full text-blue-600">
                         <Info class="w-4 h-4" />
                    </div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Tentang Kami</span>
                </div>
                <ChevronRight class="w-4 h-4 text-gray-400" />
            </button>

            <button type="button" @click="showComingSoon('Kebijakan Privasi')" class="w-full flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 rounded-lg transition-colors">
                 <div class="flex items-center gap-3">
                    <div class="bg-purple-100 p-2 rounded-full text-purple-600">
                         <Shield class="w-4 h-4" />
                    </div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Kebijakan Privasi</span>
                </div>
                <ChevronRight class="w-4 h-4 text-gray-400" />
            </button>
             <button type="button" @click="showComingSoon('Syarat & Ketentuan')" class="w-full flex justify-between items-center py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 rounded-lg transition-colors">
                 <div class="flex items-center gap-3">
                    <div class="bg-gray-100 p-2 rounded-full text-gray-600">
                         <FileText class="w-4 h-4" />
                    </div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Syarat & Ketentuan</span>
                </div>
                <ChevronRight class="w-4 h-4 text-gray-400" />
            </button>
        </div>
    </div>

  <!-- Password Modal -->
  <ChangePasswordModal
    :show="showChangePasswordModal"
    @close="showChangePasswordModal = false"
  />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { CreditCard, Copy, Check, User, Eye, EyeOff, Settings, Bell, ChevronRight, KeyRound, LogOut, HelpCircle, FileText, Info, Shield } from 'lucide-vue-next';
import Swal from 'sweetalert2';
import { confirmLogout } from '@/utils/confirmDialog';
import ChangePasswordModal from '@/components/ChangePasswordModal.vue';
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload.vue';

const props = defineProps({
  customer: Object
});

const router = useRouter();
const userStore = useUserStore();

const showNik = ref(false);
const copiedId = ref(null);
const showChangePasswordModal = ref(false);

const maskNik = (nik) => {
    if (!nik) return '-';
    return nik.replace(/.(?=.{4})/g, '*');
};

const copyToClipboard = async (text, id) => {
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        copiedId.value = id;
        setTimeout(() => copiedId.value = null, 2000);
    } catch (err) {
        console.error('Failed to copy', err);
    }
};

const logout = async () => {
  const ok = await confirmLogout();
  if (!ok) return;
  userStore.logout();
  router.push('/login');
};

const activateNotifications = async () => {
  // Placeholder logic since the real one uses global func
   Swal.fire({
        icon: 'info',
        title: 'Notifikasi',
        text: 'Fitur notifikasi sedang dalam pengembangan.',
    });
};

const showComingSoon = (featureName) => {
    Swal.fire({
        icon: 'info',
        title: featureName,
        text: 'Fitur ini akan segera tersedia.',
        confirmButtonColor: '#10B981'
    });
};

const onPhotoFeedback = (message, type = 'success') => {
    Swal.fire({
        icon: type === 'success' ? 'success' : 'error',
        title: type === 'success' ? 'Berhasil' : 'Gagal',
        text: message,
        timer: type === 'success' ? 2000 : undefined,
        showConfirmButton: type !== 'success',
        confirmButtonColor: '#10B981',
    });
};
</script>
