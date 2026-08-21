<template>
<!-- Detail Modal -->
<teleport to="body">
  <div
    v-if="selectedCustomer"
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
  >
    <div
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      @click="closeDetailModal"
    />

    <div
      class="relative bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92dvh] flex flex-col pointer-events-auto"
      @click.stop
    >
      <!-- Header -->
      <div class="shrink-0 px-4 pt-4 pb-3 sm:px-6 border-b border-gray-100 dark:border-gray-800">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Detail Nasabah</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">{{ selectedCustomer.name }}</p>
            <div class="flex flex-wrap items-center gap-1.5 mt-2">
              <span v-if="selectedCustomer.customerType === 'GROUP'" class="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                Kelompok
              </span>
              <span
                v-if="selectedCustomer.locality === 'EXTERNAL' || (selectedCustomer.dataSource === 'MANUAL_ENTRY' && !selectedCustomer.locality)"
                class="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium"
              >
                Eksternal
              </span>
              <span
                v-else
                class="text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full font-medium"
              >
                Internal
              </span>
              <span
                :class="selectedCustomer.isActive
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'"
                class="text-[10px] px-2 py-0.5 rounded-full font-medium"
              >
                {{ selectedCustomer.isActive ? 'Aktif' : 'Tidak Aktif' }}
              </span>
            </div>
          </div>
          <button
            type="button"
            @click="closeDetailModal"
            class="p-2 -mr-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-full bg-gray-100 dark:bg-gray-800 shrink-0"
            aria-label="Tutup"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        <!-- Read-Only View -->
        <template v-if="!isEditingInfo">
          <div class="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 p-4 mb-4 text-center">
            <p class="text-xs uppercase tracking-wide text-green-700/70 dark:text-green-400/70 font-medium mb-1">Saldo Tabungan</p>
            <p class="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 leading-tight">
              {{ formatCurrency(selectedCustomer.balance) }}
            </p>
          </div>

          <dl class="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            <div class="px-4 py-3">
              <dt class="text-xs text-gray-500 dark:text-gray-400 mb-0.5">No. Rekening</dt>
              <dd class="font-mono font-semibold text-gray-900 dark:text-white break-all">{{ selectedCustomer.accountNumber }}</dd>
            </div>
            <div class="px-4 py-3">
              <dt class="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Nama</dt>
              <dd class="font-semibold text-gray-900 dark:text-white break-words">{{ selectedCustomer.name }}</dd>
            </div>
            <div class="px-4 py-3">
              <dt class="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Alamat</dt>
              <dd class="text-sm text-gray-900 dark:text-white break-words leading-relaxed">{{ formatAddress(selectedCustomer) }}</dd>
            </div>
            <div class="px-4 py-3">
              <dt class="text-xs text-gray-500 dark:text-gray-400 mb-0.5">No. HP</dt>
              <dd class="font-semibold text-gray-900 dark:text-white">{{ selectedCustomer.phone || '-' }}</dd>
            </div>
            <div v-if="selectedCustomer.customerType === 'GROUP' && selectedCustomer.groupDetails?.picName" class="px-4 py-3">
              <dt class="text-xs text-gray-500 dark:text-gray-400 mb-0.5">PIC</dt>
              <dd class="text-sm text-gray-900 dark:text-white break-words">
                {{ selectedCustomer.groupDetails.picName }}
                <span v-if="selectedCustomer.groupDetails.picRole" class="text-gray-500">({{ selectedCustomer.groupDetails.picRole }})</span>
              </dd>
            </div>
          </dl>
        </template>

        <!-- Edit Form View -->
        <div v-else class="space-y-4">
          <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h4 class="text-sm font-bold text-gray-900 dark:text-white mb-3">Lokasi Kelompok</h4>

            <div class="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">RT *</label>
                <input
                  v-model="editForm.rt"
                  type="text"
                  required
                  placeholder="001"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">RW *</label>
                <input
                  v-model="editForm.rw"
                  type="text"
                  required
                  placeholder="005"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Alamat</label>
              <textarea
                v-model="editForm.address"
                rows="2"
                placeholder="Alamat lengkap sekretariat..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Kelurahan</label>
                <input
                  v-model="editForm.kelurahan"
                  type="text"
                  placeholder="Contoh: Baktijaya"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Kecamatan</label>
                <input
                  v-model="editForm.kecamatan"
                  type="text"
                  placeholder="Contoh: Sukmajaya"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">No. HP PIC *</label>
              <input
                v-model="editForm.phone"
                type="tel"
                required
                placeholder="0812..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        <!-- Akun Login -->
        <div v-if="selectedCustomer.userId" class="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h4 class="text-sm font-bold text-gray-900 dark:text-white mb-3">Akun Login</h4>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Username</p>
              <p class="font-semibold text-gray-900 dark:text-white font-mono break-all">{{ selectedCustomer.userId.username }}</p>
            </div>
            <button
              v-if="!showPasswordForm"
              type="button"
              @click="showPasswordForm = true"
              class="w-full sm:w-auto px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
            >
              Ubah Password
            </button>
          </div>

          <div v-if="showPasswordForm" class="bg-gray-50 dark:bg-gray-800/80 p-4 rounded-lg space-y-3">
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Password Baru Admin</label>
            <input
              v-model="newPassword"
              type="text"
              placeholder="Min. 6 karakter"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 dark:text-white"
            />
            <div class="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                @click="handleChangePassword"
                :disabled="changingPassword || !newPassword"
                class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {{ changingPassword ? 'Menyimpan...' : 'Simpan Password' }}
              </button>
              <button
                type="button"
                @click="showPasswordForm = false; newPassword = ''"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Batal
              </button>
            </div>
          </div>
        </div>

        <div v-else class="mt-4">
          <div v-if="!showLinkAccountForm" class="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4">
            <p class="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
              Nasabah ini belum ditautkan ke akun login.
            </p>
            <button
              type="button"
              @click="showLinkAccountForm = true"
              class="mt-3 w-full sm:w-auto px-4 py-2.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              Buat Akun Login
            </button>
          </div>

          <div v-else class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 p-4">
            <h4 class="text-sm font-bold text-gray-900 dark:text-white mb-3">Buat Akun Baru</h4>
            <div class="space-y-3">
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Username</label>
                <input
                  v-model="linkAccountData.username"
                  type="text"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 dark:text-white"
                  placeholder="Contoh: nasabah01"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Password</label>
                <input
                  v-model="linkAccountData.password"
                  type="text"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 dark:text-white"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div class="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  @click="handleLinkAccount"
                  :disabled="linkingAccount || !linkAccountData.username || !linkAccountData.password"
                  class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {{ linkingAccount ? 'Memproses...' : 'Buat Akun' }}
                </button>
                <button
                  type="button"
                  @click="showLinkAccountForm = false; linkAccountData = { username: '', password: '' }"
                  class="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="editInfoError" class="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
          <p class="text-sm text-red-700 dark:text-red-300">{{ editInfoError }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="shrink-0 border-t border-gray-100 dark:border-gray-800 px-4 py-3 sm:px-6 pb-safe bg-white dark:bg-gray-900">
        <div v-if="isEditingInfo" class="flex flex-col-reverse sm:flex-row gap-2">
          <button
            type="button"
            @click="cancelEditInfo"
            class="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Batal
          </button>
          <button
            type="button"
            @click="saveCustomerInfo"
            :disabled="savingInfo"
            class="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold disabled:opacity-50"
          >
            {{ savingInfo ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
        <div v-else class="flex flex-col-reverse sm:flex-row gap-2">
          <button
            type="button"
            @click="closeDetailModal"
            class="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-100 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Tutup
          </button>
          <button
            type="button"
            @click="startEditInfo"
            class="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold inline-flex items-center justify-center gap-2"
          >
            <Pencil class="w-4 h-4" />
            Edit Informasi
          </button>
        </div>
      </div>
    </div>
  </div>
</teleport>

</template>

<script setup>
import { inject } from 'vue';
import { Eye, FileText, Pencil, Plus, Trash2, X } from 'lucide-vue-next';
import { wasteBankCustomerContextKey } from './customerContext';

const {
  router,
  customers,
  loading,
  showModal,
  isEditing,
  selectedCustomer,
  saving,
  showPasswordForm,
  newPassword,
  changingPassword,
  showLinkAccountForm,
  linkAccountData,
  linkingAccount,
  isEditingInfo,
  editForm,
  savingInfo,
  editInfoError,
  searchQuery,
  pagination,
  filters,
  customerTypeOptions,
  showRtDropdown,
  showRwDropdown,
  rtDropdownRef,
  rwDropdownRef,
  closeFilterDropdowns,
  toggleRtDropdown,
  toggleRwDropdown,
  setCustomerTypeFilter,
  selectRt,
  selectRw,
  handlePageClickOutside,
  rtOptions,
  rwOptions,
  form,
  searchResults,
  isSearching,
  showDropdown,
  nameInputRef,
  customerType,
  dataSource,
  locality,
  groupForm,
  nikSearchQuery,
  nikSuggestions,
  nikSearchLoading,
  formatCurrency,
  formatAddress,
  debouncedSearch,
  debouncedHouseholdSearch,
  searchHouseholds,
  formatHouseholdAddress,
  handleChangePassword,
  handleLinkAccount,
  startEditInfo,
  cancelEditInfo,
  saveCustomerInfo,
  onNikSearch,
  selectNik,
  selectHousehold,
  handleFocus,
  handleClickOutside,
  fetchCustomers,
  openAddModal,
  openEditModal,
  handleSubmit,
  viewDetail,
  closeDetailModal,
  viewTransactions,
  confirmDelete,
  changePage
} = inject(wasteBankCustomerContextKey);
</script>
