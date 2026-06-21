import { db, isMock } from '../firebase-config.js';
import { createTransaction, getTransactions, deleteTransaction } from './transactionService.js';

// Get all contributions
export const getContributions = async () => {
    if (isMock) {
        return JSON.parse(localStorage.getItem('kas_korda_contributions') || '[]');
    } else {
        const { collection, getDocs, query, orderBy } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const q = query(collection(db, 'contributions'), orderBy('tanggal', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};

// Create a new contribution
export const createContribution = async (data) => {
    const contribution = {
        nama: data.nama,
        eventId: data.eventId,
        jenis: data.jenis, // 'iuran', 'donasi', 'sponsor'
        nominal: Number(data.nominal),
        status: data.status, // 'lunas', 'belum'
        tanggal: data.tanggal || new Date().toISOString().split('T')[0]
    };

    let newCtr = null;

    if (isMock) {
        const ctrs = JSON.parse(localStorage.getItem('kas_korda_contributions') || '[]');
        contribution.id = 'ctr_' + Date.now();
        ctrs.unshift(contribution);
        localStorage.setItem('kas_korda_contributions', JSON.stringify(ctrs));
        newCtr = contribution;
    } else {
        const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const docRef = await addDoc(collection(db, 'contributions'), contribution);
        newCtr = { id: docRef.id, ...contribution };
    }

    // Auto-create transaction if lunas
    if (newCtr.status === 'lunas') {
        const trx = await createTransaction({
            tanggal: newCtr.tanggal,
            jenis: 'pemasukan',
            sumber: newCtr.jenis,
            eventId: newCtr.eventId,
            nominal: newCtr.nominal,
            keterangan: `Pembayaran ${newCtr.jenis} oleh ${newCtr.nama} (Auto)`
        });
        // Link the transaction ID to the contribution if needed
        newCtr.transactionId = trx.id;
        await updateContributionStatus(newCtr.id, 'lunas', trx.id);
    }

    return newCtr;
};

// Update contribution payment status
export const updateContributionStatus = async (id, status, transactionId = null) => {
    if (isMock) {
        const ctrs = JSON.parse(localStorage.getItem('kas_korda_contributions') || '[]');
        const idx = ctrs.findIndex(c => c.id === id);
        if (idx !== -1) {
            const oldCtr = ctrs[idx];
            ctrs[idx] = { ...oldCtr, status, transactionId: transactionId || oldCtr.transactionId };
            localStorage.setItem('kas_korda_contributions', JSON.stringify(ctrs));
            
            // If updating status to lunas, and no transaction ID exists, trigger creation
            if (status === 'lunas' && !oldCtr.transactionId && !transactionId) {
                const trx = await createTransaction({
                    tanggal: new Date().toISOString().split('T')[0],
                    jenis: 'pemasukan',
                    sumber: oldCtr.jenis,
                    eventId: oldCtr.eventId,
                    nominal: oldCtr.nominal,
                    keterangan: `Pembayaran ${oldCtr.jenis} oleh ${oldCtr.nama} (Manual Approval)`
                });
                ctrs[idx].transactionId = trx.id;
                localStorage.setItem('kas_korda_contributions', JSON.stringify(ctrs));
            }
            // If changing to 'belum' from 'lunas', remove corresponding transaction
            else if (status === 'belum' && oldCtr.transactionId) {
                await deleteTransaction(oldCtr.transactionId);
                ctrs[idx].transactionId = null;
                localStorage.setItem('kas_korda_contributions', JSON.stringify(ctrs));
            }

            return ctrs[idx];
        }
    } else {
        const { doc, getDoc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const docRef = doc(db, 'contributions', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const oldCtr = docSnap.data();
            let finalTxId = transactionId || oldCtr.transactionId || null;
            
            if (status === 'lunas' && !oldCtr.transactionId && !transactionId) {
                const trx = await createTransaction({
                    tanggal: new Date().toISOString().split('T')[0],
                    jenis: 'pemasukan',
                    sumber: oldCtr.jenis,
                    eventId: oldCtr.eventId,
                    nominal: oldCtr.nominal,
                    keterangan: `Pembayaran ${oldCtr.jenis} oleh ${oldCtr.nama} (Manual Approval)`
                });
                finalTxId = trx.id;
            } else if (status === 'belum' && oldCtr.transactionId) {
                await deleteTransaction(oldCtr.transactionId);
                finalTxId = null;
            }
            
            await updateDoc(docRef, { status, transactionId: finalTxId });
            return { id, status, transactionId: finalTxId };
        }
    }
};

// Delete a contribution record
export const deleteContribution = async (id) => {
    if (isMock) {
        const ctrs = JSON.parse(localStorage.getItem('kas_korda_contributions') || '[]');
        const matched = ctrs.find(c => c.id === id);
        if (matched && matched.transactionId) {
            await deleteTransaction(matched.transactionId);
        }
        const filtered = ctrs.filter(c => c.id !== id);
        localStorage.setItem('kas_korda_contributions', JSON.stringify(filtered));
        return true;
    } else {
        const { doc, getDoc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const docRef = doc(db, 'contributions', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.transactionId) {
                await deleteTransaction(data.transactionId);
            }
        }
        await deleteDoc(docRef);
        return true;
    }
};
