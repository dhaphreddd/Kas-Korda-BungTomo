import { getDashboardStats, getChartData } from '../services/dashboardService.js';
import { formatRupiah, formatDate } from '../utils.js';
import { getCurrentUser, hasAccess } from '../auth.js';
import { setApprovalStatus } from '../services/transactionService.js';

export const render = async (container) => {
    const stats = await getDashboardStats();
    const chartData = await getChartData();
    const user = getCurrentUser();
    const canApprove = hasAccess(['ketua', 'admin']);

    // Fetch pending transactions for the approval widget
    const pendingTrxs = stats.recentTransactions.filter(t => t.status === 'pending');

    container.innerHTML = `
        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
                <h2 class="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">Dashboard Bendahara Utama</h2>
                <p class="font-body-md text-body-md text-on-surface-variant">Ringkasan finansial dan aktivitas terkini per <span id="currentDate"></span></p>
            </div>
            <div class="flex gap-4">
                <a href="#/reports" class="px-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-on-surface font-body-sm hover:border-primary transition-colors flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">download</span> Unduh Laporan
                </a>
            </div>
        </div>

        <!-- Stats Grid (Bento style) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <!-- Saldo Kas -->
            <div class="bg-surface-container-low border border-outline-variant rounded-xl p-6 relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div class="flex justify-between items-start mb-4 relative z-10">
                    <p class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-xs">Saldo Kas Aktif</p>
                    <span class="material-symbols-outlined text-primary">account_balance_wallet</span>
                </div>
                <h3 class="font-numeric-lg text-numeric-lg text-on-surface mb-2 relative z-10" id="dash-saldo-val">${formatRupiah(stats.saldo)}</h3>
                <div class="flex items-center gap-2 relative z-10">
                    <span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-body-sm text-xs flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">trending_up</span> +12.5%
                    </span>
                    <span class="font-body-sm text-xs text-on-surface-variant">vs bulan lalu</span>
                </div>
            </div>

            <!-- Total Pemasukan -->
            <div class="bg-surface-container-low border border-outline-variant rounded-xl p-6 hover:border-primary/50 transition-colors">
                <div class="flex justify-between items-start mb-4">
                    <p class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-xs">Total Pemasukan</p>
                    <span class="material-symbols-outlined text-secondary">arrow_downward</span>
                </div>
                <h3 class="font-numeric-lg text-numeric-lg text-secondary mb-2">${formatRupiah(stats.totalPemasukan)}</h3>
                <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-body-sm text-xs flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">trending_up</span> +5.2%
                    </span>
                </div>
            </div>

            <!-- Total Pengeluaran -->
            <div class="bg-surface-container-low border border-outline-variant rounded-xl p-6 hover:border-error/50 transition-colors">
                <div class="flex justify-between items-start mb-4">
                    <p class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-xs">Total Pengeluaran</p>
                    <span class="material-symbols-outlined text-error">arrow_upward</span>
                </div>
                <h3 class="font-numeric-lg text-numeric-lg text-error mb-2">${formatRupiah(stats.totalPengeluaran)}</h3>
                <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded-full bg-error/10 text-error font-body-sm text-xs flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">trending_down</span> -2.4%
                    </span>
                </div>
            </div>

            <!-- Event Aktif -->
            <div class="bg-surface-container-low border border-outline-variant rounded-xl p-6 hover:border-primary/50 transition-colors">
                <div class="flex justify-between items-start mb-4">
                    <p class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-xs">Event Aktif</p>
                    <span class="material-symbols-outlined text-tertiary">celebration</span>
                </div>
                <h3 class="font-numeric-lg text-numeric-lg text-on-surface mb-2">${stats.eventAktif} <span class="text-body-md font-body-md text-on-surface-variant">Acara</span></h3>
                <div class="flex items-center gap-2">
                    <span class="font-body-sm text-xs text-on-surface-variant">Membutuhkan pendanaan aktif</span>
                </div>
            </div>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
            <!-- Line Chart -->
            <div class="lg:col-span-2 bg-surface-container-low border border-outline-variant rounded-xl p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-headline-md text-headline-md text-on-surface">Tren Saldo Bulanan</h3>
                    <span class="text-xs text-on-surface-variant">Tahun Ini</span>
                </div>
                <div class="h-64 w-full">
                    <canvas id="balanceChart"></canvas>
                </div>
            </div>
            
            <!-- Donut Chart -->
            <div class="bg-surface-container-low border border-outline-variant rounded-xl p-6">
                <h3 class="font-headline-md text-headline-md text-on-surface mb-6">Distribusi Sumber Dana</h3>
                <div class="h-48 w-full flex justify-center relative">
                    <canvas id="sourceChart"></canvas>
                    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                        <span class="text-body-sm text-on-surface-variant text-xs">Total Dana</span>
                        <span class="font-bold text-on-surface text-sm">100%</span>
                    </div>
                </div>
                <div class="mt-6 space-y-3">
                    <div class="flex justify-between items-center text-body-sm">
                        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-primary"></span> Iuran Anggota</div>
                        <span class="text-on-surface font-bold">55%</span>
                    </div>
                    <div class="flex justify-between items-center text-body-sm">
                        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-secondary"></span> Donasi Eksternal</div>
                        <span class="text-on-surface font-bold">30%</span>
                    </div>
                    <div class="flex justify-between items-center text-body-sm">
                        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-tertiary"></span> Sisa Event Lalu</div>
                        <span class="text-on-surface font-bold">15%</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tables Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            <!-- Transaksi Terbaru -->
            <div class="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
                <div class="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                    <h3 class="font-headline-md text-headline-md text-on-surface">Transaksi Terbaru</h3>
                    <a class="text-primary font-body-sm hover:underline" href="#/transactions">Lihat Semua</a>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-surface-container font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-[11px]">
                                <th class="p-4 font-semibold">Tanggal</th>
                                <th class="p-4 font-semibold">Deskripsi</th>
                                <th class="p-4 font-semibold text-right">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody class="text-body-sm text-on-surface divide-y divide-outline-variant/50">
                            ${stats.recentTransactions.map(t => {
                                const isPem = t.jenis === 'pemasukan';
                                const colorClass = isPem ? 'text-primary' : 'text-error';
                                const prefix = isPem ? '+' : '-';
                                return `
                                    <tr class="hover:bg-surface-variant/30 transition-colors">
                                        <td class="p-4 text-on-surface-variant">${formatDate(t.tanggal)}</td>
                                        <td class="p-4">${t.keterangan}</td>
                                        <td class="p-4 text-right ${colorClass} font-semibold">${prefix} ${formatRupiah(t.nominal)}</td>
                                    </tr>
                                `;
                            }).join('')}
                            ${stats.recentTransactions.length === 0 ? '<tr><td colspan="3" class="p-4 text-center text-on-surface-variant">Belum ada transaksi.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Aktivitas Persetujuan -->
            <div class="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
                <div class="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                    <h3 class="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                        Persetujuan Tertunda
                        <span class="bg-error text-on-error px-2 py-0.5 rounded-full text-xs font-bold" id="pending-badge-count">${pendingTrxs.length}</span>
                    </h3>
                    <a class="text-primary font-body-sm hover:underline" href="#/transactions">Kelola</a>
                </div>
                <div class="p-4 space-y-4" id="dashboard-pending-list">
                    ${pendingTrxs.map(t => `
                        <div class="p-4 border border-outline-variant rounded-lg bg-surface-container hover:border-primary/30 transition-colors">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <span class="px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant font-label-caps text-[10px] uppercase mb-1 inline-block">${t.sumber}</span>
                                    <h4 class="font-bold text-on-surface">${t.keterangan}</h4>
                                </div>
                                <span class="text-error font-numeric-lg text-lg">${formatRupiah(t.nominal)}</span>
                            </div>
                            <p class="text-body-sm text-on-surface-variant mb-4">Pengajuan Transaksi pada ${formatDate(t.tanggal)}</p>
                            ${canApprove ? `
                                <div class="flex gap-2">
                                    <button class="flex-1 py-2 bg-primary text-on-primary font-bold rounded hover:bg-primary-fixed transition-colors text-body-sm btn-dash-approve" data-id="${t.id}">Setujui</button>
                                    <button class="flex-1 py-2 bg-transparent border border-error text-error font-bold rounded hover:bg-error/10 transition-colors text-body-sm btn-dash-reject" data-id="${t.id}">Tolak</button>
                                </div>
                            ` : `
                                <p class="text-xs text-warning">Menunggu tinjauan Ketua.</p>
                            `}
                        </div>
                    `).join('')}
                    ${pendingTrxs.length === 0 ? '<div class="text-center py-8 text-on-surface-variant">Tidak ada pengajuan persetujuan tertunda.</div>' : ''}
                </div>
            </div>
        </div>
    `;

    // Set date text
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('id-ID', dateOptions);
    }

    // Chart.js Configuration
    Chart.defaults.color = '#86948a'; 
    Chart.defaults.font.family = 'Inter';

    // 1. Line Chart balance trend
    const ctxLine = document.getElementById('balanceChart');
    if (ctxLine) {
        const ctx = ctxLine.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)'); 
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.months,
                datasets: [{
                    label: 'Saldo Kas (Rp)',
                    data: chartData.monthlyBalance,
                    borderColor: '#10b981',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointBackgroundColor: '#0e1511',
                    pointBorderColor: '#10b981',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1a211d',
                        titleColor: '#dde4dd',
                        bodyColor: '#4edea3',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false
                    }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            callback: function(value) {
                                if (value >= 1000000) return (value / 1000000) + ' Jt';
                                return value;
                            }
                        }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 2. Donut Chart distributions
    const ctxDonut = document.getElementById('sourceChart');
    if (ctxDonut) {
        const sourcesVal = Object.values(chartData.sources);
        const hasData = sourcesVal.some(v => v > 0);
        const dataArr = hasData ? sourcesVal.slice(0, 3) : [55, 30, 15]; // Fallback to mock percents if empty

        new Chart(ctxDonut, {
            type: 'doughnut',
            data: {
                labels: ['Iuran Anggota', 'Donasi Eksternal', 'Sponsor/Event'],
                datasets: [{
                    data: dataArr,
                    backgroundColor: ['#4edea3', '#45dfa4', '#ffb3af'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1a211d',
                        bodyColor: '#dde4dd'
                    }
                }
            }
        });
    }

    // Bind event listeners for direct actions on approvals widget
    if (canApprove) {
        document.getElementById('dashboard-pending-list').addEventListener('click', async (e) => {
            const btnApprove = e.target.closest('.btn-dash-approve');
            const btnReject = e.target.closest('.btn-dash-reject');
            if (btnApprove) {
                const id = btnApprove.getAttribute('data-id');
                await setApprovalStatus(id, 'approved');
                render(container); // Refresh
            }
            if (btnReject) {
                const id = btnReject.getAttribute('data-id');
                await setApprovalStatus(id, 'rejected');
                render(container); // Refresh
            }
        });
    }
};
