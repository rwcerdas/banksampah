import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useNasabahActivity } from '../useNasabahActivity';

describe('useNasabahActivity', () => {
  it('normalizes waste and transfer records into one newest-first timeline', () => {
    const transactions = ref([{
      _id: 'waste-1',
      transactionDate: '2026-07-27T08:00:00.000Z',
      totalValue: 25_000,
      totalWeight: 2,
      paymentMethod: 'SAVINGS',
      items: [{ itemName: 'Kardus' }],
    }]);
    const transfers = ref([{
      _id: 'transfer-1',
      senderId: 'customer-1',
      receiverName: 'Budi',
      amount: 10_000,
      transferDate: '2026-07-28T08:00:00.000Z',
    }]);
    const customer = ref({ _id: 'customer-1' });

    const { normalizedActivities, recentTransactions } = useNasabahActivity({
      transactions,
      transfers,
      customer,
      getInferredType: () => 'INCOME',
    });

    expect(normalizedActivities.value).toHaveLength(2);
    expect(normalizedActivities.value[0]).toMatchObject({
      _id: 'transfer-1',
      inferredType: 'EXPENSE',
      title: 'Kirim ke Budi',
    });
    expect(normalizedActivities.value[1]).toMatchObject({
      _id: 'waste-1',
      inferredType: 'INCOME',
      title: 'Setor Sampah',
      amount: 25_000,
    });
    expect(recentTransactions.value).toHaveLength(2);
  });

  it('groups activities by calendar day and limits recent activity to three', () => {
    const transactions = ref([
      { _id: '1', transactionDate: '2026-07-28T09:00:00.000Z', amount: 1 },
      { _id: '2', transactionDate: '2026-07-28T08:00:00.000Z', amount: 2 },
      { _id: '3', transactionDate: '2026-07-27T08:00:00.000Z', amount: 3 },
      { _id: '4', transactionDate: '2026-07-26T08:00:00.000Z', amount: 4 },
    ]);

    const { groupedTransactions, recentTransactions } = useNasabahActivity({
      transactions,
      transfers: ref([]),
      customer: ref(null),
      getInferredType: () => 'INCOME',
    });

    expect(groupedTransactions.value.map((group) => group.items.length)).toEqual([2, 1, 1]);
    expect(recentTransactions.value.map((item) => item._id)).toEqual(['1', '2', '3']);
  });
});
