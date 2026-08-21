import { ref, reactive } from 'vue';
import * as bankService from '@/services/bankService';
import api from '@/utils/api';
import { apiUrl } from '@/utils/apiUrl';
import Swal from 'sweetalert2';

export function useTransfers(fetchNotifications) {
    const showTransferModal = ref(false);
    const transfers = ref([]);

    // Transfer 3-step security flow
    const transferStep = ref(1); // 1: Input, 2: Confirm, 3: Password
    const lookedUpRecipient = ref(null); // Stored recipient from lookup API

    const transferForm = ref({
        receiverAccountNumber: '',
        amount: '',
        notes: '',
        password: ''
    });

    const transferLoading = ref(false);
    const transferError = ref('');

    // Search State
    const searchResults = ref([]);
    const isSearching = ref(false);

    const openTransferModal = () => {
        showTransferModal.value = true;
        transferStep.value = 1;
        transferForm.value = { receiverAccountNumber: '', amount: '', notes: '', password: '' };
        lookedUpRecipient.value = null;
        transferError.value = '';
    };

    const fetchTransfers = async () => {
        try {
            const response = await bankService.getMyTransferHistory();
            transfers.value = response.data || [];
        } catch (e) {
            console.error('Failed to load transfers:', e);
        }
    };

    const searchRecipient = async () => {
        const query = transferForm.value.receiverAccountNumber;
        if (!query || query.length < 3) return;

        isSearching.value = true;
        try {
            const res = await api.get(apiUrl('waste-bank/customers/search'), {
                params: { q: query }
            });
            if (res.data.success) {
                searchResults.value = res.data.data;
            } else {
                searchResults.value = [];
            }
        } catch (error) {
            searchResults.value = [];
        } finally {
            isSearching.value = false;
        }
    };

    const selectRecipient = (recipient) => {
        lookedUpRecipient.value = recipient;
        transferForm.value.receiverAccountNumber = recipient.accountNumber;
        searchResults.value = [];
        transferStep.value = 2;
    };

    const lookupRecipient = async () => {
        transferLoading.value = true;
        transferError.value = '';
        searchResults.value = [];

        try {
            const accountNumber = transferForm.value.receiverAccountNumber.trim();
            if (!accountNumber) {
                transferError.value = 'Masukkan nomor rekening atau nama nasabah';
                transferLoading.value = false;
                return;
            }

            const res = await api.get(apiUrl('waste-bank/customers/search'), {
                params: { q: accountNumber }
            });

            if (res.data.success && res.data.data.length > 0) {
                if (res.data.data.length === 1) {
                    selectRecipient(res.data.data[0]);
                } else {
                    const exactMatch = res.data.data.find(r =>
                        r.accountNumber.toUpperCase() === accountNumber.toUpperCase()
                    );
                    if (exactMatch) {
                        selectRecipient(exactMatch);
                    } else {
                        searchResults.value = res.data.data;
                        transferError.value = 'Ditemukan beberapa hasil, silakan pilih di bawah';
                    }
                }
            } else {
                transferError.value = 'Penerima tidak ditemukan';
            }

        } catch (error) {
            transferError.value = error.response?.data?.message || 'Gagal mencari rekening';
        } finally {
            transferLoading.value = false;
        }
    };

    const handleTransfer = async (onSuccess) => {
        transferLoading.value = true;
        transferError.value = '';

        try {
            const res = await bankService.transferBalance({
                receiverAccountNumber: lookedUpRecipient.value.accountNumber,
                amount: Number(transferForm.value.amount),
                notes: transferForm.value.notes,
                password: transferForm.value.password
            });

            showTransferModal.value = false;

            if (onSuccess) onSuccess(res);

            // Refetch self history
            fetchTransfers();

        } catch (err) {
            console.error(err);
            transferError.value = err.response?.data?.message || 'Transfer Gagal';
        } finally {
            transferLoading.value = false;
        }
    };

    return {
        showTransferModal,
        transfers,
        transferStep,
        lookedUpRecipient,
        transferForm,
        transferLoading,
        transferError,
        searchResults,
        isSearching,
        openTransferModal,
        fetchTransfers,
        searchRecipient,
        selectRecipient,
        lookupRecipient,
        handleTransfer
    };
}
