<template>
  <div class="mobile-gutter py-4 md:p-8 bg-gray-50 dark:bg-gray-950 transition-colors overflow-x-hidden">
    <!-- Page Header -->
    <div class="flex items-start sm:items-center justify-between gap-3 mb-5 sm:mb-6">
      <h1 class="hidden md:block text-2xl font-bold text-gray-900 dark:text-white">👥 Manajemen Nasabah</h1>
      <router-link
        to="/admin/dashboard"
        class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white inline-flex items-center gap-2"
      >
        <span class="sm:hidden">← Dashboard</span>
        <span class="hidden sm:inline">← Kembali ke Dashboard</span>
      </router-link>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-col gap-3 mb-6">
      <input
        v-model="searchQuery"
        @input="debouncedSearch"
        type="search"
        placeholder="Cari nama atau nomor rekening..."
        class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      />

      <!-- Tipe nasabah: pill buttons (hindari native select di mobile) -->
      <div class="flex rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 gap-1">
        <button
          v-for="opt in customerTypeOptions"
          :key="opt.value"
          type="button"
          @click="setCustomerTypeFilter(opt.value)"
          class="flex-1 px-2 py-2 text-xs sm:text-sm rounded-lg font-medium transition-colors"
          :class="filters.customerType === opt.value
            ? 'bg-green-600 text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          {{ opt.label }}
        </button>
      </div>

      <!-- RT / RW custom dropdown -->
      <div class="grid grid-cols-2 gap-2">
        <div class="relative" ref="rtDropdownRef">
          <button
            type="button"
            @click.stop="toggleRtDropdown"
            class="w-full flex items-center justify-between gap-2 px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
          >
            <span class="truncate">{{ filters.rt ? `RT ${filters.rt}` : 'Semua RT' }}</span>
            <ChevronDown class="w-4 h-4 shrink-0 text-gray-400" :class="{ 'rotate-180': showRtDropdown }" />
          </button>
          <div
            v-if="showRtDropdown"
            class="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-52 overflow-y-auto"
          >
            <button
              type="button"
              @click="selectRt('')"
              class="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              :class="!filters.rt ? 'text-green-600 font-semibold' : 'text-gray-700 dark:text-gray-200'"
            >
              Semua RT
            </button>
            <button
              v-for="rt in rtOptions"
              :key="rt"
              type="button"
              @click="selectRt(rt)"
              class="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 border-t border-gray-100 dark:border-gray-800"
              :class="filters.rt === rt ? 'text-green-600 font-semibold' : 'text-gray-700 dark:text-gray-200'"
            >
              RT {{ rt }}
            </button>
          </div>
        </div>

        <div class="relative" ref="rwDropdownRef">
          <button
            type="button"
            @click.stop="toggleRwDropdown"
            class="w-full flex items-center justify-between gap-2 px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
          >
            <span class="truncate">{{ filters.rw ? `RW ${filters.rw}` : 'Semua RW' }}</span>
            <ChevronDown class="w-4 h-4 shrink-0 text-gray-400" :class="{ 'rotate-180': showRwDropdown }" />
          </button>
          <div
            v-if="showRwDropdown"
            class="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-52 overflow-y-auto"
          >
            <button
              type="button"
              @click="selectRw('')"
              class="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              :class="!filters.rw ? 'text-green-600 font-semibold' : 'text-gray-700 dark:text-gray-200'"
            >
              Semua RW
            </button>
            <button
              v-for="rw in rwOptions"
              :key="rw"
              type="button"
              @click="selectRw(rw)"
              class="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 border-t border-gray-100 dark:border-gray-800"
              :class="filters.rw === rw ? 'text-green-600 font-semibold' : 'text-gray-700 dark:text-gray-200'"
            >
              RW {{ rw }}
            </button>
          </div>
        </div>
      </div>

      <button
        @click="openAddModal"
        class="w-full sm:w-auto sm:self-end bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        <Plus class="w-4 h-4" />
        Tambah Nasabah
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      <p class="mt-4 text-gray-600 dark:text-gray-400">Memuat data nasabah...</p>
    </div>

    <!-- Customers Table -->
    <div v-else class="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden max-w-full">
      <!-- Mobile: kartu nasabah -->
      <div class="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
        <div v-if="customers.length === 0" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
          Belum ada nasabah
        </div>
        <article
          v-for="(customer, index) in customers"
          :key="customer._id"
          class="p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span class="text-[10px] font-medium text-gray-400">#{{ (pagination.currentPage - 1) * 20 + index + 1 }}</span>
                <span v-if="customer.customerType === 'GROUP'" class="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 px-1.5 py-0.5 rounded">Kelompok</span>
                <span
                  v-if="customer.locality === 'EXTERNAL' || (customer.dataSource === 'MANUAL_ENTRY' && !customer.locality)"
                  class="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded"
                >Eksternal</span>
                <span v-else class="text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-1.5 py-0.5 rounded">Internal</span>
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-white break-words leading-snug">{{ customer.name }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">{{ customer.accountNumber }}</p>
              <p v-if="customer.customerType === 'GROUP' && customer.groupDetails?.picName" class="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">
                PIC: {{ customer.groupDetails.picName }}
              </p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Saldo</p>
              <p class="text-sm font-bold text-green-600 dark:text-green-400 leading-tight">{{ formatCurrency(customer.balance) }}</p>
            </div>
          </div>
          <div class="flex items-center justify-end gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button @click="viewDetail(customer)" class="text-blue-600 dark:text-blue-400 text-xs font-medium inline-flex items-center gap-1">
              <Eye class="w-4 h-4" /> Detail
            </button>
            <button @click="viewTransactions(customer)" class="text-purple-600 dark:text-purple-400 text-xs font-medium inline-flex items-center gap-1">
              <FileText class="w-4 h-4" /> Mutasi
            </button>
            <button @click="openEditModal(customer)" class="text-yellow-600 dark:text-yellow-400 text-xs font-medium inline-flex items-center gap-1">
              <Pencil class="w-4 h-4" /> Edit
            </button>
            <button @click="confirmDelete(customer._id)" class="text-red-600 dark:text-red-400 text-xs font-medium inline-flex items-center gap-1">
              <Trash2 class="w-4 h-4" /> Hapus
            </button>
          </div>
        </article>
      </div>

      <!-- Desktop: tabel -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full table-fixed">
          <thead class="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 w-12">No.</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">No. Rekening</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Nama</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 hidden lg:table-cell">Alamat</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">No. HP</th>
              <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Saldo</th>
              <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="customers.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                Belum ada nasabah
              </td>
            </tr>
            <tr
              v-for="(customer, index) in customers"
              :key="customer._id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <td class="px-3 sm:px-4 py-3 text-sm text-center text-gray-500 dark:text-gray-400">
                {{ (pagination.currentPage - 1) * 20 + index + 1 }}
              </td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white hidden sm:table-cell">
                <span class="font-mono">{{ customer.accountNumber }}</span>
              </td>
              <td class="px-3 sm:px-4 py-3 text-sm">
                <div class="flex flex-col gap-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span v-if="customer.customerType === 'GROUP'" class="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 px-2 py-0.5 rounded shrink-0">
                      Kelompok
                    </span>
                    <span
                      v-if="customer.locality === 'EXTERNAL' || (customer.dataSource === 'MANUAL_ENTRY' && !customer.locality)"
                      class="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded shrink-0"
                      title="Nasabah eksternal (Luar RW 09)"
                    >
                      Eksternal
                    </span>
                    <span
                      v-else
                      class="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded shrink-0"
                      title="Nasabah Internal RW 09"
                    >
                      Internal
                    </span>
                    <span class="font-medium text-gray-900 dark:text-white break-words">{{ customer.name }}</span>
                  </div>
                  <div v-if="customer.customerType === 'GROUP' && customer.groupDetails?.picName" class="text-xs text-gray-500 dark:text-gray-400 break-words">
                    PIC: {{ customer.groupDetails.picName }} ({{ customer.groupDetails.picRole || 'Ketua' }})
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">{{ formatAddress(customer) }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">{{ customer.phone || '-' }}</td>
              <td class="px-3 sm:px-4 py-3 text-sm text-right font-semibold text-green-600 dark:text-green-400">
                {{ formatCurrency(customer.balance) }}
              </td>
              <td class="px-3 sm:px-4 py-3 text-sm">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="viewDetail(customer)"
                    class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                    title="Detail"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    @click="viewTransactions(customer)"
                    class="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                    title="Lihat Mutasi"
                  >
                    <FileText class="w-4 h-4" />
                  </button>
                  <button
                    @click="openEditModal(customer)"
                    class="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                    title="Edit"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    @click="confirmDelete(customer._id)"
                    class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                    title="Hapus"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Total: {{ pagination.totalCustomers }} nasabah
        </p>
        <div class="flex gap-2">
          <button
            @click="changePage(pagination.currentPage - 1)"
            :disabled="pagination.currentPage <= 1"
            class="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span class="px-3 py-1 text-sm">{{ pagination.currentPage }} / {{ pagination.totalPages }}</span>
          <button
            @click="changePage(pagination.currentPage + 1)"
            :disabled="pagination.currentPage >= pagination.totalPages"
            class="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <CustomerRegistrationModal />

    <CustomerDetailModal />
  </div>
</template>

<script setup>
import { provide } from 'vue';
import { Plus, Eye, Pencil, Trash2, FileText, ChevronDown } from 'lucide-vue-next';
import CustomerRegistrationModal from './customer-components/CustomerRegistrationModal.vue';
import CustomerDetailModal from './customer-components/CustomerDetailModal.vue';
import { wasteBankCustomerContextKey } from './customer-components/customerContext';
import { useWasteBankCustomers } from './composables/useWasteBankCustomers';

const customerContext = useWasteBankCustomers();
const {
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
} = customerContext;

provide(wasteBankCustomerContextKey, customerContext);
</script>
