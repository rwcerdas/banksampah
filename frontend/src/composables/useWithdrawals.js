import { ref } from 'vue';
import * as bankService from '@/services/bankService';

export function useWithdrawals() {
    const showWithdrawalModal = ref(false);
    const withdrawals = ref([]);
    const loadingWithdrawals = ref(false);

    const openWithdrawalModal = () => {
        showWithdrawalModal.value = true;
    };

    const fetchWithdrawals = async () => {
        loadingWithdrawals.value = true;
        try {
            const res = await bankService.getWithdrawals();
            if (res.success) {
                withdrawals.value = res.data;
            }
        } catch (err) {
            console.error("Gagal load withdrawals", err);
        } finally {
            loadingWithdrawals.value = false;
        }
    };

    return {
        showWithdrawalModal,
        withdrawals,
        loadingWithdrawals,
        openWithdrawalModal,
        fetchWithdrawals
    };
}
