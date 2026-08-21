<template>
  <div class="mb-8">
    <!-- Weekly Bar Chart -->
    <div class="flex h-72 gap-3 mb-4 px-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
      <div 
        v-for="(val, idx) in chartData" 
        :key="idx" 
        class="flex-1 flex flex-col justify-end items-center group cursor-pointer relative h-full"
      >
        <div 
          v-if="val.amount > 0"
          class="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg shadow-md transition-all duration-500 group-hover:from-green-500 group-hover:to-green-300"
          :style="{ height: Math.max(val.percentage, 5) + '%', minHeight: '8px' }"
        ></div>
        <div 
          v-else
          class="w-full bg-gray-300 dark:bg-gray-700 rounded-t-sm"
          style="height: 3px"
        ></div>
        
        <!-- Tooltip -->
        <div class="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap z-10 transition shadow-lg">
          {{ formatCurrency(val.amount) }}
        </div>
      </div>
    </div>
    
    <!-- X-Axis Labels -->
    <div class="flex justify-between text-[10px] text-gray-400 px-2 font-mono">
      <span>Minggu 1</span>
      <span>Minggu 2</span>
      <span>Minggu 3</span>
      <span>Minggu 4</span>
    </div>
    
    <!-- Divider -->
    <div class="border-t border-dashed border-gray-200 dark:border-gray-700 my-6"></div>

    <!-- Financial Summary -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <p class="text-xs text-yellow-600 dark:text-yellow-500 mb-1 font-medium">Pengeluaran (Withdraw)</p>
        <p class="text-lg font-bold text-yellow-600 dark:text-yellow-500">{{ formatCurrency(totalWithdraw) }}</p>
      </div>
      <div class="text-right border-l border-gray-100 pl-4">
        <p class="text-xs text-green-600 dark:text-green-400 mb-1 font-medium">Pemasukan (Setor)</p>
        <p class="text-lg font-bold text-green-600 dark:text-green-400">{{ formatCurrency(totalIncome) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  transactions: {
    type: Array,
    default: () => []
  }
})

// Format currency
const formatCurrency = (value) => {
  if (!value) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value)
}

// Determine transaction type
const getInferredType = (trx) => {
  if (trx.type === 'TRANSFER') return 'OUT'
  if (trx.type === 'DEPOSIT') return 'INCOME'
  if (trx.paymentMethod === 'SAVINGS') return 'INCOME'
  if (trx.paymentMethod === 'CASH') return 'OUT'
  return trx.totalValue > 0 ? 'INCOME' : 'OUT'
}

// Total income
const totalIncome = computed(() => {
  return props.transactions
    .filter(t => getInferredType(t) === 'INCOME')
    .reduce((sum, t) => sum + Number(t.totalValue || t.amount || 0), 0)
})

// Total withdrawals
const totalWithdraw = computed(() => {
  return props.transactions
    .filter(t => getInferredType(t) === 'OUT')
    .reduce((sum, t) => sum + Number(t.totalValue || t.amount || 0), 0)
})

// Weekly chart data
const chartData = computed(() => {
  const weeks = [0, 0, 0, 0]
  
  props.transactions.forEach(t => {
    // Only count income for the bar chart
    if (getInferredType(t) === 'INCOME') {
      const val = Number(t.totalValue || t.amount || 0)
      const day = new Date(t.transactionDate).getDate()
      const weekIdx = Math.min(Math.floor((day - 1) / 7), 3)
      
      if (!isNaN(val)) {
        weeks[weekIdx] += val
      }
    }
  })
  
  // Scale to percentage
  const maxVal = Math.max(...weeks) || 1
  
  return weeks.map(val => ({
    amount: val,
    percentage: maxVal > 0 ? (val / maxVal) * 100 : 0
  }))
})
</script>
