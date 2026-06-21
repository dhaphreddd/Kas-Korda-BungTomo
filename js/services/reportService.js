import { getTransactions } from './transactionService.js';
import { getContributions } from './contributionService.js';

// Helper: Filter approved transactions
const getApprovedTransactions = async () => {
    const list = await getTransactions();
    return list.filter(t => t.status === 'approved');
};

// Daily Report
export const getDailyReport = async (dateStr) => {
    const list = await getApprovedTransactions();
    return list.filter(t => t.tanggal === dateStr);
};

// Weekly Report
export const getWeeklyReport = async (startDateStr, endDateStr) => {
    const list = await getApprovedTransactions();
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);
    
    return list.filter(t => {
        const d = new Date(t.tanggal);
        return d >= start && d <= end;
    });
};

// Monthly Report
export const getMonthlyReport = async (year, month) => {
    const list = await getApprovedTransactions();
    return list.filter(t => {
        const d = new Date(t.tanggal);
        return d.getFullYear() === Number(year) && (d.getMonth() + 1) === Number(month);
    });
};

// Yearly Report
export const getYearlyReport = async (year) => {
    const list = await getApprovedTransactions();
    return list.filter(t => {
        const d = new Date(t.tanggal);
        return d.getFullYear() === Number(year);
    });
};

// Event Report
export const getEventReport = async (eventId) => {
    const list = await getApprovedTransactions();
    return list.filter(t => t.eventId === eventId);
};

// Contribution Recap (Iuran, Donasi, Sponsor)
export const getContributionsRecap = async (jenisFilter) => {
    const list = await getContributions();
    if (!jenisFilter) return list;
    return list.filter(c => c.jenis === jenisFilter);
};
