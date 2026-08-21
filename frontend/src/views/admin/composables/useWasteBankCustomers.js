import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import * as bankService from '@/services/bankService';
import Swal from 'sweetalert2';
import { confirmSave } from '@/utils/confirmDialog';

export function useWasteBankCustomers() {
  const router = useRouter();

  // State
  const customers = ref([]);
  const loading = ref(false);
  const showModal = ref(false);
  const isEditing = ref(false);
  const selectedCustomer = ref(null);
  const saving = ref(false);
  const showPasswordForm = ref(false); // State for password form
  const newPassword = ref('');
  const changingPassword = ref(false);
  const showLinkAccountForm = ref(false); // State for link account form
  const linkAccountData = ref({ username: '', password: '' });
  const linkingAccount = ref(false);

  // Edit Info State
  const isEditingInfo = ref(false); // Toggle edit mode for address & phone
  const editForm = ref({
    address: '',
    phone: '',
    rt: '',
    rw: '',
    kelurahan: '',
    kecamatan: ''
  });
  const savingInfo = ref(false);
  const editInfoError = ref('');

  const searchQuery = ref('');
  const pagination = ref({
    currentPage: 1,
    totalPages: 1,
    totalCustomers: 0
  });

  const filters = ref({
    customerType: 'all',
    rt: '',
    rw: ''
  });

  const customerTypeOptions = [
    { value: 'all', label: 'Semua' },
    { value: 'INDIVIDUAL', label: 'Perorangan' },
    { value: 'GROUP', label: 'Kelompok' },
  ];

  const showRtDropdown = ref(false);
  const showRwDropdown = ref(false);
  const rtDropdownRef = ref(null);
  const rwDropdownRef = ref(null);

  const closeFilterDropdowns = () => {
    showRtDropdown.value = false;
    showRwDropdown.value = false;
  };

  const toggleRtDropdown = () => {
    showRwDropdown.value = false;
    showRtDropdown.value = !showRtDropdown.value;
  };

  const toggleRwDropdown = () => {
    showRtDropdown.value = false;
    showRwDropdown.value = !showRwDropdown.value;
  };

  const setCustomerTypeFilter = (value) => {
    filters.value.customerType = value;
    closeFilterDropdowns();
    fetchCustomers();
  };

  const selectRt = (rt) => {
    filters.value.rt = rt;
    closeFilterDropdowns();
    fetchCustomers();
  };

  const selectRw = (rw) => {
    filters.value.rw = rw;
    closeFilterDropdowns();
    fetchCustomers();
  };

  const handlePageClickOutside = (event) => {
    if (rtDropdownRef.value && !rtDropdownRef.value.contains(event.target)) {
      showRtDropdown.value = false;
    }
    if (rwDropdownRef.value && !rwDropdownRef.value.contains(event.target)) {
      showRwDropdown.value = false;
    }
    if (nameInputRef.value && !nameInputRef.value.contains(event.target)) {
      showDropdown.value = false;
    }
  };

  // RT & RW Options for dropdowns (Dynamic)
  const rtOptions = ref([]);
  const rwOptions = ref([]);

  const form = ref({
    accountNumber: '',
    name: '',
    address: '',
    rt: '',
    rw: '',
    phone: '',
    kelurahan: '',
    kecamatan: ''
  });

  // Autocomplete state
  const searchResults = ref([]);
  const isSearching = ref(false);
  const showDropdown = ref(false);
  const nameInputRef = ref(null);

  // Customer Type & Group Registration
  const customerType = ref('INDIVIDUAL'); // 'INDIVIDUAL' or 'GROUP'
  const dataSource = ref('HOUSEHOLD_DB'); // 'HOUSEHOLD_DB' or 'MANUAL_ENTRY'
  const locality = ref('INTERNAL'); // 'INTERNAL' or 'EXTERNAL'

  watch(dataSource, (newVal) => {
    if (newVal === 'HOUSEHOLD_DB') {
      locality.value = 'INTERNAL';
    } else {
      locality.value = 'EXTERNAL';
    }
  });
  const groupForm = ref({
    groupName: '',
    organizationType: 'OTHER',
    totalMembers: 0,
    picNik: '',
    picName: '',
    picRole: 'Ketua',
    picPhone: ''
  });

  // NIK Autocomplete for Group PIC
  const nikSearchQuery = ref('');
  const nikSuggestions = ref([]);
  const nikSearchLoading = ref(false);
  let nikSearchTimeout = null;

  // Methods
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const formatAddress = (customer) => {
    const parts = [customer.address, customer.rt && `RT ${customer.rt}`, customer.rw && `RW ${customer.rw}`];
    return parts.filter(Boolean).join(', ') || '-';
  };

  let debounceTimer = null;
  const debouncedSearch = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      fetchCustomers();
    }, 500);
  };

  // Household search for autocomplete
  let householdDebounceTimer = null;
  const debouncedHouseholdSearch = () => {
    clearTimeout(householdDebounceTimer);
    householdDebounceTimer = setTimeout(() => {
      const query = form.value.name;
      // Show dropdown if user is typing (2+ chars)
      if (query && query.length >= 2) {
        showDropdown.value = true;
      }
      searchHouseholds(query);
    }, 300);
  };

  const searchHouseholds = async (query) => {
    if (!query || query.length < 2) {
      searchResults.value = [];
      return;
    }

    isSearching.value = true;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/households/search?q=${encodeURIComponent(query)}&limit=8`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to search households');
      }

      const data = await response.json();
      const households = data.data || [];

      // 🆕 Flatten: Create individual entries for kepala keluarga + all members
      const flattened = [];

      for (const household of households) {
        // Add kepala keluarga
        flattened.push({
          type: 'kepala',
          name: household.kepala_keluarga,
          alamat: household.alamat,
          phone: household.no_handphone,
          household_id: household._id,
          no_kk: household.no_kk,
          nik: household.nik_kepala, // Capture NIK Head
          relationshipLabel: 'Kepala Keluarga'
        });

        // Add all active members
        if (household.members && Array.isArray(household.members)) {
          household.members
            .filter(m => m.status === 'Aktif' || !m.status) // Only active members
            .forEach(member => {
              flattened.push({
                type: 'member',
                name: member.nama_lengkap,
                alamat: household.alamat,
                phone: member.no_handphone || household.no_handphone, // Prioritize member's phone
                household_id: household._id,
                no_kk: household.no_kk,
                nik: member.nik, // Capture NIK
                kepala_keluarga: household.kepala_keluarga,
                relationshipLabel: member.hubungan_dengan_kk || 'Anggota Keluarga'
              });
            });
        }
      }

      searchResults.value = flattened;
    } catch (error) {
      console.error('Error searching households:', error);
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  };

  const formatHouseholdAddress = (person) => {
      return `${person.alamat?.alamat || ''} RT ${person.alamat?.rt || '-'} / RW ${person.alamat?.rw || '-'}`;
  };

  const handleChangePassword = async () => {
    if (!newPassword.value || newPassword.value.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Validasi',
        text: 'Password minimal 6 karakter',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    changingPassword.value = true;
    try {
      await bankService.changePassword(selectedCustomer.value._id, newPassword.value);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Password berhasil diubah!',
        timer: 2000,
        showConfirmButton: false
      });
      showPasswordForm.value = false;
      newPassword.value = '';
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal mengubah password: ' + (error.response?.data?.message || error.message),
        confirmButtonColor: '#ef4444'
      });
    } finally {
      changingPassword.value = false;
    }
  };

  const handleLinkAccount = async () => {
      if (!selectedCustomer.value) return;

      linkingAccount.value = true;
      try {
          await bankService.linkAccount(selectedCustomer.value._id, linkAccountData.value);
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: 'Akun berhasil dibuat dan ditautkan!',
            timer: 2000,
            showConfirmButton: false
          });

          // Refresh data
          showLinkAccountForm.value = false;
          linkAccountData.value = { username: '', password: '' };
          showModal.value = false;
          closeDetailModal();
          await fetchCustomers(); // Refresh list to see updates
      } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: 'Gagal menautkan akun: ' + (error.response?.data?.message || error.message),
            confirmButtonColor: '#ef4444'
          });
      } finally {
          linkingAccount.value = false;
      }
  };

  // Edit Info Functions
  const startEditInfo = () => {
    if (!selectedCustomer.value) return;
    editForm.value = {
      address: selectedCustomer.value.address || '',
      phone: selectedCustomer.value.phone || '',
      rt: selectedCustomer.value.rt || '',
      rw: selectedCustomer.value.rw || '',
      kelurahan: selectedCustomer.value.kelurahan || '',
      kecamatan: selectedCustomer.value.kecamatan || '',
      locality: selectedCustomer.value.locality || (selectedCustomer.value.dataSource === 'HOUSEHOLD_DB' ? 'INTERNAL' : 'EXTERNAL')
    };
    locality.value = editForm.value.locality;
    isEditingInfo.value = true;
    editInfoError.value = '';
  };

  const cancelEditInfo = () => {
    isEditingInfo.value = false;
    editForm.value = {
      address: '',
      phone: '',
      rt: '',
      rw: '',
      kelurahan: '',
      kecamatan: ''
    };
    editInfoError.value = '';
  };

  const saveCustomerInfo = async () => {
    if (!selectedCustomer.value) return;

    // Frontend Validation
    const phoneRegex = /^(08|628)\d{8,11}$/;
    if (editForm.value.phone && !phoneRegex.test(editForm.value.phone)) {
      editInfoError.value = 'Format nomor HP tidak valid. Gunakan format 08xxx atau 628xxx';
      return;
    }

    if (editForm.value.address && editForm.value.address.trim().length < 5) {
      editInfoError.value = 'Alamat minimal 5 karakter';
      return;
    }

    // Validate RT & RW
    if (!editForm.value.rt || !editForm.value.rw) {
      editInfoError.value = 'RT dan RW wajib diisi';
      return;
    }

    savingInfo.value = true;
    editInfoError.value = '';

    try {
      const updateData = {
        address: editForm.value.address.trim(),
        phone: editForm.value.phone,
        rt: editForm.value.rt,
        rw: editForm.value.rw,
        kelurahan: editForm.value.kelurahan || null,
        kecamatan: editForm.value.kecamatan || null,
        locality: locality.value
      };

      await bankService.updateCustomer(selectedCustomer.value._id, updateData);

      // Update local data
      selectedCustomer.value.address = editForm.value.address.trim();
      selectedCustomer.value.phone = editForm.value.phone;
      selectedCustomer.value.rt = editForm.value.rt;
      selectedCustomer.value.rw = editForm.value.rw;
      selectedCustomer.value.kelurahan = editForm.value.kelurahan;
      selectedCustomer.value.kecamatan = editForm.value.kecamatan;

      // Refresh customer list
      await fetchCustomers();

      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Informasi nasabah berhasil diperbarui!',
        timer: 2000,
        showConfirmButton: false
      });
      isEditingInfo.value = false;
    } catch (error) {
      editInfoError.value = error.response?.data?.message || 'Gagal menyimpan perubahan';
      console.error('Error updating customer info:', error);
    } finally {
      savingInfo.value = false;
    }
  };

  // NIK Autocomplete for Group PIC
  const onNikSearch = () => {
    console.log('[NIK Search] Input changed:', nikSearchQuery.value);
    clearTimeout(nikSearchTimeout);
    nikSearchTimeout = setTimeout(async () => {
      if (nikSearchQuery.value.length >= 3) {
        nikSearchLoading.value = true;
        try {
          console.log('[NIK Search] Calling API with query:', nikSearchQuery.value);
          const result = await bankService.searchNik(nikSearchQuery.value);
          console.log('[NIK Search] API Response:', result);
          nikSuggestions.value = result.data || [];
          console.log('[NIK Search] Suggestions set:', nikSuggestions.value);
        } catch (error) {
          console.error('[NIK Search] Error:', error);
          nikSuggestions.value = [];
        } finally {
          nikSearchLoading.value = false;
        }
      } else {
        console.log('[NIK Search] Query too short, clearing suggestions');
        nikSuggestions.value = [];
        nikSearchLoading.value = false;
      }
    }, 300); // 300ms debounce
  };

  const selectNik = (member) => {
    groupForm.value.picNik = member.nik;
    groupForm.value.picName = member.name;
    groupForm.value.picPhone = member.phone || '';
    nikSearchQuery.value = `${member.name} (${member.nik})`;
    nikSuggestions.value = [];
  };

  const selectHousehold = (person) => {
    form.value.name = person.name;
    form.value.address = person.alamat?.alamat || '';
    form.value.rt = person.alamat?.rt || '';
    form.value.rw = person.alamat?.rw || '';
    form.value.phone = person.phone || '';
    form.value.nik = person.nik; // Capture NIK for registration
    form.value.username = person.name.toLowerCase().replace(/\s+/g, '') + '123'; // Suggest username
    form.value.password = '123456'; // Default Suggestion

    // Close dropdown
    searchResults.value = [];
    showDropdown.value = false;
  };

  // Handle focus on name input
  const handleFocus = () => {
    showDropdown.value = true;
    // If there's already text, trigger search to show results
    if (form.value.name && form.value.name.length >= 2) {
      searchHouseholds(form.value.name);
    }
  };

  // Click outside handler to close dropdown
  const handleClickOutside = (event) => {
    handlePageClickOutside(event);
  };

  const fetchCustomers = async () => {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.currentPage,
        limit: 20,
        active: true // Fetch only active customers by default
      };
      if (searchQuery.value) {
        params.search = searchQuery.value;
      }
      if (filters.value.customerType) {
        params.customerType = filters.value.customerType;
      }
      if (filters.value.rt) {
        params.rt = filters.value.rt;
      }
      if (filters.value.rw) {
        params.rw = filters.value.rw;
      }
      const response = await bankService.getCustomers(params);

      // Backend sends: { success: true, data: [...customers], pagination: { total, page, pages } }
      customers.value = response.data || [];
      if (response.pagination) {
        pagination.value = {
          currentPage: response.pagination.page,
          totalPages: response.pagination.pages,
          totalCustomers: response.pagination.total
        };
      }
      // Populate dynamic filters if available
      if (response.filters) {
        rtOptions.value = response.filters.rts || [];
        rwOptions.value = response.filters.rws || [];
      }
      } catch (error) {
      console.error('Error fetching customers:', error);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Gagal memuat data nasabah',
        timer: 2000,
        showConfirmButton: false
      });
    } finally {
      loading.value = false;
    }
  };

  const openAddModal = () => {
    isEditing.value = false;
    customerType.value = 'INDIVIDUAL'; // Reset to individual
    dataSource.value = 'HOUSEHOLD_DB'; // Reset to internal
    form.value = {
      accountNumber: '',
      name: '',
      address: '',
      rt: '',
      rw: '',
      phone: '',
      kelurahan: '',
      kecamatan: ''
    };
    // Reset group form
    groupForm.value = {
      groupName: '',
      organizationType: 'OTHER',
      totalMembers: 0,
      picNik: '',
      picName: '',
      picRole: 'Ketua',
      picPhone: ''
    };
    // Reset NIK autocomplete
    nikSearchQuery.value = '';
    nikSuggestions.value = [];
    // Reset autocomplete
    searchResults.value = [];
    showDropdown.value = false;
    showModal.value = true;
  };

  const openEditModal = (customer) => {
    isEditing.value = true;
    form.value = {
      accountNumber: customer.accountNumber,
      name: customer.name,
      address: customer.address || '',
      rt: customer.rt || '',
      rw: customer.rw || '',
      phone: customer.phone || '',
      locality: customer.locality || (customer.dataSource === 'HOUSEHOLD_DB' ? 'INTERNAL' : 'EXTERNAL')
    };
    locality.value = form.value.locality;
    form.value._id = customer._id;
    // Reset autocomplete
    searchResults.value = [];
    showDropdown.value = false;
    showModal.value = true;
  };

  const handleSubmit = async () => {
    const label = isEditing.value ? 'memperbarui data nasabah' : 'mendaftarkan nasabah baru';
    const ok = await confirmSave(label);
    if (!ok) return;

    saving.value = true;
    try {
      if (isEditing.value) {
        const updatePayload = { ...form.value, locality: locality.value };
        await bankService.updateCustomer(form.value._id, updatePayload);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Nasabah berhasil diupdate!',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // NEW REGISTRATION

        // GROUP REGISTRATION
        if (customerType.value === 'GROUP') {
          // Validation based on dataSource
          if (dataSource.value === 'HOUSEHOLD_DB') {
            if (!groupForm.value.groupName || !groupForm.value.picNik) {
              Swal.fire({
                icon: 'warning',
                title: 'Data Tidak Lengkap',
                text: 'Nama kelompok dan NIK PIC wajib diisi!',
                confirmButtonColor: '#3b82f6'
              });
              saving.value = false;
              return;
            }
          } else {
            if (!groupForm.value.groupName || !groupForm.value.picName || !groupForm.value.picPhone) {
              Swal.fire({
                icon: 'warning',
                title: 'Data Tidak Lengkap',
                text: 'Nama kelompok, Nama PIC, dan No HP PIC wajib diisi!',
                confirmButtonColor: '#3b82f6'
              });
              saving.value = false;
              return;
            }
            if (!form.value.rw) {
              Swal.fire({
                icon: 'warning',
                title: 'Data Tidak Lengkap',
                text: 'RW wajib diisi!',
                confirmButtonColor: '#3b82f6'
              });
              saving.value = false;
              return;
            }
          }

          const payload = {
            customerType: 'GROUP',
            dataSource: dataSource.value,
            groupDetails: {
              groupName: groupForm.value.groupName,
              organizationType: groupForm.value.organizationType,
              totalMembers: groupForm.value.totalMembers || 0,
              picNik: groupForm.value.picNik,
              picName: groupForm.value.picName,
              picRole: groupForm.value.picRole || 'Ketua',
              picPhone: groupForm.value.picPhone
            },
            rt: form.value.rt,
            rw: form.value.rw,
            address: form.value.address,
            kelurahan: form.value.kelurahan,
            kecamatan: form.value.kecamatan,
            locality: locality.value
          };

          await bankService.registerNasabah(payload);
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: 'Nasabah Kelompok berhasil didaftarkan!',
            timer: 2000,
            showConfirmButton: false
          });
        }

        // INDIVIDUAL REGISTRATION
        else {
          // Internal customer validation
          if (dataSource.value === 'HOUSEHOLD_DB') {
            if (!form.value.username || !form.value.password) {
              Swal.fire({
                icon: 'warning',
                title: 'Data Tidak Lengkap',
                text: 'Username dan Password wajib diisi untuk pendaftaran baru!',
                confirmButtonColor: '#3b82f6'
              });
              saving.value = false;
              return;
            }

            const payload = {
              customerType: 'INDIVIDUAL',
              dataSource: 'HOUSEHOLD_DB',
              nik: form.value.nik,
              fullName: form.value.name,
              address: form.value.address,
              rt: form.value.rt,
              rw: form.value.rw,
              phone: form.value.phone,
              username: form.value.username,
              password: form.value.password,
              locality: 'INTERNAL' // HOUSEHOLD_DB is always internal
            };

            await bankService.registerNasabah(payload);
            Swal.fire({
              icon: 'success',
              title: 'Berhasil',
              text: 'Akun Nasabah berhasil didaftarkan & ditautkan!',
              timer: 2000,
              showConfirmButton: false
            });
          }
          // External customer (no user login)
          else {
            if (!form.value.name || !form.value.phone || !form.value.address || !form.value.rt || !form.value.rw) {
              Swal.fire({
                icon: 'warning',
                title: 'Data Tidak Lengkap',
                text: 'Nama, No HP, Alamat, RT, dan RW wajib diisi untuk nasabah eksternal!',
                confirmButtonColor: '#3b82f6'
              });
              saving.value = false;
              return;
            }

            const payload = {
              customerType: 'INDIVIDUAL',
              dataSource: 'MANUAL_ENTRY',
              nik: form.value.nik || null, // Optional
              fullName: form.value.name,
              address: form.value.address,
              rt: form.value.rt,
              rw: form.value.rw,
              phone: form.value.phone,
              kelurahan: form.value.kelurahan,
              kecamatan: form.value.kecamatan,
              locality: locality.value
            };

            await bankService.registerNasabah(payload);
            Swal.fire({
              icon: 'success',
              title: 'Berhasil',
              text: 'Nasabah eksternal berhasil didaftarkan!',
              timer: 2000,
              showConfirmButton: false
            });
          }
        }
      }
      showModal.value = false;
      fetchCustomers();
      } catch (error) {
      console.error('Error saving customer:', error);
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

  const viewDetail = (customer) => {
    selectedCustomer.value = customer;
    showPasswordForm.value = false;
    showLinkAccountForm.value = false;
    isEditingInfo.value = false;
    editInfoError.value = '';
  };

  const closeDetailModal = () => {
    selectedCustomer.value = null;
    showPasswordForm.value = false;
    showLinkAccountForm.value = false;
    isEditingInfo.value = false;
    editInfoError.value = '';
    newPassword.value = '';
    linkAccountData.value = { username: '', password: '' };
  };

  const viewTransactions = (customer) => {
    router.push({ name: 'CustomerTransactionHistory', params: { id: customer._id } });
  };

  const confirmDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Nasabah?',
      text: "Tindakan ini tidak dapat dibatalkan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      await bankService.deleteCustomer(id);
      Swal.fire({
        icon: 'success',
        title: 'Terhapus!',
        text: 'Nasabah berhasil dihapus.',
        timer: 2000,
        showConfirmButton: false
      });
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal menghapus nasabah',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const changePage = (page) => {
    pagination.value.currentPage = page;
    fetchCustomers();
  };


  onMounted(() => {
    fetchCustomers();
    document.addEventListener('click', handleClickOutside);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
  });

  return {
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
  };
}
