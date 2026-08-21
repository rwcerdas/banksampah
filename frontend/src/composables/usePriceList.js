import { ref, computed, watch } from 'vue';
import * as bankService from '@/services/bankService';

export function usePriceList() {
    const loadingPrices = ref(false);
    const items = ref([]);
    const markupPercentage = ref(0);
    const priceSearchQuery = ref('');
    const selectedCategory = ref('');
    const sortBy = ref('alphabetical'); // 'alphabetical', 'price_high', 'price_low'

    const fetchPriceList = async () => {
        loadingPrices.value = true;
        try {
            const [itemsRes, settingsRes] = await Promise.all([
                bankService.getItems({ active: true }),
                bankService.getSettings()
            ]);

            items.value = itemsRes.data?.items || [];
            markupPercentage.value = settingsRes.data?.globalMarkupPercentage || 0;
        } catch (error) {
            console.error('Error loading settings:', error);
            items.value = [];
        } finally {
            loadingPrices.value = false;
        }
    };

    const calculateCustomerPrice = (pelapakPrice) => {
        if (!pelapakPrice) return 0;
        return pelapakPrice * (1 - (markupPercentage.value / 100));
    };

    // Computed Categories
    const categories = computed(() => {
        const unique = new Set(items.value.map(i => i.categoryId?.categoryName).filter(Boolean));
        return ['Semua', ...Array.from(unique).sort()];
    });

    const filteredItems = computed(() => {
        let result = items.value;

        // 1. Search Filter
        if (priceSearchQuery.value) {
            const q = priceSearchQuery.value.toLowerCase();
            result = result.filter(i =>
                i.itemName.toLowerCase().includes(q) ||
                i.categoryId?.categoryName?.toLowerCase().includes(q)
            );
        }

        // 2. Category Filter
        if (selectedCategory.value && selectedCategory.value !== 'Semua') {
            result = result.filter(i => i.categoryId?.categoryName === selectedCategory.value);
        }

        // 3. Sorting
        return [...result].sort((a, b) => {
            const priceA = calculateCustomerPrice(a.pelapakPrice);
            const priceB = calculateCustomerPrice(b.pelapakPrice);

            switch (sortBy.value) {
                case 'price_high':
                    return priceB - priceA;
                case 'price_low':
                    return priceA - priceB;
                case 'alphabetical':
                default:
                    return a.itemName.localeCompare(b.itemName);
            }
        });
    });

    return {
        loadingPrices,
        items,
        markupPercentage,
        priceSearchQuery,
        selectedCategory,
        sortBy,
        categories,
        filteredItems,
        fetchPriceList
    };
}
