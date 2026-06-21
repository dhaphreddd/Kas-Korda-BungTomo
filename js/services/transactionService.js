import { db, isMock } from '../firebase-config.js';
import { getCurrentUser } from '../auth.js';

// Write log to audit logs
const addAuditLog = (action) => {
    const user = getCurrentUser();
    const username = user ? user.nama : 'System';
    const log = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        user: username,
        action: action,
        timestamp: new Date().toISOString()
    };
    
    if (isMock) {
        const logs = JSON.parse(localStorage.getItem('kas_korda_audit_logs') || '[]');
        logs.unshift(log);
        localStorage.setItem('kas_korda_audit_logs', JSON.stringify(logs));
    } else {
        // Firebase Firestore write (non-blocking for UX)
        import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js").then(({ collection, addDoc }) => {
            addDoc(collection(db, 'audit_logs'), log);
        });
    }
};

// Get all transactions
export const getTransactions = async () => {
    if (isMock) {
        return JSON.parse(localStorage.getItem('kas_korda_transactions') || '[]');
    } else {
        const { collection, getDocs, query, orderBy } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const q = query(collection(db, 'transactions'), orderBy('tanggal', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};

// Create a new transaction
export const createTransaction = async (data) => {
    // If expense and nominal > 500.000, status must be pending approval
    const thresholdApproval = 500000;
    let finalStatus = 'approved';
    if (data.jenis === 'pengeluaran' && data.nominal > thresholdApproval) {
        finalStatus = 'pending';
    }
    
    const transaction = {
        tanggal: data.tanggal || new Date().toISOString().split('T')[0],
        jenis: data.jenis, // 'pemasukan' / 'pengeluaran'
        sumber: data.sumber,
        eventId: data.eventId || null,
        nominal: Number(data.nominal),
        keterangan: data.keterangan || '',
        status: finalStatus // 'pending', 'approved', 'rejected'
    };

    if (isMock) {
        const trxs = JSON.parse(localStorage.getItem('kas_korda_transactions') || '[]');
        transaction.id = 'trx_' + Date.now();
        trxs.unshift(transaction);
        localStorage.setItem('kas_korda_transactions', JSON.stringify(trxs));
        
        // Log action
        const actionMsg = `Menambahkan ${transaction.jenis} Rp ${transaction.nominal.toLocaleString('id-ID')} (${transaction.sumber})${finalStatus === 'pending' ? ' - Menunggu Persetujuan Ketua' : ''}`;
        addAuditLog(actionMsg);
        
        return transaction;
    } else {
        const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const docRef = await addDoc(collection(db, 'transactions'), transaction);
        
        const actionMsg = `Menambahkan ${transaction.jenis} Rp ${transaction.nominal.toLocaleString('id-ID')} (${transaction.sumber})${finalStatus === 'pending' ? ' - Menunggu Persetujuan Ketua' : ''}`;
        addAuditLog(actionMsg);
        
        return { id: docRef.id, ...transaction };
    }
};

// Update an existing transaction
export const updateTransaction = async (id, data) => {
    if (isMock) {
        const trxs = JSON.parse(localStorage.getItem('kas_korda_transactions') || '[]');
        const idx = trxs.findIndex(t => t.id === id);
        if (idx !== -1) {
            const oldTrx = trxs[idx];
            // If nominal changed to > 500,000 on expense, reset status to pending
            let updatedStatus = oldTrx.status;
            if (data.jenis === 'pengeluaran' && Number(data.nominal) > 500000 && oldTrx.nominal <= 500000) {
                updatedStatus = 'pending';
            }
            
            trxs[idx] = { ...oldTrx, ...data, nominal: Number(data.nominal), status: updatedStatus };
            localStorage.setItem('kas_korda_transactions', JSON.stringify(trxs));
            
            addAuditLog(`Mengubah transaksi ${oldTrx.keterangan} -> ${data.keterangan}`);
            return trxs[idx];
        }
        throw new Error('Transaksi tidak ditemukan');
    } else {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const docRef = doc(db, 'transactions', id);
        await updateDoc(docRef, { ...data, nominal: Number(data.nominal) });
        addAuditLog(`Mengubah transaksi ID: ${id}`);
        return { id, ...data };
    }
};

// Delete a transaction
export const deleteTransaction = async (id) => {
    if (isMock) {
        const trxs = JSON.parse(localStorage.getItem('kas_korda_transactions') || '[]');
        const filtered = trxs.filter(t => t.id !== id);
        localStorage.setItem('kas_korda_transactions', JSON.stringify(filtered));
        addAuditLog(`Menghapus transaksi ID: ${id}`);
        return true;
    } else {
        const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const docRef = doc(db, 'transactions', id);
        await deleteDoc(docRef);
        addAuditLog(`Menghapus transaksi ID: ${id}`);
        return true;
    }
};

// Approve / Reject transaction workflow
export const setApprovalStatus = async (id, status) => {
    if (isMock) {
        const trxs = JSON.parse(localStorage.getItem('kas_korda_transactions') || '[]');
        const idx = trxs.findIndex(t => t.id === id);
        if (idx !== -1) {
            trxs[idx].status = status; // 'approved' / 'rejected'
            localStorage.setItem('kas_korda_transactions', JSON.stringify(trxs));
            
            const msg = status === 'approved' ? 'menyetujui' : 'menolak';
            addAuditLog(`Ketua ${msg} pengeluaran ${trxs[idx].keterangan} senilai Rp ${trxs[idx].nominal.toLocaleString('id-ID')}`);
            return trxs[idx];
        }
        throw new Error('Transaksi tidak ditemukan');
    } else {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const docRef = doc(db, 'transactions', id);
        await updateDoc(docRef, { status: status });
        
        addAuditLog(`Persetujuan status transaksi ${id} diset ke ${status}`);
        return { id, status };
    }
};

// Calculate actual Cash Balance
export const getCashBalance = async () => {
    const list = await getTransactions();
    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    
    list.forEach(t => {
        // Only approved transactions alter the actual current balance
        if (t.status === 'approved') {
            if (t.jenis === 'pemasukan') {
                totalPemasukan += Number(t.nominal);
            } else if (t.jenis === 'pengeluaran') {
                totalPengeluaran += Number(t.nominal);
            }
        }
    });
    
    return {
        saldo: totalPemasukan - totalPengeluaran,
        totalPemasukan,
        totalPengeluaran
    };
};
