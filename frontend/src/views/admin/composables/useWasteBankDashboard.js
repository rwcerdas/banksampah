import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import Chart from 'chart.js/auto';
import bankService from '@/services/bankService';

export function useWasteBankDashboard() {
  // State
  const loading = ref(false);
  // Default: satu tahun penuh (Januari–Desember tahun berjalan)
  const selectedMonthFrom = ref(1);
  const selectedMonthTo = ref(12);
  const selectedYear = ref(new Date().getFullYear());
  const selectedQuickFilter = ref(null);
  const selectedTrendView = ref('monthly');
  const stats = ref({});
  const cashStats = ref({ balance: 0, expense_month: 0 });
  const rtBreakdownData = ref([]);

  // Computed checks for Bento Empty States
  const hasIndWeightData = computed(() => rtBreakdownData.value.some(d => d.indWeight > 0));
  const hasGrpWeightData = computed(() => rtBreakdownData.value.some(d => d.grpWeight > 0));
  const hasIndActiveData = computed(() => rtBreakdownData.value.some(d => d.indActive > 0));
  const hasGrpActiveData = computed(() => rtBreakdownData.value.some(d => d.grpActive > 0));

  // Individual Leaderboards
  const topIndNominal = ref([]);
  const topIndWeight = ref([]);
  const topIndCount = ref([]);

  // Group Leaderboards
  const topGroupNominal = ref([]);
  const topGroupWeight = ref([]);
  const topGroupCount = ref([]);

  // Chart refs
  const weightChart = ref(null);
  const valueChart = ref(null);
  const categoryChart = ref(null);
  const categoryWeightChart = ref(null);
  const rtWeightIndChart = ref(null);
  const rtWeightGrpChart = ref(null);
  const rtActiveIndChart = ref(null);
  const rtActiveGrpChart = ref(null);
  const customersChart = ref(null);

  // Chart instances
  let weightChartInstance = null;
  let valueChartInstance = null;
  let categoryChartInstance = null;
  let categoryWeightChartInstance = null;
  let rtWeightIndChartInstance = null;
  let rtWeightGrpChartInstance = null;
  let rtActiveIndChartInstance = null;
  let rtActiveGrpChartInstance = null;
  let customersChartInstance = null;

  // Month options
  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  // Year options (current year ± 2)
  const years = ref([]);
  for (let i = -2; i <= 2; i++) {
    years.value.push(new Date().getFullYear() + i);
  }

  // Format helpers
  const formatCurrency = (value) => {
    if (!value) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatWeight = (value) => {
    if (!value) return '0.00';
    return parseFloat(value).toFixed(2);
  };

  const getGrowthClass = (growth) => {
    return growth > 0 ? 'positive' : growth < 0 ? 'negative' : 'neutral';
  };

  const isMobileView = () => window.innerWidth < 768;

  const compactAxisNumber = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return value;
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} jt`;
    if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)} rb`;
    return n;
  };

  const getLineChartOptions = (isMobile, { yCompact = false } = {}) => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: isMobile ? 0 : 4,
        right: isMobile ? 0 : 8,
        top: 4,
        bottom: isMobile ? 4 : 8,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: isMobile ? 'bottom' : 'top',
        align: 'start',
        labels: {
          boxWidth: isMobile ? 10 : 12,
          padding: isMobile ? 10 : 16,
          font: { size: isMobile ? 10 : 12 },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: isMobile ? 0 : 45,
          minRotation: isMobile ? 0 : 45,
          autoSkip: true,
          maxTicksLimit: isMobile ? 6 : 12,
          padding: 4,
          font: { size: isMobile ? 10 : 11 },
        },
        grid: { display: !isMobile },
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: isMobile ? 10 : 11 },
          maxTicksLimit: isMobile ? 5 : 8,
          callback: yCompact ? compactAxisNumber : undefined,
        },
      },
    },
  });

  const resizeAllCharts = () => {
    [
      weightChartInstance,
      valueChartInstance,
      categoryChartInstance,
      categoryWeightChartInstance,
      rtWeightIndChartInstance,
      rtWeightGrpChartInstance,
      rtActiveIndChartInstance,
      rtActiveGrpChartInstance,
      customersChartInstance,
    ].forEach((instance) => instance?.resize());
  };

  let resizeTimer = null;
  const handleChartResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeAllCharts, 150);
  };

  // Actions
  const setQuickFilter = (months) => {
      selectedQuickFilter.value = months;
      loadDashboard();
  };

  const onRangeChange = () => {
      selectedQuickFilter.value = null;
      loadDashboard();
  };

  const loadTrendCharts = async () => {
      try {
          const [weightTrendRes, valueTrendRes] = await Promise.all([
              bankService.getWeightTrend({ year: selectedYear.value, viewMode: selectedTrendView.value }),
              bankService.getValueTrend({ year: selectedYear.value, viewMode: selectedTrendView.value })
          ]);
          renderWeightChart(weightTrendRes.data);
          renderValueChart(valueTrendRes.data);
      } catch (error) {
          console.error('Error loading trend charts:', error);
      }
  };

  const changeTrendView = (mode) => {
      if (selectedTrendView.value === mode) return;
      selectedTrendView.value = mode;
      loadTrendCharts();
  };

  // Load dashboard data
  const loadDashboard = async () => {
    loading.value = true;

    try {
      const params = {
        year: selectedYear.value
      };

      if (selectedQuickFilter.value) {
          params.quickFilter = selectedQuickFilter.value;
      } else {
          params.monthFrom = selectedMonthFrom.value;
          params.monthTo = selectedMonthTo.value;
      }

      const [
        statsRes,
        weightTrendRes,
        valueTrendRes,
        categoryRes,
        rtRes,
        customersTrendRes,
        cashStatsRes,
        // Individual
        indNomRes, indWeightRes, indCountRes,
        // Group
        grpNomRes, grpWeightRes, grpCountRes
      ] = await Promise.all([
        bankService.getDashboardStats(params),
        bankService.getWeightTrend({ year: selectedYear.value, viewMode: selectedTrendView.value }),
        bankService.getValueTrend({ year: selectedYear.value, viewMode: selectedTrendView.value }),
        bankService.getCategoryBreakdown(params),
        bankService.getRTBreakdown(params),
        bankService.getActiveCustomersTrend({ year: selectedYear.value }),
        bankService.getCashSummary(params),
        // Individual
        bankService.getTopCustomers({ ...params, limit: 5, sortBy: 'totalValue', customerType: 'INDIVIDUAL' }),
        bankService.getTopCustomers({ ...params, limit: 5, sortBy: 'totalWeight', customerType: 'INDIVIDUAL' }),
        bankService.getTopCustomers({ ...params, limit: 5, sortBy: 'totalTransactions', customerType: 'INDIVIDUAL' }),
        // Group
        bankService.getTopCustomers({ ...params, limit: 5, sortBy: 'totalValue', customerType: 'GROUP' }),
        bankService.getTopCustomers({ ...params, limit: 5, sortBy: 'totalWeight', customerType: 'GROUP' }),
        bankService.getTopCustomers({ ...params, limit: 5, sortBy: 'totalTransactions', customerType: 'GROUP' })
      ]);

      stats.value = statsRes.data;
      if (cashStatsRes && cashStatsRes.success) {
          cashStats.value = cashStatsRes.data;
      }

      // Assign Individual
      topIndNominal.value = indNomRes.data || [];
      topIndWeight.value = indWeightRes.data || [];
      topIndCount.value = indCountRes.data || [];

      // Assign Group
      topGroupNominal.value = grpNomRes.data || [];
      topGroupWeight.value = grpWeightRes.data || [];
      topGroupCount.value = grpCountRes.data || [];
      rtBreakdownData.value = rtRes.data || [];

      // Must hide loading first to reveal canvases
      loading.value = false;
      await nextTick();

      // Pass entire data array directly, let render functions map them
      renderWeightChart(weightTrendRes.data);
      renderValueChart(valueTrendRes.data);
      renderCategoryChart(categoryRes.data);
      renderCategoryWeightChart(categoryRes.data);
      renderRTWeightIndChart(rtRes.data);
      renderRTWeightGrpChart(rtRes.data);
      renderRTActiveIndChart(rtRes.data);
      renderRTActiveGrpChart(rtRes.data);
      renderCustomersChart(customersTrendRes.data);

    } catch (error) {
      console.error('Error loading dashboard:', error);
      loading.value = false; // Ensure loading is off on error too
    }
  };

  // ... Chart Functions need small updates to handle API data format if different from dummy ...
  // Check below:
  // API data format for trends: [{ month: 'Jan', weight: 123 }, ...] - Matches expected.
  // API data for categories: [{ categoryName: 'X', weight: 1, profit: 1 }] - Matches expected.

  // Render charts
  const renderWeightChart = (data) => {
    if (!weightChart.value) return;
    if (weightChartInstance) {
      weightChartInstance.destroy();
    }

    const isMobile = isMobileView();
    const labels = data.map(d => d.month);
    const displayLabels = isMobile
      ? labels.map(l => (typeof l === 'string' ? l.split(' ')[0] : l))
      : labels;

    const ctx = weightChart.value.getContext('2d');
    weightChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: displayLabels,
        datasets: [{
          label: 'Berat (Kg)',
          data: data.map(d => d.weight),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: isMobile ? 2 : 3,
        }]
      },
      options: getLineChartOptions(isMobile),
    });
  };

  const renderValueChart = (data) => {
    if (!valueChart.value) return;
    if (valueChartInstance) {
      valueChartInstance.destroy();
    }

    const isMobile = isMobileView();
    const labels = data.map(d => d.month);
    const displayLabels = isMobile
      ? labels.map(l => (typeof l === 'string' ? l.split(' ')[0] : l))
      : labels;

    const ctx = valueChart.value.getContext('2d');
    valueChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: displayLabels,
        datasets: [
          {
            label: isMobile ? 'Ke Nasabah (Rp)' : 'Dibayarkan ke Nasabah (Rp)',
            data: data.map(d => d.value ?? d.totalValue ?? 0),
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: isMobile ? 2 : 3,
          },
          {
            label: isMobile ? 'Keuntungan (Rp)' : 'Keuntungan Pengurus (Rp)',
            data: data.map(d => d.profit),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: isMobile ? 2 : 3,
          }
        ]
      },
      options: getLineChartOptions(isMobile, { yCompact: true }),
    });
  };

  const renderCategoryChart = (data) => {
    if (!categoryChart.value) return;
    if (categoryChartInstance) {
      categoryChartInstance.destroy();
    }

    const ctx = categoryChart.value.getContext('2d');
    const colors = [
      '#22c55e', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
    ];

    const isMobile = isMobileView();

    categoryChartInstance = new Chart(ctx, {
      type: 'doughnut', // Changed to doughnut for nicer look
      data: {
        labels: data.map(d => d.categoryName || 'Unknown'),
        datasets: [{
          label: 'Profit (Rp)',
          data: data.map(d => d.profit), // Show Profit share!
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: isMobile ? 'bottom' : 'right',
            labels: {
              boxWidth: isMobile ? 10 : 12,
              font: { size: isMobile ? 10 : 12 },
              padding: isMobile ? 8 : 12,
            },
          },
          tooltip: {
              callbacks: {
                  label: function(context) {
                      let label = context.label || '';
                      if (label) {
                          label += ': ';
                      }
                      if (context.parsed !== null) {
                          label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(context.parsed);
                      }
                      return label;
                  }
              }
          }
        }
      }
    });
  };

  const renderCategoryWeightChart = (data) => {
    if (!categoryWeightChart.value) return;
    if (categoryWeightChartInstance) {
      categoryWeightChartInstance.destroy();
    }

    const sortedData = [...data].sort((a, b) => b.weight - a.weight);

    const ctx = categoryWeightChart.value.getContext('2d');
    categoryWeightChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedData.map(d => d.categoryName || 'Unknown'),
        datasets: [{
          label: 'Berat Total (Kg)',
          data: sortedData.map(d => d.weight),
          backgroundColor: '#10b981',
          borderRadius: 6,
          barThickness: 20
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
              callbacks: {
                  label: function(context) {
                      return ` Berat: ${context.parsed.x} Kg`;
                  }
              }
          }
        },
        scales: {
          x: { beginAtZero: true, title: { display: true, text: 'Kilogram (Kg)', font: { size: 10 } } },
          y: { ticks: { font: { size: 10 } } }
        }
      }
    });
  };

  const renderRTWeightIndChart = (data) => {
    if (!rtWeightIndChart.value) return;
    if (rtWeightIndChartInstance) rtWeightIndChartInstance.destroy();
    const isMobile = isMobileView();
    const sortedData = [...data].sort((a, b) => b.indWeight - a.indWeight).filter(d => d.indWeight > 0);
    const ctx = rtWeightIndChart.value.getContext('2d');
    rtWeightIndChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedData.map(d => {
          if (d.rt === 'External') return isMobile ? 'Luar RW' : 'Luar RW 09 / External';
          if (d.rt === 'RW 09') return isMobile ? 'RW 09' : 'RW 09 (Internal)';
          return `RT ${d.rt}`;
        }),
        datasets: [{ label: 'Berat (Kg)', data: sortedData.map(d => d.indWeight), backgroundColor: '#6366f1', borderRadius: 4 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        layout: { padding: { right: isMobile ? 4 : 8 } },
        interaction: { mode: 'index', intersect: true },
        plugins: {
          legend: { display: false },
          tooltip: {
              callbacks: {
                  label: function(context) {
                      const item = sortedData[context.dataIndex];
                      return [
                          ` Berat: ${item.indWeight} Kg`,
                          ` Transaksi: ${item.totalTransactions || 0}x`,
                          ` Nasabah: ${item.indActive} orang`
                      ];
                  }
              }
          }
        },
        scales: {
          y: { ticks: { font: { size: isMobile ? 10 : 11 }, autoSkip: false } },
          x: { beginAtZero: true, ticks: { font: { size: isMobile ? 10 : 11 } } },
        }
      }
    });
  };

  const renderRTWeightGrpChart = (data) => {
    if (!rtWeightGrpChart.value) return;
    if (rtWeightGrpChartInstance) rtWeightGrpChartInstance.destroy();
    const isMobile = isMobileView();
    const sortedData = [...data].sort((a, b) => b.grpWeight - a.grpWeight).filter(d => d.grpWeight > 0);
    const ctx = rtWeightGrpChart.value.getContext('2d');
    rtWeightGrpChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedData.map(d => {
          if (d.rt === 'External') return isMobile ? 'Grup Luar' : 'Kelompok Luar RW 09 / External';
          if (d.rt === 'RW 09') return isMobile ? 'Grup RW 09' : 'Kelompok RW 09 (Internal)';
          return d.rt;
        }),
        datasets: [{ label: 'Berat (Kg)', data: sortedData.map(d => d.grpWeight), backgroundColor: '#f59e0b', borderRadius: 4 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        layout: { padding: { right: isMobile ? 4 : 8 } },
        interaction: { mode: 'index', intersect: true },
        plugins: {
          legend: { display: false },
          tooltip: {
              callbacks: {
                  label: function(context) {
                      const item = sortedData[context.dataIndex];
                      return [
                          ` Berat: ${item.grpWeight} Kg`,
                          ` Transaksi: ${item.totalTransactions || 0}x`,
                          ` Kelompok: ${item.grpActive} grup`
                      ];
                  }
              }
          }
        },
        scales: {
          y: { ticks: { font: { size: isMobile ? 10 : 11 }, autoSkip: false } },
          x: { beginAtZero: true, ticks: { font: { size: isMobile ? 10 : 11 } } },
        }
      }
    });
  };

  const renderRTActiveIndChart = (data) => {
    if (!rtActiveIndChart.value) return;
    if (rtActiveIndChartInstance) rtActiveIndChartInstance.destroy();
    const sortedData = [...data].sort((a, b) => b.indActive - a.indActive).filter(d => d.indActive > 0);
    const ctx = rtActiveIndChart.value.getContext('2d');
    rtActiveIndChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedData.map(d => d.rt === 'External' ? 'Luar RW 09 / External' : (d.rt === 'RW 09' ? 'RW 09 (Internal)' : `RT ${d.rt}`)),
        datasets: [{ label: 'Nasabah', data: sortedData.map(d => d.indActive), backgroundColor: '#10b981', borderRadius: 4 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        interaction: { mode: 'index', intersect: true },
        plugins: {
          legend: { display: false },
          tooltip: {
              callbacks: {
                  label: function(context) {
                      const item = sortedData[context.dataIndex];
                      return [
                          ` Nasabah Aktif: ${item.indActive} orang`,
                          ` Total Berat: ${item.indWeight} Kg`
                      ];
                  }
              }
          }
        }
      }
    });
  };

  const renderRTActiveGrpChart = (data) => {
    if (!rtActiveGrpChart.value) return;
    if (rtActiveGrpChartInstance) rtActiveGrpChartInstance.destroy();

    let internalCount = 0;
    let externalCount = 0;
    let internalWeight = 0;
    let externalWeight = 0;

    data.forEach(d => {
      if (d.grpActive > 0) {
        if (d.rt.includes('(Internal)') || d.rt === 'RW 09') {
          internalCount += d.grpActive;
          internalWeight += d.grpWeight;
        } else {
          externalCount += d.grpActive;
          externalWeight += d.grpWeight;
        }
      }
    });

    const ctx = rtActiveGrpChart.value.getContext('2d');
    rtActiveGrpChartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Internal RW 09', 'Luar RW 09 / Eksternal'],
        datasets: [{
          data: [internalCount, externalCount],
          backgroundColor: ['#ec4899', '#f59e0b'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: true },
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
              callbacks: {
                  label: function(context) {
                      const idx = context.dataIndex;
                      const weight = idx === 0 ? internalWeight : externalWeight;
                      return ` ${context.raw} Kelompok Aktif (Total Berat: ${weight.toFixed(2)} Kg)`;
                  }
              }
          }
        }
      }
    });
  };

  const renderCustomersChart = (data) => {
    if (!customersChart.value) return;
    if (customersChartInstance) {
      customersChartInstance.destroy();
    }

    const ctx = customersChart.value.getContext('2d');
    const isMobile = isMobileView();
    customersChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.month),
        datasets: [
          {
            label: 'Nasabah Aktif',
            data: data.map(d => d.activeCustomers),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderRadius: 4
          }
        ]
      },
      options: {
        ...getLineChartOptions(isMobile),
        plugins: {
          legend: {
            display: true,
            position: isMobile ? 'bottom' : 'top',
            labels: { font: { size: isMobile ? 10 : 12 } },
          },
        },
        scales: {
          ...getLineChartOptions(isMobile).scales,
          y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: isMobile ? 10 : 11 } } },
        },
      }
    });
  };

  // Cleanup on unmount

  onMounted(() => {
    loadDashboard();
    window.addEventListener('resize', handleChartResize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleChartResize);
    clearTimeout(resizeTimer);
    [
      weightChartInstance,
      valueChartInstance,
      categoryChartInstance,
      categoryWeightChartInstance,
      rtWeightIndChartInstance,
      rtWeightGrpChartInstance,
      rtActiveIndChartInstance,
      rtActiveGrpChartInstance,
      customersChartInstance,
    ].forEach((instance) => instance?.destroy());
  });

  return {
    loading,
    selectedMonthFrom,
    selectedMonthTo,
    selectedYear,
    selectedQuickFilter,
    selectedTrendView,
    stats,
    cashStats,
    rtBreakdownData,
    hasIndWeightData,
    hasGrpWeightData,
    hasIndActiveData,
    hasGrpActiveData,
    topIndNominal,
    topIndWeight,
    topIndCount,
    topGroupNominal,
    topGroupWeight,
    topGroupCount,
    weightChart,
    valueChart,
    categoryChart,
    categoryWeightChart,
    rtWeightIndChart,
    rtWeightGrpChart,
    rtActiveIndChart,
    rtActiveGrpChart,
    customersChart,
    months,
    years,
    formatCurrency,
    formatWeight,
    getGrowthClass,
    isMobileView,
    compactAxisNumber,
    getLineChartOptions,
    resizeAllCharts,
    handleChartResize,
    setQuickFilter,
    onRangeChange,
    loadTrendCharts,
    changeTrendView,
    loadDashboard,
    renderWeightChart,
    renderValueChart,
    renderCategoryChart,
    renderCategoryWeightChart,
    renderRTWeightIndChart,
    renderRTWeightGrpChart,
    renderRTActiveIndChart,
    renderRTActiveGrpChart,
    renderCustomersChart
  };
}
