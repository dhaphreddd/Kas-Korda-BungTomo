import { getDailyReport, getWeeklyReport, getMonthlyReport, getYearlyReport, getEventReport, getContributionsRecap } from '../services/reportService.js';
import { getEvents } from '../services/eventService.js';
import { formatRupiah, formatDate, exportToCSV, printReport } from '../utils.js';

export const render = async (container) => {
    const events = await getEvents();

    container.innerHTML = `
        <div class="glass-panel rounded-xl p-6 md:p-8">
            <h3 class="font-headline-md text-headline-md text-on-surface mb-2">Pusat Laporan Keuangan</h3>
            <p class="text-on-surface-variant text-body-md mb-6">
                Susun laporan secara spesifik dan unduh sebagai Excel (CSV) atau cetak langsung ke format PDF dengan tata letak rapi.
            </p>

            <!-- Report Config Form -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container/30 p-6 rounded-xl border border-outline-variant/30 mb-6">
                <div class="flex flex-col gap-2">
                    <label class="text-body-sm font-bold text-on-surface">Jenis Laporan</label>
                    <div class="relative">
                        <select id="report-type" class="input-dark w-full rounded-lg py-2.5 px-3 text-body-sm appearance-none cursor-pointer">
                            <option value="bulanan">Laporan Bulanan</option>
                            <option value="harian">Laporan Harian</option>
                            <option value="mingguan">Laporan Mingguan</option>
                            <option value="tahunan">Laporan Tahunan</option>
                            <option value="event">Laporan Per Event</option>
                            <option value="iuran">Rekap Iuran Peserta</option>
                            <option value="donasi">Rekap Donasi Jamaah</option>
                            <option value="sponsor">Rekap Sponsor</option>
                        </select>
                        <span class="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
                    </div>
                </div>

                <!-- Dynamic Filter Wrapper -->
                <div class="flex flex-col gap-2" id="dynamic-filter-container">
                    <!-- Loaded dynamically -->
                </div>
            </div>

            <!-- Actions Row -->
            <div class="flex gap-4 flex-wrap mb-6">
                <button class="h-10 px-5 rounded-lg bg-primary-container text-on-primary-container font-label-caps text-label-caps hover:bg-primary-fixed transition-colors flex items-center gap-2" id="btn-run-report">
                    <span class="material-symbols-outlined text-[18px]">refresh</span> Susun Laporan
                </button>
                <button class="h-10 px-5 rounded-lg bg-transparent border border-outline-variant text-on-surface font-label-caps text-label-caps hover:bg-surface-variant transition-colors flex items-center gap-2" id="btn-export-excel">
                    <span class="material-symbols-outlined text-[18px]">download</span> Ekspor Excel
                </button>
                <button class="h-10 px-5 rounded-lg bg-transparent border border-outline-variant text-on-surface font-label-caps text-label-caps hover:bg-surface-variant transition-colors flex items-center gap-2" id="btn-print-pdf">
                    <span class="material-symbols-outlined text-[18px]">printer</span> Cetak PDF
                </button>
            </div>

            <!-- Report Content Preview -->
            <div class="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest/30 p-6" id="report-preview-area">
                <div class="text-center py-12 text-on-surface-variant text-body-sm">
                    Silakan klik tombol "Susun Laporan" untuk menampilkan pratinjau data.
                </div>
            </div>
        </div>
    `;

    const selectType = document.getElementById('report-type');
    const filterContainer = document.getElementById('dynamic-filter-container');

    const updateFilterFields = () => {
        const type = selectType.value;
        filterContainer.innerHTML = '';

        if (type === 'harian') {
            filterContainer.innerHTML = `
                <label class="text-body-sm font-bold text-on-surface">Pilih Tanggal</label>
                <input type="date" id="filter-date" class="input-dark w-full rounded-lg py-2 px-3 text-body-sm" value="${new Date().toISOString().split('T')[0]}">
            `;
        } else if (type === 'mingguan') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            filterContainer.innerHTML = `
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label class="text-body-sm font-bold text-on-surface">Dari Tanggal</label>
                        <input type="date" id="filter-start-date" class="input-dark w-full rounded-lg py-2 px-3 text-body-sm" value="${oneWeekAgo.toISOString().split('T')[0]}">
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-body-sm font-bold text-on-surface">Sampai Tanggal</label>
                        <input type="date" id="filter-end-date" class="input-dark w-full rounded-lg py-2 px-3 text-body-sm" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
            `;
        } else if (type === 'bulanan') {
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();
            filterContainer.innerHTML = `
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label class="text-body-sm font-bold text-on-surface">Pilih Bulan</label>
                        <div class="relative">
                            <select id="filter-month" class="input-dark w-full rounded-lg py-2 px-3 text-body-sm appearance-none cursor-pointer">
                                ${Array(12).fill(0).map((_, i) => `<option value="${i+1}" ${currentMonth === i+1 ? 'selected' : ''}>Bulan ke-${i+1}</option>`).join('')}
                            </select>
                            <span class="material-symbols-outlined absolute right-3 top-2 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
                        </div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-body-sm font-bold text-on-surface">Pilih Tahun</label>
                        <input type="number" id="filter-year" class="input-dark w-full rounded-lg py-2 px-3 text-body-sm" value="${currentYear}">
                    </div>
                </div>
            `;
        } else if (type === 'tahunan') {
            const currentYear = new Date().getFullYear();
            filterContainer.innerHTML = `
                <label class="text-body-sm font-bold text-on-surface">Pilih Tahun</label>
                <input type="number" id="filter-year" class="input-dark w-full rounded-lg py-2 px-3 text-body-sm" value="${currentYear}">
            `;
        } else if (type === 'event') {
            filterContainer.innerHTML = `
                <label class="text-body-sm font-bold text-on-surface">Pilih Event Organisasi</label>
                <div class="relative">
                    <select id="filter-event" class="input-dark w-full rounded-lg py-2 px-3 text-body-sm appearance-none cursor-pointer">
                        ${events.map(e => `<option value="${e.id}">${e.nama}</option>`).join('')}
                    </select>
                    <span class="material-symbols-outlined absolute right-3 top-2 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
                </div>
            `;
        } else {
            filterContainer.innerHTML = `
                <label class="text-body-sm font-bold text-on-surface">Status Pembayaran</label>
                <div class="relative">
                    <select id="filter-status" class="input-dark w-full rounded-lg py-2 px-3 text-body-sm appearance-none cursor-pointer">
                        <option value="">Semua Status</option>
                        <option value="lunas">Lunas</option>
                        <option value="belum">Belum Lunas</option>
                    </select>
                    <span class="material-symbols-outlined absolute right-3 top-2 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
                </div>
            `;
        }
    };

    selectType.addEventListener('change', updateFilterFields);
    updateFilterFields(); // Run initial

    let currentCompiledData = [];

    const compileReport = async () => {
        const type = selectType.value;
        const preview = document.getElementById('report-preview-area');
        preview.innerHTML = `
            <div class="text-center py-12">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p class="text-on-surface-variant mt-2 text-sm">Menyusun data laporan...</p>
            </div>
        `;

        let data = [];

        try {
            if (type === 'harian') {
                const date = document.getElementById('filter-date').value;
                data = await getDailyReport(date);
            } else if (type === 'mingguan') {
                const start = document.getElementById('filter-start-date').value;
                const end = document.getElementById('filter-end-date').value;
                data = await getWeeklyReport(start, end);
            } else if (type === 'bulanan') {
                const month = document.getElementById('filter-month').value;
                const year = document.getElementById('filter-year').value;
                data = await getMonthlyReport(year, month);
            } else if (type === 'tahunan') {
                const year = document.getElementById('filter-year').value;
                data = await getYearlyReport(year);
            } else if (type === 'event') {
                const eventId = document.getElementById('filter-event').value;
                data = await getEventReport(eventId);
            } else {
                data = await getContributionsRecap(type);
                const statusF = document.getElementById('filter-status').value;
                if (statusF) {
                    data = data.filter(c => c.status === statusF);
                }
            }

            currentCompiledData = data;

            if (data.length === 0) {
                preview.innerHTML = `
                    <div class="text-center py-12 text-on-surface-variant text-body-sm">
                        Tidak ada catatan transaksi/kontribusi pada filter terpilih.
                    </div>
                `;
                return;
            }

            const isContributionReport = ['iuran', 'donasi', 'sponsor'].includes(type);
            
            const chartHTML = `
                <!-- Print only image container -->
                <div id="report-print-chart-container" style="display: none; width: 100%; text-align: center;" class="mb-6"></div>
                
                <!-- Interactive Chart Canvas for Screen View -->
                <div class="mb-6 border border-outline-variant/30 rounded-lg p-5 bg-surface-container-lowest h-[260px] flex flex-col no-print" id="report-chart-container">
                    <h4 class="font-headline-md text-headline-md text-on-surface mb-3 text-sm">Visualisasi Hasil Laporan</h4>
                    <div class="flex-grow relative h-40">
                        <canvas id="reportChartCanvas"></canvas>
                    </div>
                </div>
            `;

            let totalPemasukan = 0;
            let totalPengeluaran = 0;
            let totalSum = 0;

            if (isContributionReport) {
                totalSum = data.reduce((sum, item) => sum + item.nominal, 0);
                preview.innerHTML = `
                    ${chartHTML}
                    <h4 class="font-headline-md text-headline-md text-on-surface mb-4">Laporan Rekapitulasi ${type.toUpperCase()}</h4>
                    <div class="overflow-x-auto border border-outline-variant/30 rounded-lg">
                        <table class="w-full text-left border-collapse text-body-sm">
                            <thead>
                                <tr class="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant">
                                    <th class="py-3 px-4 font-semibold">Nama Donatur/Kontributor</th>
                                    <th class="py-3 px-4 font-semibold">Event Terkait</th>
                                    <th class="py-3 px-4 font-semibold">Tanggal</th>
                                    <th class="py-3 px-4 font-semibold text-right">Nominal</th>
                                    <th class="py-3 px-4 font-semibold text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-outline-variant/10 text-on-surface">
                                ${data.map(c => {
                                    const eventName = events.find(e => e.id === c.eventId)?.nama || 'Kas Umum';
                                    return `
                                        <tr>
                                            <td class="py-3 px-4 font-medium">${c.nama}</td>
                                            <td class="py-3 px-4 text-on-surface-variant">${eventName}</td>
                                            <td class="py-3 px-4 text-on-surface-variant">${formatDate(c.tanggal)}</td>
                                            <td class="py-3 px-4 text-right font-bold text-primary">${formatRupiah(c.nominal)}</td>
                                            <td class="py-3 px-4 text-center">
                                                <span class="inline-flex px-2 py-0.5 rounded text-[10px] ${c.status === 'lunas' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-error/10 text-error border border-error/20'}">
                                                    ${c.status.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                                <tr class="bg-surface-container-lowest font-bold border-t border-outline-variant">
                                    <td colspan="3" class="py-3 px-4 text-right">TOTAL:</td>
                                    <td class="py-3 px-4 text-right text-primary">${formatRupiah(totalSum)}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                data.forEach(t => {
                    if (t.jenis === 'pemasukan') totalPemasukan += t.nominal;
                    else totalPengeluaran += t.nominal;
                });

                preview.innerHTML = `
                    ${chartHTML}
                    <h4 class="font-headline-md text-headline-md text-on-surface mb-4">Laporan Buku Kas (${type.toUpperCase()})</h4>
                    <div class="overflow-x-auto border border-outline-variant/30 rounded-lg">
                        <table class="w-full text-left border-collapse text-body-sm">
                            <thead>
                                <tr class="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant">
                                    <th class="py-3 px-4 font-semibold">Tanggal</th>
                                    <th class="py-3 px-4 font-semibold">Aliran</th>
                                    <th class="py-3 px-4 font-semibold">Kategori</th>
                                    <th class="py-3 px-4 font-semibold">Keterangan</th>
                                    <th class="py-3 px-4 font-semibold text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-outline-variant/10 text-on-surface">
                                ${data.map(t => {
                                    const isPem = t.jenis === 'pemasukan';
                                    return `
                                        <tr>
                                            <td class="py-3 px-4 text-on-surface-variant">${formatDate(t.tanggal)}</td>
                                            <td class="py-3 px-4 font-semibold ${isPem ? 'text-primary' : 'text-error'}">${t.jenis.toUpperCase()}</td>
                                            <td class="py-3 px-4 text-on-surface-variant">${t.sumber.toUpperCase()}</td>
                                            <td class="py-3 px-4">${t.keterangan}</td>
                                            <td class="py-3 px-4 text-right font-bold ${isPem ? 'text-primary' : 'text-error'}">${isPem ? '+' : '-'} ${formatRupiah(t.nominal)}</td>
                                        </tr>
                                    `;
                                }).join('')}
                                <tr class="bg-surface-container-lowest font-bold border-t border-outline-variant/30 text-primary">
                                    <td colspan="4" class="py-3 px-4 text-right">TOTAL DANA MASUK:</td>
                                    <td class="py-3 px-4 text-right">${formatRupiah(totalPemasukan)}</td>
                                </tr>
                                <tr class="bg-surface-container-lowest font-bold text-error">
                                    <td colspan="4" class="py-3 px-4 text-right">TOTAL PENGELUARAN:</td>
                                    <td class="py-3 px-4 text-right">${formatRupiah(totalPengeluaran)}</td>
                                </tr>
                                <tr class="bg-surface-container font-bold text-secondary border-t border-outline-variant">
                                    <td colspan="4" class="py-3 px-4 text-right">SALDO BERSIH (SURPLUS):</td>
                                    <td class="py-3 px-4 text-right">${formatRupiah(totalPemasukan - totalPengeluaran)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;
            }

            // Initialize the Chart.js visualizer dynamically
            setTimeout(() => {
                const canvas = document.getElementById('reportChartCanvas');
                if (!canvas) return;

                let labels = [];
                let datasetData = [];
                let colors = [];
                let labelText = '';

                if (isContributionReport) {
                    let lunasCount = data.filter(c => c.status === 'lunas').reduce((sum, item) => sum + item.nominal, 0);
                    let belumCount = data.filter(c => c.status === 'belum').reduce((sum, item) => sum + item.nominal, 0);
                    labels = ['Lunas', 'Belum Lunas'];
                    datasetData = [lunasCount, belumCount];
                    colors = ['#10b981', '#ef4444'];
                    labelText = 'Total Nominal (Rp)';
                } else {
                    labels = ['Total Dana Masuk', 'Total Pengeluaran'];
                    datasetData = [totalPemasukan, totalPengeluaran];
                    colors = ['#10b981', '#ef4444'];
                    labelText = 'Nominal Keuangan (Rp)';
                }

                new Chart(canvas, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: labelText,
                            data: datasetData,
                            backgroundColor: colors,
                            borderRadius: 6,
                            maxBarThickness: 50
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                ticks: {
                                    color: '#86948a',
                                    callback: function(value) {
                                        if (value >= 1000000) return (value / 1000000) + ' Jt';
                                        return value;
                                    }
                                }
                            },
                            x: {
                                ticks: { color: '#86948a' }
                            }
                        }
                    }
                });
            }, 100);

        } catch (err) {
            preview.innerHTML = `<div class="text-error text-center py-12">Gagal menyusun laporan: ${err.message}</div>`;
        }
    };

    document.getElementById('btn-run-report').addEventListener('click', compileReport);

    document.getElementById('btn-export-excel').addEventListener('click', () => {
        const type = selectType.value;
        exportToCSV(currentCompiledData, `laporan-${type}-${Date.now()}.csv`);
    });

    document.getElementById('btn-print-pdf').addEventListener('click', () => {
        const type = selectType.value;
        let period = '';

        if (type === 'harian') {
            const dateVal = document.getElementById('filter-date')?.value;
            period = dateVal ? formatDate(dateVal) : '';
        } else if (type === 'mingguan') {
            const start = document.getElementById('filter-start-date')?.value;
            const end = document.getElementById('filter-end-date')?.value;
            period = start && end ? `${formatDate(start)} s/d ${formatDate(end)}` : '';
        } else if (type === 'bulanan') {
            const month = document.getElementById('filter-month')?.value;
            const year = document.getElementById('filter-year')?.value;
            const monthsName = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            period = month && year ? `${monthsName[month - 1]} ${year}` : '';
        } else if (type === 'tahunan') {
            const year = document.getElementById('filter-year')?.value;
            period = year ? `Tahun ${year}` : '';
        } else if (type === 'event') {
            const eventId = document.getElementById('filter-event')?.value;
            const eventObj = events.find(e => e.id === eventId);
            period = eventObj ? `Event: ${eventObj.nama}` : '';
        } else {
            const statusF = document.getElementById('filter-status')?.value || 'Semua';
            period = `Kategori ${type.toUpperCase()} (Status: ${statusF.toUpperCase()})`;
        }

        const canvas = document.getElementById('reportChartCanvas');
        const printContainer = document.getElementById('report-print-chart-container');
        if (canvas && printContainer) {
            const imgUrl = canvas.toDataURL('image/png');
            printContainer.innerHTML = `
                <div style="text-align: center; margin-bottom: 25px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; font-family: sans-serif; color: black; text-transform: uppercase;">Grafik Ringkasan Laporan</h4>
                    <img src="${imgUrl}" style="max-height: 200px; width: auto; max-width: 100%; display: inline-block;"/>
                </div>
            `;
            printContainer.style.display = 'block'; // Make visible inside printed scope
        }

        printReport(`Laporan ${type.toUpperCase()}`, 'report-preview-area', period);

        // Hide print container again after browser print trigger
        if (printContainer) {
            printContainer.style.display = 'none';
        }
    });
};
