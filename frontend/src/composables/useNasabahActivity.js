import { computed } from 'vue';

const normalizeWasteTransaction = (transaction, getInferredType) => {
  const inferredType = getInferredType(transaction);
  let title = transaction.title;
  let subtitle = transaction.subtitle;

  if (!title) {
    if (inferredType === 'INCOME') {
      title = 'Setor Sampah';
      subtitle = `${transaction.totalWeight || 0} Kg • ${transaction.items?.length || 0} Item`;
    } else {
      title = 'Transaksi Lain';
      subtitle = transaction.description || '-';
    }
  }

  return {
    ...transaction,
    title,
    subtitle,
    amount: Number(transaction.totalValue || transaction.amount || 0),
    transactionDate: new Date(transaction.transactionDate || transaction.createdAt),
    inferredType,
    method: ['SAVINGS', 'TOPUP'].includes(transaction.paymentMethod) ? 'Tabungan' : 'Tunai',
    type: 'WASTE',
    isTransfer: false,
  };
};

const normalizeTransfer = (transfer, customerId) => {
  const isSender = transfer.senderId === customerId;

  return {
    ...transfer,
    title: isSender ? `Kirim ke ${transfer.receiverName}` : `Terima dari ${transfer.senderName}`,
    subtitle: transfer.notes || 'Transfer Saldo',
    amount: Number(transfer.amount || 0),
    transactionDate: new Date(transfer.transferDate),
    inferredType: isSender ? 'EXPENSE' : 'INCOME',
    method: 'Transfer',
    type: 'TRANSFER',
    isTransfer: true,
  };
};

export function useNasabahActivity({ transactions, transfers, customer, getInferredType }) {
  const normalizedActivities = computed(() => [
    ...(transactions.value || []).filter(Boolean).map((item) => normalizeWasteTransaction(item, getInferredType)),
    ...(transfers.value || []).filter(Boolean).map((item) => normalizeTransfer(item, customer.value?._id)),
  ].sort((a, b) => b.transactionDate - a.transactionDate));

  const groupedTransactions = computed(() => {
    const groups = new Map();

    for (const activity of normalizedActivities.value) {
      const dateKey = activity.transactionDate.toDateString();
      if (!groups.has(dateKey)) {
        groups.set(dateKey, {
          date: activity.transactionDate,
          items: [],
        });
      }
      groups.get(dateKey).items.push(activity);
    }

    return [...groups.values()];
  });

  const recentTransactions = computed(() => normalizedActivities.value.slice(0, 3));

  return {
    normalizedActivities,
    groupedTransactions,
    recentTransactions,
  };
}
