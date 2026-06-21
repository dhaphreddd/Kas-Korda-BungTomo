import { getContributions, createContribution, updateContributionStatus, deleteContribution } from '../services/contributionService.js';
import { getEvents } from '../services/eventService.js';
import { formatRupiah, formatDate, exportToCSV } from '../utils.js';
import { getCurrentUser, hasAccess } from '../auth.js';

export const render = async (container) => {
    const list = await getContributions();
    const events = await getEvents();
    const user = getCurrentUser();
    const canManage = hasAccess(['bendahara', 'admin']);

    // Calculate quick stats
    let totalTerkumpul = 0;
    let totalBelumLunas = 0;
    let sponsorCount = 0;
    const contributorsCount = new Set(list.map(c => c.nama.toLowerCase())).size;

    list.forEach(c => {
        if (c.status === 'lunas') {
            totalTerkumpul += c.nominal;
            if (c.jenis === 'sponsor') sponsorCount++;
        } else {
            totalBelumLunas += c.nominal;
        }
    });

    const sponsorProgressPct = Math.min(Math.round((sponsorCount / 20) * 100), 100);

    container.innerHTML = `
        <!-- Page Header -->
        <div class="flex justify-between items-end mb-stack-lg">
            <div>
                <p class="text-body-sm font-label-caps text-primary tracking-widest uppercase mb-2 text-xs">Manajemen Dana</p>
                <h2 class="text-display-lg font-display-lg text-on-surface">Kontribusi &amp; Donasi</h2>
            </div>
            <div class="flex gap-4">
                <button class="px-4 py-2 bg-transparent border border-outline-variant text-on-surface rounded-md font-body-sm hover:border-primary hover:bg-primary/5 transition-colors flex items-center gap-2" id="btn-export-ctr-csv">
                    <span class="material-symbols-outlined text-[18px]">download</span>
                    Ekspor CSV
                </button>
                ${canManage ? `
                    <button class="px-4 py-2 bg-primary hover:bg-primary-fixed text-on-primary font-body-sm font-bold rounded-lg flex items-center justify-center gap-2" id="btn-add-contribution">
                        <span class="material-symbols-outlined text-[18px]">add</span>
                        Tambah Kontributor
                    </button>
                ` : ''}
            </div>
        </div>

        <!-- Bento Grid Stats Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-stack-lg">
            <!-- Total Funds -->
            <div class="bg-surface-container rounded-xl p-6 border border-white/5 relative overflow-hidden group hover:border-primary/30 transition-colors">
                <div class="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500"></div>
                <div class="flex justify-between items-start mb-4 relative z-10">
                    <h3 class="text-body-sm font-body-sm text-on-surface-variant text-xs">Total Dana Terkumpul</h3>
                    <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span class="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                    </div>
                </div>
                <div class="relative z-10">
                    <p class="text-numeric-lg font-numeric-lg text-on-surface mb-2" id="stat-total-ctr">${formatRupiah(totalTerkumpul)}</p>
                    <div class="flex items-center gap-2">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-caps text-[10px]">
                            <span class="material-symbols-outlined text-[12px] mr-1">trending_up</span>
                            +12.5%
                        </span>
                        <span class="text-body-sm font-body-sm text-on-surface-variant text-[12px]">dari bulan lalu</span>
                    </div>
                </div>
            </div>

            <!-- Total Contributors -->
            <div class="bg-surface-container rounded-xl p-6 border border-white/5 relative overflow-hidden group hover:border-primary/30 transition-colors">
                <div class="flex justify-between items-start mb-4 relative z-10">
                    <h3 class="text-body-sm font-body-sm text-on-surface-variant text-xs">Total Kontributor</h3>
                    <div class="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-on-surface">
                        <span class="material-symbols-outlined text-[18px]">groups</span>
                    </div>
                </div>
                <div class="relative z-10">
                    <p class="text-numeric-lg font-numeric-lg text-on-surface mb-2">${contributorsCount}</p>
                    <div class="flex items-center gap-2">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-caps text-[10px]">
                            +24 baru
                        </span>
                        <span class="text-body-sm font-body-sm text-on-surface-variant text-[12px]">minggu ini</span>
                    </div>
                </div>
            </div>

            <!-- Active Sponsors -->
            <div class="bg-surface-container rounded-xl p-6 border border-white/5 relative overflow-hidden group hover:border-primary/30 transition-colors">
                <div class="flex justify-between items-start mb-4 relative z-10">
                    <h3 class="text-body-sm font-body-sm text-on-surface-variant text-xs">Sponsor Aktif</h3>
                    <div class="w-8 h-8 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                        <span class="material-symbols-outlined text-[18px]">handshake</span>
                    </div>
                </div>
                <div class="relative z-10">
                    <p class="text-numeric-lg font-numeric-lg text-on-surface mb-2">${sponsorCount}</p>
                    <div class="w-full bg-surface-variant h-1.5 rounded-full mt-4 overflow-hidden">
                        <div class="bg-primary h-full rounded-full" style="width: ${sponsorProgressPct}%;"></div>
                    </div>
                    <p class="text-body-sm font-body-sm text-on-surface-variant text-[12px] mt-2 text-right">Target: 20 Sponsor (${sponsorProgressPct}% tercapai)</p>
                </div>
            </div>
        </div>

        <!-- Main Data Table Section -->
        <div class="bg-surface-container rounded-xl border border-white/5 overflow-hidden">
            <!-- Table Controls -->
            <div class="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container">
                <h3 class="text-headline-md font-headline-md text-on-surface text-lg">Daftar Kontribusi &amp; Donatur</h3>
                <div class="flex gap-3">
                    <div class="relative">
                        <select class="appearance-none bg-surface-container-high border border-outline-variant/50 text-body-sm font-body-sm text-on-surface rounded-md py-2 pl-4 pr-10 focus:outline-none focus:border-primary/50 cursor-pointer" id="filter-ctr-jenis">
                            <option value="">Semua Jenis</option>
                            <option value="iuran">Iuran Anggota</option>
                            <option value="donasi">Donasi Bebas</option>
                            <option value="sponsor">Sponsor</option>
                        </select>
                        <span class="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
                    </div>
                    
                    <div class="relative">
                        <select class="appearance-none bg-surface-container-high border border-outline-variant/50 text-body-sm font-body-sm text-on-surface rounded-md py-2 pl-4 pr-10 focus:outline-none focus:border-primary/50 cursor-pointer" id="filter-ctr-status">
                            <option value="">Semua Status</option>
                            <option value="lunas">Lunas</option>
                            <option value="belum">Belum Lunas</option>
                        </select>
                        <span class="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
                    </div>
                </div>
            </div>

            <!-- The Table -->
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-surface-container-lowest/50 border-b border-outline-variant/30">
                            <th class="py-4 px-6 text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider text-[11px]">Nama Kontributor</th>
                            <th class="py-4 px-6 text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider text-[11px]">Dihubungkan ke Event</th>
                            <th class="py-4 px-6 text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider text-[11px]">Jenis Transaksi</th>
                            <th class="py-4 px-6 text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider text-[11px]">Tanggal</th>
                            <th class="py-4 px-6 text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider text-right text-[11px]">Nominal (Rp)</th>
                            <th class="py-4 px-6 text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider text-center text-[11px]">Status</th>
                            <th class="py-4 px-6 text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider text-right text-[11px]">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="text-body-sm font-body-sm text-on-surface divide-y divide-outline-variant/10" id="ctr-table-rows">
                        <!-- Loaded dynamically -->
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination (Mock) -->
            <div class="p-4 border-t border-outline-variant/30 flex items-center justify-between bg-surface-container">
                <p class="text-body-sm font-body-sm text-on-surface-variant" id="ctr-pagination-text">Menampilkan 1 - 5 dari 124 data</p>
                <div class="flex gap-2">
                    <button class="w-8 h-8 rounded bg-surface-container border border-outline-variant/50 flex items-center justify-center text-on-surface-variant disabled:opacity-50" disabled>
                        <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <button class="w-8 h-8 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-body-sm">1</button>
                    <button class="w-8 h-8 rounded bg-surface-container border border-outline-variant/50 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-on-surface font-body-sm">2</button>
                    <button class="w-8 h-8 rounded bg-surface-container border border-outline-variant/50 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-on-surface font-body-sm">3</button>
                    <button class="w-8 h-8 rounded bg-surface-container border border-outline-variant/50 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-on-surface">
                        <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    const selectJenis = document.getElementById('filter-ctr-jenis');
    const selectStatus = document.getElementById('filter-ctr-status');
    const tbody = document.getElementById('ctr-table-rows');

    const updateTableRows = () => {
        const jenisVal = selectJenis.value;
        const statusVal = selectStatus.value;

        const filtered = list.filter(c => {
            const matchesJenis = !jenisVal || c.jenis === jenisVal;
            const matchesStatus = !statusVal || c.status === statusVal;
            return matchesJenis && matchesStatus;
        });

        tbody.innerHTML = '';
        document.getElementById('ctr-pagination-text').innerText = `Menampilkan 1 - ${filtered.length} dari ${filtered.length} data`;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-on-surface-variant">Kontribusi tidak ditemukan.</td></tr>`;
            return;
        }

        filtered.forEach(c => {
            const isLunas = c.status === 'lunas';
            const statusClass = isLunas ? 'bg-primary/10 text-primary border-primary/20' : 'bg-error/10 text-error border-error/20';
            const colorClass = isLunas ? 'text-primary' : 'text-error';
            const eventName = events.find(e => e.id === c.eventId)?.nama || 'Kas Umum';

            const tr = document.createElement('tr');
            tr.className = "hover:bg-surface-variant/30 transition-colors group";
            tr.innerHTML = `
                <td class="py-4 px-6 font-medium">${c.nama}</td>
                <td class="py-4 px-6 text-on-surface-variant truncate max-w-[150px]" title="${eventName}">${eventName}</td>
                <td class="py-4 px-6"><span class="badge badge-primary text-[10px]">${c.jenis.toUpperCase()}</span></td>
                <td class="py-4 px-6 text-on-surface-variant">${formatDate(c.tanggal)}</td>
                <td class="py-4 px-6 text-right font-bold ${colorClass}">${formatRupiah(c.nominal)}</td>
                <td class="py-4 px-6 text-center">
                    ${canManage ? `
                        <button class="inline-flex items-center px-2.5 py-1 rounded-full font-label-caps text-[10px] ${statusClass} border btn-toggle-ctr-status" data-id="${c.id}" data-status="${c.status}">
                            ${c.status.toUpperCase()} (Ubah)
                        </button>
                    ` : `
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full font-label-caps text-[11px] ${statusClass} border">
                            ${c.status.toUpperCase()}
                        </span>
                    `}
                </td>
                <td class="py-4 px-6 text-right">
                    ${canManage ? `
                        <button class="text-on-surface-variant hover:text-error transition-colors btn-delete-ctr" data-id="${c.id}">
                            <span class="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                    ` : '-'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    selectJenis.addEventListener('change', updateTableRows);
    selectStatus.addEventListener('change', updateTableRows);

    // Initial load
    updateTableRows();

    // Export CSV trigger
    document.getElementById('btn-export-ctr-csv').addEventListener('click', () => {
        exportToCSV(list, `rekap-kontribusi-${Date.now()}.csv`);
    });

    if (canManage) {
        document.getElementById('btn-add-contribution').addEventListener('click', () => openContributionModal(events));
    }

    // Toggle status & delete click delegation
    tbody.addEventListener('click', async (evt) => {
        const toggleBtn = evt.target.closest('.btn-toggle-ctr-status');
        const deleteBtn = evt.target.closest('.btn-delete-ctr');

        if (toggleBtn) {
            const id = toggleBtn.getAttribute('data-id');
            const status = toggleBtn.getAttribute('data-status');
            const nextStatus = status === 'lunas' ? 'belum' : 'lunas';
            await updateContributionStatus(id, nextStatus);
            // Redraw panel to recalculate totals
            render(container);
        }
        if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-id');
            if (confirm('Yakin ingin menghapus kontributor ini? Buku Kas terkait akan ikut diperbarui.')) {
                await deleteContribution(id);
                render(container);
            }
        }
    });
};

const openContributionModal = (eventsList) => {
    const modal = document.getElementById('modal-container');
    const card = document.getElementById('modal-card');
    if (!modal || !card) return;

    card.innerHTML = `
        <div class="flex justify-between items-center mb-6 border-b border-outline-variant/30 pb-4">
            <h3 class="text-headline-md font-headline-md text-on-surface">Catat Kontribusi Baru</h3>
            <button class="text-on-surface-variant hover:text-on-surface" id="btn-close-ctr-modal">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>
        <form id="contribution-form" class="space-y-4">
            <div class="flex flex-col gap-2">
                <label class="text-body-sm font-bold text-on-surface">Nama Peserta / Donatur</label>
                <input type="text" id="ctr-nama" class="input-dark w-full rounded-lg py-2.5 px-3 text-body-sm" required placeholder="Contoh: Ahmad Subardjo">
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                    <label class="text-body-sm font-bold text-on-surface">Jenis Kontribusi</label>
                    <select id="ctr-jenis" class="input-dark w-full rounded-lg py-2.5 px-3 text-body-sm">
                        <option value="iuran">Iuran Peserta / Anggota</option>
                        <option value="donasi">Donasi Jamaah</option>
                        <option value="sponsor">Sponsorship</option>
                    </select>
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-body-sm font-bold text-on-surface">Dihubungkan ke Event</label>
                    <select id="ctr-event" class="input-dark w-full rounded-lg py-2.5 px-3 text-body-sm">
                        <option value="">Kas Umum Organisasi</option>
                        ${eventsList.map(e => `<option value="${e.id}">${e.nama}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                    <label class="text-body-sm font-bold text-on-surface">Nominal Rupiah (Rp)</label>
                    <input type="number" id="ctr-nominal" class="input-dark w-full rounded-lg py-2.5 px-3 text-body-sm" required placeholder="50000">
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-body-sm font-bold text-on-surface">Tanggal Pembayaran</label>
                    <input type="date" id="ctr-tanggal" class="input-dark w-full rounded-lg py-2.5 px-3 text-body-sm" required value="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <label class="text-body-sm font-bold text-on-surface">Status Awal</label>
                <select id="ctr-status" class="input-dark w-full rounded-lg py-2.5 px-3 text-body-sm">
                    <option value="belum">Belum Lunas (Tagihan)</option>
                    <option value="lunas">Lunas (Langsung Catat Kas)</option>
                </select>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-outline-variant/30 mt-6">
                <button type="button" class="px-4 py-2 border border-outline-variant text-on-surface rounded-lg text-body-sm" id="btn-cancel-ctr-modal">Batal</button>
                <button type="submit" class="btn-primary px-5 py-2 rounded-lg text-body-sm font-bold">Simpan Data</button>
            </div>
        </form>
    `;

    modal.classList.remove('hidden');

    const closeModal = () => modal.classList.add('hidden');
    document.getElementById('btn-close-ctr-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-ctr-modal').addEventListener('click', closeModal);

    document.getElementById('contribution-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            nama: document.getElementById('ctr-nama').value,
            jenis: document.getElementById('ctr-jenis').value,
            eventId: document.getElementById('ctr-event').value || null,
            nominal: Number(document.getElementById('ctr-nominal').value),
            tanggal: document.getElementById('ctr-tanggal').value,
            status: document.getElementById('ctr-status').value
        };

        await createContribution(data);
        closeModal();
        render(document.getElementById('content-outlet'));
    });
};
