// Bar Chart and Doughnut Chart for Income/Expense Breakdown

export const renderIncomeVsExpenseChart = (canvasId, months, incomeData, expenseData) => {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const existingChart = Chart.getChart(canvasId);
    if (existingChart) {
        existingChart.destroy();
    }

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Pemasukan',
                    data: incomeData,
                    backgroundColor: '#10B981',
                    borderRadius: 6
                },
                {
                    label: 'Pengeluaran',
                    data: expenseData,
                    backgroundColor: '#EF4444',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#F3F4F6' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': Rp ' + context.raw.toLocaleString('id-ID');
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9CA3AF' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#9CA3AF',
                        callback: function(value) {
                            if (value >= 1000000) return (value / 1000000) + ' Jt';
                            return value;
                        }
                    }
                }
            }
        }
    });
};

export const renderCategoryChart = (canvasId, categoryData) => {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const existingChart = Chart.getChart(canvasId);
    if (existingChart) {
        existingChart.destroy();
    }

    const labels = Object.keys(categoryData).map(k => k.toUpperCase());
    const data = Object.values(categoryData);

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#EF4444', // konsumsi
                    '#F59E0B', // transportasi
                    '#3B82F6', // operasional
                    '#EC4899', // dokumentasi
                    '#8B5CF6', // atk
                    '#10B981', // publikasi
                    '#06B6D4', // honorarium
                    '#6B7280'  // lainnya
                ],
                borderColor: '#0e1511',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#F3F4F6', boxWidth: 15 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': Rp ' + context.raw.toLocaleString('id-ID');
                        }
                    }
                }
            }
        }
    });
};
