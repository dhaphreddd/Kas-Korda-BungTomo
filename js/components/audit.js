import { isMock, db } from '../firebase-config.js';
import { formatDate, formatTime } from '../utils.js';

export const render = async (container) => {
    let logs = [];

    // Fetch logs
    if (isMock) {
        logs = JSON.parse(localStorage.getItem('kas_korda_audit_logs') || '[]');
    } else {
        try {
            const { collection, getDocs, query, orderBy, limit } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100));
            const snapshot = await getDocs(q);
            logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Gagal mengambil audit logs dari Firebase:', error);
        }
    }

    container.innerHTML = `
        <div class="glass-panel rounded-xl p-6 md:p-8">
            <div class="flex justify-between items-center mb-6">
                <h3 class="font-headline-md text-headline-md text-on-surface">Log Audit &amp; Aktivitas Sistem</h3>
                <button class="px-4 py-2 bg-transparent border border-outline-variant text-on-surface hover:border-primary hover:text-primary transition-colors rounded-lg font-body-sm text-body-sm flex items-center gap-2" id="btn-clear-logs-ui">
                    <span class="material-symbols-outlined text-[18px]">refresh</span> Segarkan Log
                </button>
            </div>
            
            <p class="text-on-surface-variant text-body-md mb-6">
                Menampilkan daftar pencatatan log historis yang merekam seluruh tindakan pengurus (Bendahara, Ketua, atau Admin) untuk menjamin akuntabilitas kas.
            </p>

            <div class="space-y-4" id="audit-logs-list">
                ${logs.map(log => {
                    return `
                        <div class="flex gap-4 p-4 border border-outline-variant/30 rounded-lg bg-surface-container-low hover:border-primary/20 transition-all">
                            <div class="text-xs text-on-surface-variant font-medium min-w-[100px] border-r border-outline-variant/50 pr-4">
                                <strong>${formatDate(log.timestamp)}</strong>
                                <span class="block text-secondary font-mono mt-0.5">${formatTime(log.timestamp)}</span>
                            </div>
                            <div class="flex-grow flex items-start gap-3">
                                <span class="px-2 py-0.5 rounded bg-primary-container/10 text-primary border border-primary/20 font-mono text-[10px] uppercase">
                                    @${log.user}
                                </span>
                                <span class="text-body-sm text-on-surface">${log.action}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
                ${logs.length === 0 ? '<div class="text-center py-12 text-on-surface-variant text-body-sm">Belum ada aktivitas tercatat.</div>' : ''}
            </div>
        </div>
    `;

    document.getElementById('btn-clear-logs-ui').addEventListener('click', () => render(container));
};
