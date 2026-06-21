// UTILITIES & HELPER FUNCTIONS

// Format nominal to Indonesian Rupiah
export const formatRupiah = (nominal) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(nominal || 0);
};

// Format ISO date string to Indonesian Date
export const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium'
    }).format(date);
};

// Format timestamp to clock format (HH:MM:SS)
export const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

// Show Toast Notifications
export const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', type === 'success' ? 'check-circle' : 'alert-circle');
    
    const text = document.createElement('span');
    text.innerText = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    container.appendChild(toast);

    // Re-trigger lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
};

// Export JSON array to CSV / Excel format
export const exportToCSV = (data, filename = 'rekap-keuangan.csv') => {
    if (!data || !data.length) {
        showToast('Tidak ada data untuk diekspor', 'danger');
        return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            // Format strings to avoid CSV breaking
            const escaped = ('' + (val ?? '')).replace(/"/g, '\\"');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    // Include UTF-8 BOM so Excel opens it with correct formatting
    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Ekspor Excel (CSV) berhasil diunduh');
    }
};

// Print / PDF Handler
export const printReport = (title, elementId, period = '') => {
    const printArea = document.getElementById(elementId);
    if (!printArea) return;

    // Create a print window or style wrapper
    const originalContent = document.body.innerHTML;
    
    // Add print header
    const printHeader = `
        <div class="print-report-header" style="display: block; text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #000; padding-bottom: 10px; color: black;">
            <h2 style="margin: 0; font-size: 20px;">KAS KORDA BUNG TOMO SURABAYA</h2>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Laporan Keuangan & Kegiatan Organisasi</p>
            <p style="margin: 2px 0 0 0; font-size: 12px; font-weight: bold;">Jenis Laporan: ${title}</p>
            ${period ? `<p style="margin: 2px 0 0 0; font-size: 12px; font-weight: bold; color: #333;">Periode: ${period}</p>` : ''}
            <p style="margin: 2px 0 0 0; font-size: 10px; color: #555;">Dicetak pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</p>
        </div>
    `;

    const printStyle = `
        <style>
            body { background: white !important; color: black !important; font-family: 'Inter', sans-serif !important; padding: 20px !important; }
            .sidebar, .bottom-nav, .content-header, .toast-container, .btn, .btn-icon-only, .filter-bar, .demo-login-helper { display: none !important; }
            .main-content { padding: 0 !important; margin: 0 !important; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { border-bottom: 2px solid black; padding: 8px; text-align: left; font-weight: bold; color: black !important; }
            td { border-bottom: 1px solid #ddd; padding: 8px; color: black !important; }
            .badge { border: 1px solid #333 !important; color: black !important; background: transparent !important; padding: 2px 5px !important; border-radius: 4px !important; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr) !important; gap: 15px !important; margin-bottom: 20px !important; }
            .stat-card { border: 1px solid black !important; padding: 15px !important; background: transparent !important; color: black !important; }
            .chart-card { display: none !important; } /* Hide charts in pure table reports print */
        </style>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>${title}</title>
                ${printStyle}
            </head>
            <body>
                ${printHeader}
                <div>${printArea.innerHTML}</div>
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Delay slightly to allow rendering
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
};

// Initial Mock Database setup in localStorage
export const initMockDatabase = () => {
    if (!localStorage.getItem('kas_korda_users')) {
        localStorage.setItem('kas_korda_users', JSON.stringify([
            { id: "bendahara_demo", nama: "Arset (Bendahara)", email: "bendahara@email.com", role: "bendahara" },
            { id: "ketua_demo", nama: "Bung Tomo (Ketua)", email: "ketua@email.com", role: "ketua" },
            { id: "admin_demo", nama: "Admin Korda", email: "admin@email.com", role: "admin" }
        ]));
    }

    if (!localStorage.getItem('kas_korda_events')) {
        localStorage.setItem('kas_korda_events', JSON.stringify([
            { id: "evt001", nama: "Kajian Bulanan Ramadhan", deskripsi: "Kajian rutin menjelang bulan suci Ramadhan", tanggalMulai: "2026-07-01", tanggalSelesai: "2026-07-03", targetDana: 5000000, anggaran: 3000000, status: "aktif" },
            { id: "evt002", nama: "Bakti Sosial Bung Tomo SBY", deskripsi: "Pembagian 200 paket sembako untuk yatim & dhuafa", tanggalMulai: "2026-08-15", tanggalSelesai: "2026-08-16", targetDana: 10000000, anggaran: 8000000, status: "aktif" },
            { id: "evt003", nama: "Milad Korda Surabaya", deskripsi: "Peringatan hari jadi organisasi Korda", tanggalMulai: "2026-05-10", tanggalSelesai: "2026-05-10", targetDana: 2500000, anggaran: 2500000, status: "selesai" }
        ]));
    }

    if (!localStorage.getItem('kas_korda_contributions')) {
        localStorage.setItem('kas_korda_contributions', JSON.stringify([
            { id: "ctr001", nama: "Ahmad", eventId: "evt001", jenis: "iuran", nominal: 50000, status: "lunas", tanggal: "2026-06-20" },
            { id: "ctr002", nama: "Budi", eventId: "evt001", jenis: "donasi", nominal: 500000, status: "lunas", tanggal: "2026-06-21" },
            { id: "ctr003", nama: "H. Slamet", eventId: "evt002", jenis: "sponsor", nominal: 3000000, status: "lunas", tanggal: "2026-06-21" },
            { id: "ctr004", nama: "Rudi", eventId: "evt001", jenis: "iuran", nominal: 50000, status: "belum", tanggal: "2026-06-21" },
            { id: "ctr005", nama: "Kholil", eventId: "evt002", jenis: "donasi", nominal: 1000000, status: "lunas", tanggal: "2026-06-21" }
        ]));
    }

    if (!localStorage.getItem('kas_korda_transactions')) {
        localStorage.setItem('kas_korda_transactions', JSON.stringify([
            { id: "trx001", tanggal: "2026-06-20", jenis: "pemasukan", sumber: "iuran", eventId: "evt001", nominal: 250000, keterangan: "Uang Pangkal & Iuran Bulanan Peserta", status: "approved" },
            { id: "trx002", tanggal: "2026-06-21", jenis: "pemasukan", sumber: "donasi", eventId: "evt001", nominal: 500000, keterangan: "Donasi Sukarela dari Hamba Allah", status: "approved" },
            { id: "trx003", tanggal: "2026-06-21", jenis: "pemasukan", sumber: "sponsor", eventId: "evt002", nominal: 3000000, keterangan: "Sponsorship Kemitraan Toko Berkah", status: "approved" },
            { id: "trx004", tanggal: "2026-06-21", jenis: "pengeluaran", sumber: "operasional", eventId: "evt001", nominal: 600000, keterangan: "Sewa Sound System & Genset", status: "pending" },
            { id: "trx005", tanggal: "2026-06-18", jenis: "pengeluaran", sumber: "konsumsi", eventId: "evt003", nominal: 1500000, keterangan: "Konsumsi Nasi Kotak Milad", status: "approved" }
        ]));
    }

    if (!localStorage.getItem('kas_korda_audit_logs')) {
        localStorage.setItem('kas_korda_audit_logs', JSON.stringify([
            { id: "log001", user: "bendahara", action: "Menambahkan event baru 'Kajian Bulanan Ramadhan'", timestamp: "2026-06-20T08:00:00.000Z" },
            { id: "log002", user: "bendahara", action: "Mencatat pemasukan donasi Rp500.000", timestamp: "2026-06-21T09:00:00.000Z" },
            { id: "log003", user: "bendahara", action: "Mengajukan pengajuan pengeluaran Rp600.000 (Sewa Sound System)", timestamp: "2026-06-21T10:15:00.000Z" }
        ]));
    }
    
    if (!localStorage.getItem('kas_korda_settings')) {
        localStorage.setItem('kas_korda_settings', JSON.stringify({
            orgNama: "Korda Bung Tomo Surabaya",
            orgAlamat: "Jl. Pemuda No. 45, Surabaya",
            orgBendahara: "Arset",
            orgKetua: "Bung Tomo"
        }));
    }
};
