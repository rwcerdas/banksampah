<template>
  <div class="bg-gray-50 dark:bg-gray-950 overflow-x-hidden pb-nav-mobile md:px-6 md:py-6 transition-colors">
    <div class="px-3 md:px-0 flex justify-between items-center py-3 md:py-0 md:mb-6">
      <h1 class="hidden md:flex text-2xl font-bold text-gray-900 dark:text-white items-center">
        <Scale class="w-8 h-8 mr-3 text-green-600" />
        Transaksi Penimbangan
      </h1>
      <router-link to="/admin/dashboard" class="text-sm text-blue-600 hover:underline">
        ← Dashboard
      </router-link>
    </div>

    <!-- Transaction Form -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-6">
      <div class="section-card lg:col-span-2 lg:rounded-xl">
        <h2 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">Form Transaksi Baru</h2>

        <form @submit.prevent="submitTransaction">
          <!-- Customer & Date -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div class="relative">
              <label class="block text-sm font-medium mb-1 dark:text-gray-300">Nasabah *</label>
              <input
                ref="customerInputRef"
                v-model="customerSearchQuery"
                @input="debouncedCustomerSearch"
                @focus="handleCustomerFocus"
                type="text"
                required
                :placeholder="selectedCustomer ? selectedCustomer.name : 'Ketik nama/nomor rekening nasabah...'"
                class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                autocomplete="off"
              />

              <!-- Customer Autocomplete Dropdown -->
              <div
                v-if="showCustomerDropdown && (customerResults.length > 0 || isSearchingCustomer)"
                class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                <div v-if="isSearchingCustomer" class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  Mencari...
                </div>
                <button
                  v-for="customer in customerResults"
                  :key="customer._id"
                  type="button"
                  @click="selectCustomer(customer)"
                  class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ customer.accountNumber }} - {{ customer.name }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {{ customer.address || 'Alamat tidak tersedia' }} • Saldo: {{ formatCurrency(customer.balance || 0) }}
                  </div>
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 dark:text-gray-300">Tanggal</label>
              <div class="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm flex items-center">
                <Clock class="w-4 h-4 mr-2" />
                Otomatis saat disimpan
              </div>
            </div>
            <!-- Pengepul Field — Dropdown Terstruktur -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium mb-1 dark:text-gray-300">Pengepul (Opsional)</label>
              <select
                v-model="form.collectorId"
                @change="onCollectorChange"
                class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white transition-colors"
              >
                <option value="">-- Tanpa Pengepul --</option>
                <option v-for="c in collectors" :key="c._id" :value="c._id">
                  {{ c.collectorName }}
                </option>
              </select>
              <small class="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                Memilih pengepul akan menyesuaikan harga item secara otomatis.
                <router-link to="/admin/collectors" class="text-emerald-600 dark:text-emerald-400 hover:underline ml-1">
                  + Tambah Pengepul Baru
                </router-link>
              </small>
            </div>
          </div>

          <!-- Items Section -->
          <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-medium dark:text-gray-300">Item Sampah *</label>
              <button
                type="button"
                @click="addItem"
                class="text-sm text-green-600 hover:text-green-800 font-semibold"
              >
                + Tambah Item
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="(item, index) in form.items"
                :key="index"
                class="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 dark:bg-gray-800 rounded border relative"
              >
                <div class="col-span-12 md:col-span-5 relative">
                  <label class="text-xs text-gray-600 dark:text-gray-400">Item</label>
                  <input
                    :ref="el => itemInputRefs[index] = el"
                    v-model="item.searchQuery"
                    @input="() => debouncedItemSearch(index)"
                    @focus="() => handleItemFocus(index)"
                    type="text"
                    required
                    :placeholder="item.selectedItem ? item.selectedItem.itemName : 'Ketik nama item...'"
                    class="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:text-white"
                    autocomplete="off"
                  />

                  <!-- Item Dropdown (Searchable) -->
                  <div
                    v-if="item.showDropdown && item.searchResults?.length > 0"
                    class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  >
                    <button
                      v-for="itm in item.searchResults"
                      :key="itm._id"
                      type="button"
                      @click="() => selectItem(index, itm)"
                      class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div class="font-medium text-sm text-gray-900 dark:text-white">
                        {{ itm.itemName }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ itm.categoryName }} • Rp {{ formatNumber(itm.pelapakPrice) }}/KG
                      </div>
                    </button>
                  </div>
                </div>
                <div class="col-span-6 md:col-span-3">
                  <label class="text-xs text-gray-600 dark:text-gray-400">Berat (KG) *</label>
                  <input
                    v-model.number="item.weight"
                    @input="calculateItem(index)"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    class="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div class="col-span-5 md:col-span-3">
                  <label class="text-xs text-gray-600 dark:text-gray-400">Subtotal</label>
                  <input
                    :value="formatCurrency(item.subtotal || 0)"
                    disabled
                    class="w-full px-2 py-1 text-sm border rounded bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                  />
                </div>
                <div class="col-span-1">
                  <button
                    type="button"
                    @click="removeItem(index)"
                    class="w-full text-red-600 hover:text-red-800"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Method -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2 dark:text-gray-300">Metode Pembayaran *</label>
            <div class="flex gap-4">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.paymentMethod"
                  type="radio"
                  value="CASH"
                  class="mr-2"
                />
                <span class="text-sm dark:text-gray-300 flex items-center">
                  <Banknote class="w-4 h-4 mr-2 text-green-600" />
                  TUNAI (Cash)
                </span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.paymentMethod"
                  type="radio"
                  value="SAVINGS"
                  class="mr-2"
                />
                <span class="text-sm dark:text-gray-300 flex items-center">
                  <PiggyBank class="w-4 h-4 mr-2 text-blue-600" />
                  TABUNGAN (Masuk Saldo)
                </span>
              </label>
            </div>
          </div>

          <!-- Notes -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1 dark:text-gray-300">Catatan (Opsional)</label>
            <textarea
              v-model="form.notes"
              rows="2"
              placeholder="Tambahkan catatan jika diperlukan..."
              class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
            ></textarea>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="saving || form.items.length === 0"
            class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ saving ? 'Memproses...' : 'Simpan Transaksi' }}
             <Check v-if="!saving" class="w-5 h-5 ml-2 inline-block" />
          </button>
        </form>
      </div>

      <!-- Summary Panel -->
      <div class="section-card lg:rounded-xl mt-4 lg:mt-0 h-fit">
        <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">Ringkasan</h3>
        <div class="space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Total Berat:</span>
            <span class="font-semibold dark:text-white">{{ formatWeight(totalWeight) }} Kg</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Harga Pelapak:</span>
            <span class="font-semibold dark:text-white">{{ formatCurrency(totalPelapakValue) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Potongan Kas ({{ currentMarkup }}%):</span>
            <span class="font-semibold text-red-600 dark:text-red-400">- {{ formatCurrency(totalMarkup) }}</span>
          </div>
          <div class="border-t dark:border-gray-700 pt-3">
            <div class="flex justify-between">
              <span class="font-bold text-gray-900 dark:text-white">Harga Nasabah:</span>
              <span class="text-xl font-bold text-green-600 dark:text-green-400">{{ formatCurrency(totalCustomerValue) }}</span>
            </div>
          </div>
          <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-700 text-xs">
            <p class="text-blue-800 dark:text-blue-300 flex items-start">
              <Lightbulb class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>
                <strong>{{ form.paymentMethod === 'SAVINGS' ? 'TABUNGAN' : 'TUNAI' }}:</strong>
                {{ form.paymentMethod === 'SAVINGS' ? 'Saldo nasabah akan bertambah' : 'Dibayar tunai langsung' }}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="section-card mt-4 md:mt-6 lg:rounded-xl">
      <h3 class="text-lg font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">Transaksi Terbaru</h3>
      <!-- Desktop Table View -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th class="px-3 py-2 text-left">ID</th>
              <th class="px-3 py-2 text-left">Tanggal</th>
              <th class="px-3 py-2 text-left">Nasabah</th>
              <th class="px-3 py-2 text-right">Berat (Kg)</th>
              <th class="px-3 py-2 text-right">Nilai</th>
              <th class="px-3 py-2 text-center">Metode</th>
              <th class="px-3 py-2 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="transactions.length === 0">
              <td colspan="7" class="px-3 py-4 text-center text-gray-500">Belum ada transaksi</td>
            </tr>
            <tr v-for="trx in transactions" :key="trx._id"
                :class="[
                  trx.status === 'VOIDED' ? 'bg-red-50/40 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                ]"
            >
              <td class="px-3 py-2 font-mono text-xs">
                <span :class="{'line-through text-gray-400': trx.status === 'VOIDED'}">{{ trx.transactionId }}</span>
                <span v-if="trx.status === 'VOIDED'" class="block mt-0.5 text-[9px] text-red-500 font-bold uppercase">BATAL</span>
              </td>
              <td class="px-3 py-2" :class="{'text-gray-400': trx.status === 'VOIDED'}">{{ formatDate(trx.transactionDate) }}</td>
              <td class="px-3 py-2" :class="{'text-gray-400 line-through': trx.status === 'VOIDED'}">{{ trx.customerName }}</td>
              <td class="px-3 py-2 text-right" :class="{'text-gray-400': trx.status === 'VOIDED'}">{{ trx.status === 'VOIDED' ? '0.00' : formatWeight(trx.totalWeight) }}</td>
              <td class="px-3 py-2 text-right font-semibold" :class="trx.status === 'VOIDED' ? 'text-gray-400 line-through' : 'text-green-600'">{{ formatCurrency(trx.totalValue) }}</td>
              <td class="px-3 py-2 text-center">
                <span v-if="trx.status !== 'VOIDED'"
                  :class="trx.paymentMethod === 'CASH' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'"
                  class="px-2 py-1 rounded-full text-xs font-medium">
                  {{ trx.paymentMethod === 'CASH' ? 'TUNAI' : 'TABUNGAN' }}
                </span>
                <span v-else class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">VOID</span>
              </td>
              <td class="px-3 py-2 text-center flex items-center justify-center gap-2">
                <button
                  @click="openDetailModal(trx)"
                  class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition text-gray-700 dark:text-gray-300 font-medium border border-gray-200 dark:border-gray-600"
                  title="Lihat Detail"
                >
                  Detail
                </button>
                <button
                  @click="quickPrintReceipt(trx)"
                  class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition text-gray-700 dark:text-gray-300 font-medium border border-gray-200 dark:border-gray-600 group"
                  title="Cetak Struk"
                >
                   <Printer class="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div class="block md:hidden divide-y divide-gray-200 dark:divide-gray-700 -mx-3 sm:mx-0">
        <div v-if="transactions.length === 0" class="text-center py-8 text-gray-500">
          Belum ada transaksi
        </div>
        <article
          v-for="trx in transactions"
          :key="trx._id"
          class="px-3 py-4 first:border-t-0"
        >
          <!-- Card Header: ID & Date -->
          <div class="flex justify-between items-start gap-3 mb-3">
            <div class="min-w-0 flex-1">
              <div class="text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate">{{ trx.transactionId }}</div>
              <div class="text-sm font-semibold text-gray-900 dark:text-white break-words mt-0.5">{{ trx.customerName }}</div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{{ formatDate(trx.transactionDate) }}</div>
              <span
                :class="trx.paymentMethod === 'CASH' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'"
                class="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
              >
                {{ trx.paymentMethod === 'CASH' ? 'TUNAI' : 'TABUNGAN' }}
              </span>
            </div>
          </div>

          <!-- Card Body: Stats -->
          <div class="grid grid-cols-2 gap-3 mb-3" :class="{ 'opacity-50': trx.status === 'VOIDED' }">
            <div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Total Berat</div>
              <div class="text-sm font-medium" :class="trx.status === 'VOIDED' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'">{{ formatWeight(trx.totalWeight) }} Kg</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-500 dark:text-gray-400">Total Nilai</div>
              <div class="text-sm font-bold" :class="trx.status === 'VOIDED' ? 'text-gray-400 line-through' : 'text-green-600 dark:text-green-400'">{{ formatCurrency(trx.totalValue) }}</div>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="flex gap-2">
            <button
              @click="openDetailModal(trx)"
              class="flex-1 text-sm py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-medium transition-colors"
            >
              Lihat Detail
            </button>
            <button
              @click="quickPrintReceipt(trx)"
              class="flex-none px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200 transition-colors"
              title="Cetak Struk"
            >
              <Printer class="w-4 h-4" />
            </button>
          </div>
        </article>
      </div>
    </div>

    <TransactionDetailModal />

    <TransactionVoidModal />

  </div>
</template>

<script setup>
import { provide } from 'vue';
import {
  Trash2, Printer, FileText, Scale, Clock, Lock, PiggyBank, Check, Info, Lightbulb, Copy
} from 'lucide-vue-next';
import TransactionDetailModal from './transaction-components/TransactionDetailModal.vue';
import TransactionVoidModal from './transaction-components/TransactionVoidModal.vue';
import { wasteBankTransactionContextKey } from './transaction-components/transactionContext';
import { useWasteBankTransactions } from './composables/useWasteBankTransactions';

const transactionContext = useWasteBankTransactions();
const {
  customers,
  availableItems,
  collectors,
  transactions,
  saving,
  currentMarkup,
  selectedTransaction,
  showDetailModal,
  showVoidModal,
  voidReasonInput,
  isVoiding,
  customerInputRef,
  customerSearchQuery,
  customerResults,
  isSearchingCustomer,
  showCustomerDropdown,
  selectedCustomer,
  itemInputRefs,
  form,
  isCollectorLocked,
  totalWeight,
  totalPelapakValue,
  totalMarkup,
  totalCustomerValue,
  formatCurrency,
  formatWeight,
  formatNumber,
  formatDate,
  addItem,
  removeItem,
  onItemSelected,
  calculateItem,
  submitTransaction,
  debouncedCustomerSearch,
  searchCustomers,
  handleCustomerFocus,
  selectCustomer,
  handleClickOutside,
  itemDebounceTimers,
  debouncedItemSearch,
  filterItems,
  handleItemFocus,
  selectItem,
  openDetailModal,
  closeDetailModal,
  quickPrintReceipt,
  sendToWhatsapp,
  promptVoidTransaction,
  confirmVoidTransaction,
  duplicateVoidedToForm,
  fetchCustomers,
  fetchItems,
  fetchCollectors,
  onCollectorChange,
  fetchTransactions,
  fetchSettings
} = transactionContext;

provide(wasteBankTransactionContextKey, transactionContext);
</script>
