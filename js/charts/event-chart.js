// Bar Chart for Event financial surplus/deficit comparison

export const renderEventChart = (canvasId, eventLabels, collectedData, spentData) => {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const existingChart = Chart.getChart(canvasId);
    if (existingChart) {
        existingChart.destroy();
    }

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: eventLabels,
            datasets: [
                {
                    label: 'Dana Terkumpul',
                    data: collectedData,
                    backgroundColor: '#10B981',
                    borderRadius: 4
                },
                {
                    label: 'Pengeluaran',
                    data: spentData,
                    backgroundColor: '#EF4444',
                    borderRadius: 4
                }
            ]
        },
        options: {
            indexAxis: 'y', // Horizontal bars
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
                    ticks: {
                        color: '#9CA3AF',
                        callback: function(value) {
                            if (value >= 1000000) return (value / 1000000) + ' Jt';
                            return value;
                        }
                    }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9CA3AF' }
                }
            }
        }
    });
};
export const renderSourcesChart = (canvasId, sourcesData) => {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const existingChart = Chart.getChart(canvasId);
    if (existingChart) {
        existingChart.destroy();
    }

    const labels = Object.keys(sourcesData).map(s => s.toUpperCase());
    const data = Object.values(sourcesData);

    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#10B981', // iuran
                    '#3B82F6', // donasi
                    '#F59E0B', // sponsor
                    '#10B981', // hibah
                    '#8B5CF6', // kas_awal
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
