import { getTransactions, getCashBalance } from './transactionService.js';
import { getEvents } from './eventService.js';

export const getDashboardStats = async () => {
    const balanceInfo = await getCashBalance();
    const events = await getEvents();
    const trxs = await getTransactions();

    const activeEvents = events.filter(e => e.status === 'aktif').length;
    const completedEvents = events.filter(e => e.status === 'selesai').length;

    return {
        saldo: balanceInfo.saldo,
        totalPemasukan: balanceInfo.totalPemasukan,
        totalPengeluaran: balanceInfo.totalPengeluaran,
        eventAktif: activeEvents,
        eventSelesai: completedEvents,
        jumlahTransaksi: trxs.length,
        recentTransactions: trxs.slice(0, 5) // Recent 5 activities
    };
};

export const getChartData = async () => {
    const trxs = await getTransactions();
    const approvedTrxs = trxs.filter(t => t.status === 'approved');

    // 1. Monthly progression (12 months of current year)
    const currentYear = new Date().getFullYear();
    const monthlyData = Array(12).fill(0).map(() => ({ pemasukan: 0, pengeluaran: 0 }));
    
    // Sort transactions chronologically
    const sortedTrxs = [...approvedTrxs].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
    
    sortedTrxs.forEach(t => {
        const d = new Date(t.tanggal);
        if (d.getFullYear() === currentYear) {
            const m = d.getMonth();
            if (t.jenis === 'pemasukan') {
                monthlyData[m].pemasukan += Number(t.nominal);
            } else {
                monthlyData[m].pengeluaran += Number(t.nominal);
            }
        }
    });

    // Compute running balance month-by-month
    let runningBalance = 0;
    const balances = monthlyData.map(m => {
        runningBalance += (m.pemasukan - m.pengeluaran);
        return runningBalance;
    });

    // 2. Sources of Funds (Pemasukan)
    const sources = { iuran: 0, donasi: 0, sponsor: 0, hibah: 0, kas_awal: 0, lainnya: 0 };
    approvedTrxs.filter(t => t.jenis === 'pemasukan').forEach(t => {
        const src = t.sumber;
        if (sources.hasOwnProperty(src)) {
            sources[src] += Number(t.nominal);
        } else {
            sources.lainnya += Number(t.nominal);
        }
    });

    // 3. Category of Expenses (Pengeluaran)
    const categories = { konsumsi: 0, transportasi: 0, operasional: 0, dokumentasi: 0, atk: 0, publikasi: 0, honorarium: 0, lainnya: 0 };
    approvedTrxs.filter(t => t.jenis === 'pengeluaran').forEach(t => {
        const cat = t.sumber; // category is stored under sumber for expense type
        if (categories.hasOwnProperty(cat)) {
            categories[cat] += Number(t.nominal);
        } else {
            categories.lainnya += Number(t.nominal);
        }
    });

    return {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
        monthlyBalance: balances,
        monthlyIncome: monthlyData.map(m => m.pemasukan),
        monthlyExpense: monthlyData.map(m => m.pengeluaran),
        sources,
        categories
    };
};
