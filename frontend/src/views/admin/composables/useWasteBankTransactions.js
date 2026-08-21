import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import bankService from '@/services/bankService';
import Swal from 'sweetalert2';
import { confirmSave } from '@/utils/confirmDialog';
import { useTransactionReceipt } from './useTransactionReceipt';

export function useWasteBankTransactions() {
  // State
  const customers = ref([]);
  const availableItems = ref([]);
  const collectors = ref([]);   // Master data pengepul
  const transactions = ref([]);
  const saving = ref(false);
  const currentMarkup = ref(10);
  const selectedTransaction = ref(null);
  const showDetailModal = ref(false);
  const showVoidModal = ref(false);
  const voidReasonInput = ref('');
  const isVoiding = ref(false);

  // Customer autocomplete state
  const customerInputRef = ref(null);
  const customerSearchQuery = ref('');
  const customerResults = ref([]);
  const isSearchingCustomer = ref(false);
  const showCustomerDropdown = ref(false);
  const selectedCustomer = ref(null);

  // Item autocomplete refs (per item row)
  const itemInputRefs = ref([]);

  const form = ref({
    customerId: '',
    transactionDate: new Date().toLocaleDateString('sv').slice(0, 16).replace(' ', 'T'),
    items: [],
    paymentMethod: 'SAVINGS',
    notes: '',
    collectorId: '',   // ID pengepul terstruktur
  });

  const isCollectorLocked = ref(false); // tidak lagi dipakai, tapi dipertahankan untuk compat

  // Computed
  const totalWeight = computed(() => {
    return form.value.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
  });

  const totalPelapakValue = computed(() => {
    return form.value.items.reduce((sum, item) => sum + (item.pelapakPrice * item.weight || 0), 0);
  });

  const totalMarkup = computed(() => {
    return totalPelapakValue.value * (currentMarkup.value / 100);
  });

  const totalCustomerValue = computed(() => {
    return totalPelapakValue.value - totalMarkup.value;
  });

  // Methods
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const formatWeight = (value) => {
    return parseFloat(value || 0).toFixed(2);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('id-ID').format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const addItem = () => {
    form.value.items.push({
      itemId: '',
      weight: 0,
      pelapakPrice: 0,
      customerPrice: 0,
      subtotal: 0,
      // Autocomplete state for this item
      searchQuery: '',
      searchResults: [],
      isSearching: false,
      showDropdown: false,
      selectedItem: null
    });
  };

  const removeItem = (index) => {
    form.value.items.splice(index, 1);
  };

  const onItemSelected = (index) => {
    const selectedItem = availableItems.value.find(i => i._id === form.value.items[index].itemId);
    if (selectedItem) {
      form.value.items[index].pelapakPrice = selectedItem.pelapakPrice;
      calculateItem(index);
    }
  };

  const calculateItem = (index) => {
    const item = form.value.items[index];
    const pelapakValue = item.pelapakPrice * (item.weight || 0);
    const markupValue = pelapakValue * (currentMarkup.value / 100);
    item.customerPrice = item.pelapakPrice * (1 - currentMarkup.value / 100);
    item.subtotal = pelapakValue - markupValue;
  };

  const submitTransaction = async () => {
    if (form.value.items.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Data Kosong',
        text: 'Tambahkan minimal 1 item!',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    // Validate customer selected
    if (!form.value.customerId) {
      Swal.fire({
        icon: 'warning',
        title: 'Nasabah Belum Dipilih',
        text: 'Pilih nasabah terlebih dahulu!',
        confirmButtonColor: '#3b82f6'
      });
      console.error('❌ No customerId set. form.value:', form.value);
      return;
    }

    // Validate all items have itemId
    const invalidItems = form.value.items.filter(item => !item.itemId);
    if (invalidItems.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Item Tidak Valid',
        text: 'Semua item harus dipilih dari dropdown!',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    const ok = await confirmSave('menyimpan transaksi bank sampah');
    if (!ok) return;

    saving.value = true;
    try {
      const payload = {
        customerId: form.value.customerId,
        // Use current time in UTC ISO format to prevent timezone offset issues
        transactionDate: new Date().toISOString(),
        items: form.value.items.map(item => ({
          itemId: item.itemId,
          weight: parseFloat(item.weight)
        })),
        paymentMethod: form.value.paymentMethod,
        collectorId: form.value.collectorId || undefined, // Kirim collectorId terstruktur
        notes: form.value.notes || undefined
      };

      console.log('📤 Sending payload:', payload);
      await bankService.createTransaction(payload);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Transaksi berhasil disimpan!',
        timer: 2000,
        showConfirmButton: false
      });

      // Reset form
      form.value = {
        customerId: '',
        transactionDate: new Date().toISOString().split('T')[0],
        items: [],
        paymentMethod: 'SAVINGS',
        notes: '',
        collectorId: form.value.collectorId // Keep existing collector
      };

      // Reset customer autocomplete
      customerSearchQuery.value = '';
      selectedCustomer.value = null;

      fetchTransactions();
      addItem(); // Add default item
    } catch (error) {
      console.error('❌ Error saving transaction:', error);
      console.error('Response:', error.response?.data);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: error.response?.data?.message || error.message,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      saving.value = false;
    }
  };

  // Customer autocomplete search
  let customerDebounceTimer = null;
  const debouncedCustomerSearch = () => {
    clearTimeout(customerDebounceTimer);
    customerDebounceTimer = setTimeout(() => {
      const query = customerSearchQuery.value;
      if (query && query.length >= 2) {
        showCustomerDropdown.value = true;
        searchCustomers(query);
      } else {
        customerResults.value = [];
      }
    }, 300);
  };

  const searchCustomers = async (query) => {
    if (!query || query.length < 2) {
      customerResults.value = [];
      return;
    }

    isSearchingCustomer.value = true;
    try {
      const response = await bankService.getCustomers({
        search: query,
        limit: 10
      });
      customerResults.value = response.data || [];
    } catch (error) {
      console.error('Error searching customers:', error);
      customerResults.value = [];
    } finally {
      isSearchingCustomer.value = false;
    }
  };

  const handleCustomerFocus = () => {
    showCustomerDropdown.value = true;
    if (customerSearchQuery.value && customerSearchQuery.value.length >= 2) {
      searchCustomers(customerSearchQuery.value);
    }
  };

  const selectCustomer = (customer) => {
    selectedCustomer.value = customer;
    form.value.customerId = customer._id;
    customerSearchQuery.value = customer.name;
    showCustomerDropdown.value = false;
    customerResults.value = [];
    console.log('✅ Customer selected:', customer.name, '| ID:', customer._id);
    console.log('📝 form.customerId set to:', form.value.customerId);
  };

  // Click outside handler
  const handleClickOutside = (event) => {
    if (customerInputRef.value && !customerInputRef.value.contains(event.target)) {
      showCustomerDropdown.value = false;
    }
  };

  // Item autocomplete search (per row)
  const itemDebounceTimers = {};
  const debouncedItemSearch = (index) => {
    clearTimeout(itemDebounceTimers[index]);
    itemDebounceTimers[index] = setTimeout(() => {
      filterItems(index);
    }, 150); // Faster debounce for client-side filter
  };

  const filterItems = (index) => {
    const query = form.value.items[index].searchQuery?.toLowerCase() || '';

    // Safety check: ensure availableItems is an array
    if (!Array.isArray(availableItems.value)) {
      form.value.items[index].searchResults = [];
      return;
    }

    if (!query) {
      // Show all items if no search query
      form.value.items[index].searchResults = availableItems.value;
    } else {
      // Client-side filter
      form.value.items[index].searchResults = availableItems.value.filter(item =>
        item.itemName.toLowerCase().includes(query) ||
        item.categoryName?.toLowerCase().includes(query)
      );
    }

    form.value.items[index].showDropdown = true;
  };

  const handleItemFocus = (index) => {
    console.log('🔍 Item focus triggered for row', index, '| Available items:', availableItems.value?.length);
    // Show ALL items on focus (searchable dropdown)
    if (Array.isArray(availableItems.value)) {
      form.value.items[index].searchResults = availableItems.value;
      form.value.items[index].showDropdown = true;
      console.log('✅ Dropdown should show', availableItems.value.length, 'items');
    } else {
      console.warn('⚠️ availableItems is not an array:', availableItems.value);
    }
  };

  const selectItem = (index, item) => {
    form.value.items[index].selectedItem = item;
    form.value.items[index].itemId = item._id;
    form.value.items[index].pelapakPrice = item.pelapakPrice;
    form.value.items[index].searchQuery = item.itemName;
    form.value.items[index].showDropdown = false;
    form.value.items[index].searchResults = [];
    calculateItem(index);
  };



  const openDetailModal = (trx) => {
    selectedTransaction.value = trx;
    showDetailModal.value = true;
  };

  const closeDetailModal = () => {
    showDetailModal.value = false;
    selectedTransaction.value = null;
  };

  const quickPrintReceipt = (trx) => {
    selectedTransaction.value = trx;
    // Use setTimeout to allow state update before generating if needed, usually sync
    generateReceiptPDF();
    // We don't clear selectedTransaction immediately so the PDF generates safely
    // or we could refactor generateReceiptPDF to accept an argument.
    // For now, setting selectedTransaction matches the existing function's dependency.
  };

  // PDF & WhatsApp Logic
  const { generateReceiptPDF } = useTransactionReceipt({
    selectedTransaction,
    formatCurrency,
    formatWeight,
    formatNumber,
    formatDate,
  });

  const sendToWhatsapp = () => {
    if (!selectedTransaction.value) return;
    const trx = selectedTransaction.value;

    // 1. Download PDF first for the admin
    generateReceiptPDF();

    // 2. Prepare Message
    const message = `Halo ${trx.customerName}, berikut adalah bukti transaksi Bank Sampah Anda dengan ID ${trx.transactionId} senilai ${formatCurrency(trx.totalValue)}. Silakan unduh bukti transaksi yang dilampirkan. Terima kasih!`;
    const encodedMsg = encodeURIComponent(message);

    // 3. Determine WhatsApp URL
    let waUrl = `https://web.whatsapp.com/send?text=${encodedMsg}`;

    // Check if we have a valid phone number from the populated customerId
    const phone = trx.customerId?.phone;
    if (phone) {
      // Format phone: 08xxx -> 628xxx, remove spaces/dashes
      let formattedPhone = phone.replace(/\D/g, ''); // Remove non-digits
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.slice(1);
      }
      if (formattedPhone.startsWith('62')) {
        // Use wa.me for direct chat
        waUrl = `https://wa.me/${formattedPhone}?text=${encodedMsg}`;
      }
    }

    window.open(waUrl, '_blank');
  };

  const promptVoidTransaction = () => {
    if (!selectedTransaction.value) return;
    voidReasonInput.value = '';
    showVoidModal.value = true;
  };

  const confirmVoidTransaction = async () => {
    if (!selectedTransaction.value || !voidReasonInput.value.trim()) return;

    const trx = selectedTransaction.value;
    isVoiding.value = true;

    try {
      await bankService.voidTransaction(trx._id, voidReasonInput.value.trim());
      showVoidModal.value = false;
      closeDetailModal();
      fetchTransactions();
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Transaksi berhasil dibatalkan.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error voiding transaction:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: error.response?.data?.message || 'Gagal membatalkan transaksi',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      isVoiding.value = false;
    }
  };

  const duplicateVoidedToForm = () => {
    if (!selectedTransaction.value) return;
    const trx = selectedTransaction.value;

    // Assign customer
    customerSearchQuery.value = trx.customerAccountNumber || trx.customerName; // For display only

    // Karena kita butuh datanya lengkap (termasuk .user._id dll, kita set minimal yg dibutuhkan form)
    selectedCustomer.value = {
       _id: trx.customerId._id || trx.customerId, // Handle if it's an object or string
       name: trx.customerName,
       accountNumber: trx.customerAccountNumber
    };
    form.value.customerId = trx.customerId._id || trx.customerId;

    // Assign collector
    form.value.collectorId = trx.collectorId || '';
    onCollectorChange(); // Re-fetch prices based on collector if any

    // Assign Payment Method & Notes
    form.value.paymentMethod = trx.paymentMethod || 'SAVINGS';
    form.value.notes = (trx.notes || '') + (trx.notes ? ' | ' : '') + 'Revisi dari ' + trx.transactionId;

    // Assign Items
    form.value.items = trx.items.map(item => ({
      itemId: item.itemId,
      weight: item.weight,
      pelapakPrice: item.pelapakPrice,
      customerPrice: item.customerPrice,
      subtotal: item.subtotal,
      // Autocomplete state helper
      searchQuery: item.itemName,
      searchResults: [],
      isSearching: false,
      showDropdown: false,
      selectedItem: {
         _id: item.itemId,
         itemName: item.itemName,
         pelapakPrice: item.pelapakPrice
      }
    }));

    closeDetailModal();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchCustomers = async () => {
    try {
      const response = await bankService.getCustomers({ limit: 1000 });
      // Backend sends: { data: [...customers], pagination }
      customers.value = response.data || [];
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchItems = async (collectorId) => {
    try {
      const params = { limit: 1000 };
      if (collectorId) params.collectorId = collectorId;
      const response = await bankService.getItems(params);
      availableItems.value = (response.data.items || []).map(item => ({
        ...item,
        // Gunakan effectivePrice jika ada (harga pengepul), fallback ke pelapakPrice
        pelapakPrice: item.effectivePrice ?? item.pelapakPrice,
      }));
      console.log('✅ Items loaded:', availableItems.value.length, 'items | collectorId:', collectorId || 'none');
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchCollectors = async () => {
    try {
      const response = await bankService.getCollectors({ active: true });
      collectors.value = response.data || [];
    } catch (error) {
      console.error('Error fetching collectors:', error);
    }
  };

  // Saat pengepul dipilih → reload items dengan harga pengepul, recalculate subtotal
  const onCollectorChange = async () => {
    const collectorId = form.value.collectorId;
    await fetchItems(collectorId || undefined);
    // Re-calculate semua item yang sudah dipilih
    form.value.items.forEach((item, i) => {
      if (item.itemId) {
        const updated = availableItems.value.find(a => a._id === item.itemId);
        if (updated) {
          form.value.items[i].pelapakPrice = updated.pelapakPrice;
          calculateItem(i);
        }
      }
    });
  };

  const fetchTransactions = async () => {
    try {
      const response = await bankService.getTransactions({ limit: 10 });
      // Backend sends: { data: [...transactions], pagination }
      transactions.value = response.data || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await bankService.getSettings();
      currentMarkup.value = response.data.globalMarkupPercentage || 10;

      // Auto-select default collector jika ada
      if (response.data.defaultCollector) {
        // defaultCollector bisa berupa ID (jika sudah diupdate) atau string nama (legacy)
        // Cari dari daftar collectors yang sudah diload
        const found = collectors.value.find(
          c => c._id === response.data.defaultCollector || c.collectorName === response.data.defaultCollector
        );
        if (found) {
          form.value.collectorId = found._id;
          await fetchItems(found._id);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };


  onMounted(async () => {
    // Load collectors FIRST agar bisa match defaultCollector di fetchSettings
    await fetchCollectors();
    await fetchItems();
    fetchTransactions();
    fetchSettings();  // fetchSettings mungkin set collectorId dan reload items lagi
    addItem();
    document.addEventListener('click', handleClickOutside);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
  });

  return {
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
  };
}
