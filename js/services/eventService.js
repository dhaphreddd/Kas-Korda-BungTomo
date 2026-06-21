import { db, isMock } from '../firebase-config.js';
import { getTransactions } from './transactionService.js';

// Get all events
export const getEvents = async () => {
    if (isMock) {
        return JSON.parse(localStorage.getItem('kas_korda_events') || '[]');
    } else {
        const { collection, getDocs, query, orderBy } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const q = query(collection(db, 'events'), orderBy('tanggalMulai', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};

// Create a new event
export const createEvent = async (data) => {
    const event = {
        nama: data.nama,
        deskripsi: data.deskripsi || '',
        tanggalMulai: data.tanggalMulai,
        tanggalSelesai: data.tanggalSelesai,
        targetDana: Number(data.targetDana || 0),
        anggaran: Number(data.anggaran || 0),
        status: data.status || 'aktif' // 'aktif', 'selesai'
    };

    if (isMock) {
        const events = JSON.parse(localStorage.getItem('kas_korda_events') || '[]');
        event.id = 'evt_' + Date.now();
        events.unshift(event);
        localStorage.setItem('kas_korda_events', JSON.stringify(events));
        return event;
    } else {
        const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const docRef = await addDoc(collection(db, 'events'), event);
        return { id: docRef.id, ...event };
    }
};

// Update an existing event
export const updateEvent = async (id, data) => {
    if (isMock) {
        const events = JSON.parse(localStorage.getItem('kas_korda_events') || '[]');
        const idx = events.findIndex(e => e.id === id);
        if (idx !== -1) {
            events[idx] = { ...events[idx], ...data, targetDana: Number(data.targetDana || 0), anggaran: Number(data.anggaran || 0) };
            localStorage.setItem('kas_korda_events', JSON.stringify(events));
            return events[idx];
        }
        throw new Error('Event tidak ditemukan');
    } else {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const docRef = doc(db, 'events', id);
        await updateDoc(docRef, { ...data, targetDana: Number(data.targetDana || 0), anggaran: Number(data.anggaran || 0) });
        return { id, ...data };
    }
};

// Delete an event
export const deleteEvent = async (id) => {
    if (isMock) {
        const events = JSON.parse(localStorage.getItem('kas_korda_events') || '[]');
        const filtered = events.filter(e => e.id !== id);
        localStorage.setItem('kas_korda_events', JSON.stringify(filtered));
        return true;
    } else {
        const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const docRef = doc(db, 'events', id);
        await deleteDoc(docRef);
        return true;
    }
};

// Get Event financial summaries (real-time calculations)
export const getEventSummary = async (eventId) => {
    // Fetch related transactions
    const trxs = await getTransactions();
    const eventTrxs = trxs.filter(t => t.eventId === eventId && t.status === 'approved');
    
    let danaMasuk = 0;
    let pengeluaran = 0;
    
    eventTrxs.forEach(t => {
        if (t.jenis === 'pemasukan') {
            danaMasuk += Number(t.nominal);
        } else if (t.jenis === 'pengeluaran') {
            pengeluaran += Number(t.nominal);
        }
    });

    // Check contribution tables too for additional mapping
    let iuran = 0;
    let donasi = 0;
    let sponsor = 0;
    let kasOrganisasi = 0;

    eventTrxs.forEach(t => {
        if (t.jenis === 'pemasukan') {
            if (t.sumber === 'iuran') iuran += Number(t.nominal);
            else if (t.sumber === 'donasi') donasi += Number(t.nominal);
            else if (t.sumber === 'sponsor') sponsor += Number(t.nominal);
            else kasOrganisasi += Number(t.nominal);
        }
    });

    return {
        danaMasuk,
        pengeluaran,
        saldoEvent: danaMasuk - pengeluaran,
        breakdown: { iuran, donasi, sponsor, kasOrganisasi }
    };
};
