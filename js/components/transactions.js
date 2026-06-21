import { getTransactions, createTransaction, updateTransaction, deleteTransaction, setApprovalStatus } from '../services/transactionService.js';
import { getEvents } from '../services/eventService.js';
import { formatRupiah, formatDate } from '../utils.js';
import { getCurrentUser, hasAccess } from '../auth.js';

let activeTab = 'bukukas'; // 'bukukas' or 'kanban'

export const render = async (container) => {
    const transactions = await getTransactions();
    const events = await getEvents();
    const user = getCurrentUser();
    const canManage = hasAccess(['bendahara', 'admin']);
    const canApprove = hasAccess(['ketua', 'admin']);

    // Check if quick transaction modal was triggered from app.js FAB
    if (window.triggerTrxModal) {
        window.triggerTrxModal = false;
        setTimeout(() => openTransactionModal(events), 100);
    }

    // Build tabs and page structure
    container.innerHTML = `
        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
                <h2 class="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">Buku Kas &amp; Persetujuan</h2>
                <p class="font-body-md text-body-md text-on-surface-variant">Catat pemasukan, pengeluaran, dan tinjau persetujuan anggaran.</p>
            </div>
            
            <div class="flex items-center gap-3">
                <!-- Tabs Switcher -->
                <div class="bg-surface-container-low p-1 rounded-lg border border-outline-variant/50 flex">
                    <button class="px-4 py-1.5 rounded font-body-sm text-body-sm flex items-center gap-2 transition-colors ${activeTab === 'bukukas' ? 'bg-surface-variant text-on-surface font-bold' : 'text-on-surface-variant hover:text-on-surface'}" id="tab-btn-bukukas">
                        <span class="material-symbols-outlined text-[18px]">table_rows</span> Buku Kas
                    </button>
                    <button class="px-4 py-1.5 rounded font-body-sm text-body-sm flex items-center gap-2 transition-colors ${activeTab === 'kanban' ? 'bg-surface-variant text-on-surface font-bold' : 'text-on-surface-variant hover:text-on-surface'}" id="tab-btn-kanban">
                        <span class="material-symbols-outlined text-[18px]">view_kanban</span> Persetujuan Kanban
                    </button>
                </div>
                ${canManage ? `
                    <button class="h-10 px-5 rounded-lg bg-primary-container text-on-primary-container font-label-caps text-label-caps hover:bg-primary-fixed transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)]" id="btn-add-trx">
                        <span class="material-symbols-outlined text-[18px]">add</span> Catat Kas
                    </button>
                ` : ''}
            </div>
        </div>

        <div id="transactions-content-area">
            <!-- Dynamic Tab Content Rendering -->
        </div>
    `;

    // Bind tab events
    document.getElementById('tab-btn-bukukas').addEventListener('click', () => {
        activeTab = 'bukukas';
        render(container);
    });
    document.getElementById('tab-btn-kanban').addEventListener('click', () => {
        activeTab = 'kanban';
        render(container);
    });

    if (canManage) {
        document.getElementById('btn-add-trx').addEventListener('click', () => openTransactionModal(events));
    }

    const contentArea = document.getElementById('transactions-content-area');
    
    if (activeTab === 'bukukas') {
        renderBukuKas(contentArea, transactions, events, canManage, canApprove);
    } else {
        renderKanbanBoard(contentArea, transactions, events, canApprove);
    }
};

// ==========================================
// VIEW 1: BUKU KAS LEDGER VIEW
// ==========================================
const renderBukuKas = (outlet, transactions, events, canManage, canApprove) => {
    outlet.innerHTML = `
        <div class="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
            <!-- Filters Bar -->
            <div class="p-6 border-b border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-4 bg-surface-container">
                <div class="relative w-full md:w-64">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                    <input class="w-full bg-surface-dim border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-body-sm font-body-sm text-on-surface focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50" placeholder="Cari keterangan..." id="search-trx-input" type="text"/>
                </div>
                
                <div class="flex gap-3 w-full md:w-auto">
                    <div class="relative">
                        <select class="appearance-none bg-surface-dim border border-outline-variant rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:border-primary text-body-sm font-body-sm cursor-pointer" id="filter-jenis-select">
                            <option value="">Semua Aliran</option>
                            <option value="pemasukan">Pemasukan Only</option>
                            <option value="pengeluaran">Pengeluaran Only</option>
                        </select>
                        <span class="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
                    </div>
                    
                    <div class="relative">
                        <select class="appearance-none bg-surface-dim border border-outline-variant rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:border-primary text-body-sm font-body-sm cursor-pointer" id="filter-event-select">
                            <option value="">Semua Event</option>
                            ${events.map(e => `<option value="${e.id}">${e.nama}</option>`).join('')}
                        </select>
                        <span class="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
                    </div>
                </div>
            </div>

            <!-- Ledger Table -->
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-surface-container-lowest/50 border-b border-outline-variant/30">
                            <th class="py-4 px-6 text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider text-[11px]">Tanggal</th>
                            <th class="py-4 px-6 text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider text-[11px]">Aliran</th>
                            <th class="py-4 px-6 text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider text-[11px]">Event Terkait</th>
                            <th class="py-4 px-6 text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider text-[11px]">Kategori</th>
                            <th class="py-4 px-6 text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider text-[11px]">Keterangan</th>
                            <th class="py-4 px-6 text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider text-right text-[11px]">Nominal</th>
                            <th class="py-4 px-6 text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider text-right text-[11px]">Saldo Berjalan</th>
                            <th class="py-4 px-6 text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider text-center text-[11px]">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="text-body-sm font-body-sm text-on-surface divide-y divide-outline-variant/10" id="trx-table-rows">
                        <!-- Loaded dynamically -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const searchInput = document.getElementById('search-trx-input');
    const jenisSelect = document.getElementById('filter-jenis-select');
    const eventSelect = document.getElementById('filter-event-select');
    const tbody = document.getElementById('trx-table-rows');

    const updateLedgerRows = () => {
        const query = searchInput.value.toLowerCase();
        const jenisVal = jenisSelect.value;
        const eventVal = eventSelect.value;

        // Sort oldest first to calculate running balance
        const sorted = [...transactions].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
        let runningBalance = 0;
        
        const mapped = sorted.map(t => {
            if (t.status === 'approved') {
                if (t.jenis === 'pemasukan') runningBalance += t.nominal;
                else runningBalance -= t.nominal;
            }
            return { ...t, running: runningBalance };
        });

        // Show newest first for table listing
        const displayList = mapped.reverse().filter(t => {
            const matchesSearch = t.keterangan.toLowerCase().includes(query) || t.sumber.toLowerCase().includes(query);
            const matchesJenis = !jenisVal || t.jenis === jenisVal;
            const matchesEvent = !eventVal || t.eventId === eventVal;
            return matchesSearch && matchesJenis && matchesEvent;
        });

        tbody.innerHTML = '';

        if (displayList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-on-surface-variant">Transaksi tidak ditemukan.</td></tr>`;
            return;
        }

        displayList.forEach(t => {
            const isPem = t.jenis === 'pemasukan';
            const colorClass = isPem ? 'text-primary' : 'text-error';
            const prefix = isPem ? '+' : '-';
            const statusClass = t.status === 'approved' ? 'bg-primary/10 text-primary border-primary/20' : t.status === 'pending' ? 'bg-tertiary-container/10 text-tertiary font-bold border-tertiary/20' : 'bg-error/10 text-error border-error/20';
            const eventName = events.find(e => e.id === t.eventId)?.nama || 'Kas Umum';

            const tr = document.createElement('tr');
            tr.className = "hover:bg-surface-variant/30 transition-colors group";
            tr.innerHTML = `
                <td class="py-4 px-6 text-on-surface-variant">${formatDate(t.tanggal)}</td>
                <td class="py-4 px-6"><span class="font-bold ${colorClass}">${t.jenis.toUpperCase()}</span></td>
                <td class="py-4 px-6 text-on-surface-variant max-w-[150px] truncate" title="${eventName}">${eventName}</td>
                <td class="py-4 px-6 font-semibold text-xs">${t.sumber.toUpperCase()}</td>
                <td class="py-4 px-6 max-w-[200px] truncate" title="${t.keterangan}">${t.keterangan}</td>
                <td class="py-4 px-6 text-right font-semibold ${colorClass}">${prefix} ${formatRupiah(t.nominal)}</td>
                <td class="py-4 px-6 text-right font-bold text-secondary">${formatRupiah(t.running)}</td>
                <td class="py-4 px-6 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full font-label-caps text-[10px] ${statusClass} border">
                            ${t.status.toUpperCase()}
                        </span>
                        ${canManage ? `
                            <button class="text-on-surface-variant hover:text-primary transition-colors p-1 rounded hover:bg-surface-variant btn-edit-trx" data-id="${t.id}">
                                <span class="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button class="text-on-surface-variant hover:text-error transition-colors p-1 rounded hover:bg-surface-variant btn-delete-trx" data-id="${t.id}">
                                <span class="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        ` : ''}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    searchInput.addEventListener('input', updateLedgerRows);
    jenisSelect.addEventListener('change', updateLedgerRows);
    eventSelect.addEventListener('change', updateLedgerRows);

    // Initial load
    updateLedgerRows();

    // Ledger actions delegation
    tbody.addEventListener('click', async (evt) => {
        const editBtn = evt.target.closest('.btn-edit-trx');
        const deleteBtn = evt.target.closest('.btn-delete-trx');

        if (editBtn) {
            const id = editBtn.getAttribute('data-id');
            const target = transactions.find(t => t.id === id);
            openTransactionModal(events, target);
        }
        if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-id');
            if (confirm('Yakin ingin menghapus catatan kas ini?')) {
                await deleteTransaction(id);
                // Trigger full SPA redraw
                window.dispatchEvent(new HashChangeEvent('hashchange'));
            }
        }
    });
};

// ==========================================
// VIEW 2: KANBAN BOARD APPROVALS VIEW
// ==========================================
const renderKanbanBoard = (outlet, transactions, events, canApprove) => {
    // Filter transactions to show only expenses (pengeluaran) that are relevant for approvals
    const expenses = transactions.filter(t => t.jenis === 'pengeluaran');
    const waiting = expenses.filter(t => t.status === 'pending');
    const approved = expenses.filter(t => t.status === 'approved');
    const rejected = expenses.filter(t => t.status === 'rejected');

    outlet.innerHTML = `
        <!-- Kanban Board Layout -->
        <div class="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-4 kanban-scroll select-none">
            
            <!-- Column 1: Menunggu Tinjauan -->
            <div class="flex-shrink-0 w-full lg:w-[380px] flex flex-col bg-surface-container-lowest/50 rounded-xl border border-outline-variant/30 min-h-[400px]">
                <div class="p-4 border-b border-outline-variant/50 flex items-center justify-between bg-surface-container-lowest/90 backdrop-blur-sm rounded-t-xl">
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-tertiary-container"></span>
                        <h3 class="font-label-caps text-label-caps text-on-surface uppercase tracking-wider text-xs font-bold">Menunggu Tinjauan</h3>
                        <span class="ml-2 px-2 py-0.5 bg-surface-variant text-on-surface-variant rounded-full text-[10px] font-bold" id="counter-pending">${waiting.length}</span>
                    </div>
                </div>
                <div class="flex-1 p-3 space-y-4 overflow-y-auto" id="col-pending">
                    ${waiting.map(t => renderKanbanCard(t, events, canApprove)).join('')}
                    ${waiting.length === 0 ? '<div class="text-center py-12 text-on-surface-variant text-xs">Belum ada pengajuan.</div>' : ''}
                </div>
            </div>

            <!-- Column 2: Disetujui -->
            <div class="flex-shrink-0 w-full lg:w-[380px] flex flex-col bg-surface-container-lowest/50 rounded-xl border border-outline-variant/30 min-h-[400px]">
                <div class="p-4 border-b border-outline-variant/50 flex items-center justify-between bg-surface-container-lowest/90 backdrop-blur-sm rounded-t-xl">
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-primary-container"></span>
                        <h3 class="font-label-caps text-label-caps text-on-surface uppercase tracking-wider text-xs font-bold">Disetujui</h3>
                        <span class="ml-2 px-2 py-0.5 bg-surface-variant text-on-surface-variant rounded-full text-[10px] font-bold" id="counter-approved">${approved.length}</span>
                    </div>
                </div>
                <div class="flex-1 p-3 space-y-4 overflow-y-auto" id="col-approved">
                    ${approved.map(t => renderKanbanCard(t, events, false)).join('')}
                    ${approved.length === 0 ? '<div class="text-center py-12 text-on-surface-variant text-xs">Belum ada pengajuan disetujui.</div>' : ''}
                </div>
            </div>

            <!-- Column 3: Ditolak -->
            <div class="flex-shrink-0 w-full lg:w-[380px] flex flex-col bg-surface-container-lowest/50 rounded-xl border border-outline-variant/30 min-h-[400px]">
                <div class="p-4 border-b border-outline-variant/50 flex items-center justify-between bg-surface-container-lowest/90 backdrop-blur-sm rounded-t-xl">
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-error"></span>
                        <h3 class="font-label-caps text-label-caps text-on-surface uppercase tracking-wider text-xs font-bold">Ditolak</h3>
                        <span class="ml-2 px-2 py-0.5 bg-surface-variant text-on-surface-variant rounded-full text-[10px] font-bold" id="counter-rejected">${rejected.length}</span>
                    </div>
                </div>
                <div class="flex-1 p-3 space-y-4 overflow-y-auto" id="col-rejected">
                    ${rejected.map(t => renderKanbanCard(t, events, false)).join('')}
                    ${rejected.length === 0 ? '<div class="text-center py-12 text-on-surface-variant text-xs">Belum ada pengajuan ditolak.</div>' : ''}
                </div>
            </div>
        </div>
    `;

    // Enable HTML5 drag events if user has Ketua or Admin permission
    if (canApprove) {
        setupKanbanDragDrop(outlet);
    }

    // Direct click handler events for buttons
    outlet.addEventListener('click', async (e) => {
        const btnApprove = e.target.closest('.btn-kanban-approve');
        const btnReject = e.target.closest('.btn-kanban-reject');
        
        if (btnApprove) {
            const id = btnApprove.getAttribute('data-id');
            await setApprovalStatus(id, 'approved');
            window.dispatchEvent(new HashChangeEvent('hashchange')); // Redraw
        }
        if (btnReject) {
            const id = btnReject.getAttribute('data-id');
            await setApprovalStatus(id, 'rejected');
            window.dispatchEvent(new HashChangeEvent('hashchange')); // Redraw
        }
    });
};

const renderKanbanCard = (t, events, showActions) => {
    const eventName = events.find(e => e.id === t.eventId)?.nama || 'Kas Umum';
    return `
        <div class="bg-surface-container-low border border-outline-variant/50 rounded-lg p-4 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.05)] transition-all group cursor-grab active:cursor-grabbing" draggable="true" id="kanbancard-${t.id}">
            <div class="flex justify-between items-start mb-3">
                <span class="px-2.5 py-1 bg-surface-variant text-on-surface rounded font-label-caps text-[10px]">#TRX-${t.id.slice(-4).toUpperCase()}</span>
                <span class="text-on-surface-variant text-[11px]">${formatDate(t.tanggal)}</span>
            </div>
            <div class="mb-4">
                <p class="font-body-sm text-body-sm text-on-surface-variant mb-1">${t.sumber.toUpperCase()} • ${eventName}</p>
                <h4 class="font-body-lg text-body-lg text-on-surface font-semibold line-clamp-2">${t.keterangan}</h4>
            </div>
            <div class="mb-4 bg-background p-3 rounded-md border border-outline-variant/30">
                <p class="font-label-caps text-label-caps text-on-surface-variant mb-1 text-[10px]">Total Nominal</p>
                <p class="font-numeric-lg text-[22px] text-error font-bold">${formatRupiah(t.nominal)}</p>
            </div>
            ${showActions ? `
                <div class="flex gap-2 pt-3 border-t border-outline-variant/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="flex-1 py-1.5 border border-error text-error hover:bg-error/10 rounded font-body-sm text-[12px] font-medium transition-colors btn-kanban-reject" data-id="${t.id}">Tolak</button>
                    <button class="flex-1 py-1.5 bg-primary-container text-on-primary-container hover:bg-primary rounded font-body-sm text-[12px] font-bold transition-colors btn-kanban-approve" data-id="${t.id}">Setujui</button>
                </div>
            ` : ''}
        </div>
    `;
};

// HTML5 Drag and Drop Handlers
const setupKanbanDragDrop = (boardOutlet) => {
    const cards = boardOutlet.querySelectorAll('[id^="kanbancard-"]');
    const columns = [
        { el: document.getElementById('col-pending'), status: 'pending' },
        { el: document.getElementById('col-approved'), status: 'approved' },
        { el: document.getElementById('col-rejected'), status: 'rejected' }
    ];

    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', card.id);
            card.style.opacity = '0.5';
        });
        card.addEventListener('dragend', () => {
            card.style.opacity = '1';
            columns.forEach(col => col.el.classList.remove('drag-over'));
        });
    });

    columns.forEach(col => {
        if (!col.el) return;
        col.el.addEventListener('dragover', (e) => {
            e.preventDefault();
            col.el.classList.add('drag-over');
        });
        col.el.addEventListener('dragleave', () => {
            col.el.classList.remove('drag-over');
        });
        col.el.addEventListener('drop', async (e) => {
            e.preventDefault();
            col.el.classList.remove('drag-over');
            
            const cardId = e.dataTransfer.getData('text/plain');
            const card = document.getElementById(cardId);
            if (!card) return;

            const trxId = cardId.split('kanbancard-')[1];
            
            // Move node visually first for fast feedback
            col.el.appendChild(card);
            
            // Update Firestore/LocalStorage
            await setApprovalStatus(trxId, col.status);
            
            // Redraw panel to recalculate balances and counts
            window.dispatchEvent(new HashChangeEvent('hashchange'));
        });
    });
};

// ==========================================
// TRANSACTIONS FORM MODAL
// ==========================================
const openTransactionModal = (eventsList, trxObj = null) => {
    const modal = document.getElementById('modal-container');
    const card = document.getElementById('modal-card');
    if (!modal || !card) return;

    const isEdit = !!trxObj;
    
    card.innerHTML = `
        <div class="flex justify-between items-center mb-6 border-b border-outline-variant/30 pb-4">
            <h3 class="text-headline-md font-headline-md text-on-surface">${isEdit ? 'Edit Transaksi' : 'Catat Transaksi Baru'}</h3>
            <button class="text-on-surface-variant hover:text-on-surface" id="btn-close-trx-modal">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>
        <form id="trx-form" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                    <label class="text-body-sm font-bold text-on-surface">Tanggal Transaksi</label>
                    <input type="date" id="trx-tanggal" class="input-dark w-full rounded-lg py-2.5 px-3 text-body-sm" required value="${isEdit ? trxObj.tanggal : new Date().toISOString().split('T')[0]}">
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-body-sm font-bold text-on-surface">Aliran Kas</label>
                    <select id="trx-jenis" class="input-dark w-full rounded-lg py-2.5 px-3 text-body-sm">
                        <option value="pemasukan" ${isEdit && trxObj.jenis === 'pemasukan' ? 'selected' : ''}>Pemasukan (Uang Masuk)</option>
                        <option value="pengeluaran" ${isEdit && trxObj.jenis === 'pengeluaran' ? 'selected' : ''}>Pengeluaran (Uang Keluar)</option>
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                    <label class="text-body-sm font-bold text-on-surface">Kategori Transaksi</label>
                    <select id="trx-sumber" class="input-dark w-full rounded-lg py-2.5 px-3 text-body-sm">
                        <!-- Loaded dynamically based on jenis -->
                    </select>
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-body-sm font-bold text-on-surface">Dihubungkan ke Event</label>
                    <select id="trx-event" class="input-dark w-full rounded-lg py-2.5 px-3 text-body-sm">
                        <option value="">Kas Umum Organisasi</option>
                        ${eventsList.map(e => `<option value="${e.id}" ${isEdit && trxObj.eventId === e.id ? 'selected' : ''}>${e.nama}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <label class="text-body-sm font-bold text-on-surface">Nominal Rupiah (Rp)</label>
                <input type="number" id="trx-nominal" class="input-dark w-full rounded-lg py-2.5 px-3 text-body-sm" required placeholder="Contoh: 150000" value="${isEdit ? trxObj.nominal : ''}">
                <p class="text-[11px] text-on-surface-variant">
                    * Pengeluaran diatas Rp 500.000 otomatis dialihkan ke status "Pending" untuk disetujui Ketua.
                </p>
            </div>

            <div class="flex flex-col gap-2">
                <label class="text-body-sm font-bold text-on-surface">Keterangan Tambahan</label>
                <textarea id="trx-keterangan" rows="2" class="input-dark w-full rounded-lg py-2.5 px-3 text-body-sm" placeholder="Sewa sound system, Donasi Hamba Allah, dll" required>${isEdit ? trxObj.keterangan : ''}</textarea>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-outline-variant/30 mt-6">
                <button type="button" class="px-4 py-2 border border-outline-variant text-on-surface rounded-lg text-body-sm" id="btn-cancel-trx-modal">Batal</button>
                <button type="submit" class="btn-primary px-5 py-2 rounded-lg text-body-sm font-bold">${isEdit ? 'Simpan' : 'Catat Kas'}</button>
            </div>
        </form>
    `;

    // Category selector loaders
    const selectJenis = document.getElementById('trx-jenis');
    const selectSumber = document.getElementById('trx-sumber');
    
    const populateCategories = () => {
        const jenis = selectJenis.value;
        selectSumber.innerHTML = '';
        
        const categories = jenis === 'pemasukan' 
            ? [
                { val: 'iuran', label: 'Iuran Peserta / Anggota' },
                { val: 'donasi', label: 'Donasi Jamaah' },
                { val: 'sponsor', label: 'Sponsorship / Sponsor' },
                { val: 'hibah', label: 'Hibah Organisasi' },
                { val: 'kas_awal', label: 'Kas Awal Organisasi' },
                { val: 'lainnya', label: 'Lain-Lain' }
              ]
            : [
                { val: 'konsumsi', label: 'Konsumsi Rapat / Makan' },
                { val: 'transportasi', label: 'Transportasi & Logistik' },
                { val: 'operasional', label: 'Operasional Event' },
                { val: 'dokumentasi', label: 'Dokumentasi & Media' },
                { val: 'atk', label: 'Alat Tulis Kantor (ATK)' },
                { val: 'publikasi', label: 'Publikasi & Humas' },
                { val: 'honorarium', label: 'Honorarium Pemateri' },
                { val: 'lainnya', label: 'Lain-Lain' }
              ];
              
        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.val;
            opt.innerText = c.label;
            if (isEdit && trxObj.sumber === c.val) {
                opt.selected = true;
            }
            selectSumber.appendChild(opt);
        });
    };

    selectJenis.addEventListener('change', populateCategories);
    populateCategories();

    modal.classList.remove('hidden');

    const closeModal = () => modal.classList.add('hidden');
    document.getElementById('btn-close-trx-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-trx-modal').addEventListener('click', closeModal);

    document.getElementById('trx-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            tanggal: document.getElementById('trx-tanggal').value,
            jenis: document.getElementById('trx-jenis').value,
            sumber: document.getElementById('trx-sumber').value,
            eventId: document.getElementById('trx-event').value || null,
            nominal: Number(document.getElementById('trx-nominal').value),
            keterangan: document.getElementById('trx-keterangan').value
        };

        if (isEdit) {
            await updateTransaction(trxObj.id, data);
        } else {
            await createTransaction(data);
        }

        closeModal();
        // Trigger full SPA redraw
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
};
