import { logout, getCurrentUser } from '../auth.js';
import { db } from '../firebase-config.js';
import { showToast } from '../utils.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const render = async (container) => {
    const user = getCurrentUser();
    
    // Fetch organization settings from Firestore
    let orgSettings = {
        orgNama: "Kas Korda BT",
        orgAlamat: "Jl. Pemuda No. 45, Surabaya",
        orgBendahara: "Arset",
        orgKetua: "Bung Tomo"
    };

    try {
        const docRef = doc(db, 'settings', 'org_profile');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            orgSettings = docSnap.data();
        }
    } catch (e) {
        console.error("Gagal memuat profil organisasi dari Firestore:", e);
    }

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Organization Profile -->
            <div class="glass-panel rounded-xl p-6 md:p-8">
                <h3 class="font-headline-md text-headline-md text-on-surface mb-2">Profil Organisasi</h3>
                <p class="text-on-surface-variant text-body-md mb-6">
                    Kelola nama dan profil resmi Korda Bung Tomo Surabaya yang akan dicantumkan pada header laporan cetak.
                </p>
                <form id="org-settings-form" class="space-y-4">
                    <div class="flex flex-col gap-2">
                        <label class="text-body-sm font-bold text-on-surface">Nama Organisasi / Korda</label>
                        <input type="text" id="setting-org-nama" class="input-dark w-full rounded-lg py-2.5 px-3 text-body-sm" required value="${orgSettings.orgNama}">
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-body-sm font-bold text-on-surface">Alamat Sekretariat</label>
                        <textarea id="setting-org-alamat" rows="2" class="input-dark w-full rounded-lg py-2.5 px-3 text-body-sm" required>${orgSettings.orgAlamat}</textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-2">
                            <label class="text-body-sm font-bold text-on-surface">Nama Bendahara</label>
                            <input type="text" id="setting-org-bendahara" class="input-dark w-full rounded-lg py-2.5 px-3 text-body-sm" required value="${orgSettings.orgBendahara}">
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-body-sm font-bold text-on-surface">Nama Ketua</label>
                            <input type="text" id="setting-org-ketua" class="input-dark w-full rounded-lg py-2.5 px-3 text-body-sm" required value="${orgSettings.orgKetua}">
                        </div>
                    </div>
                    <button type="submit" class="btn-primary px-5 py-2.5 rounded-lg text-body-sm font-bold flex items-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">save</span> Simpan Profil
                    </button>
                </form>
            </div>

            <!-- Database Info Panel -->
            <div class="glass-panel rounded-xl p-6 md:p-8">
                <h3 class="font-headline-md text-headline-md text-on-surface mb-2">Penyimpanan Firebase Firestore</h3>
                <p class="text-on-surface-variant text-body-md mb-6">
                    Aplikasi saat ini terhubung langsung ke database cloud Firestore secara real-time. Pencadangan dan keamanan data dikelola secara terpusat oleh server Firebase.
                </p>
                <div class="p-4 rounded-lg bg-surface-container border border-outline-variant/30 flex items-center gap-3">
                    <span class="material-symbols-outlined text-primary text-[28px]">cloud_done</span>
                    <div>
                        <h4 class="text-sm font-bold text-on-surface">Status Sinkronisasi Aktif</h4>
                        <p class="text-xs text-on-surface-variant">Setiap penambahan atau pembaruan kas langsung tersimpan secara online.</p>
                    </div>
                </div>
            </div>

            <!-- Logout Panel -->
            <div class="glass-panel rounded-xl p-6 md:p-8 flex flex-col items-center justify-center text-center">
                <span class="material-symbols-outlined text-error text-[48px] mb-4">logout</span>
                <h3 class="font-headline-md text-headline-md text-on-surface mb-1">Keluar dari Sistem</h3>
                <p class="text-on-surface-variant text-body-md mb-6">
                    Anda sedang aktif sebagai <strong>${user.nama} (${user.role.toUpperCase()})</strong>.
                </p>
                <button class="w-full max-w-[200px] py-2.5 bg-error text-on-error font-bold rounded-lg hover:bg-error-container hover:text-white transition-colors" id="btn-logout-settings">Keluar Sekarang</button>
            </div>
        </div>
    `;

    // Save profile settings handler
    document.getElementById('org-settings-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const settings = {
            orgNama: document.getElementById('setting-org-nama').value,
            orgAlamat: document.getElementById('setting-org-alamat').value,
            orgBendahara: document.getElementById('setting-org-bendahara').value,
            orgKetua: document.getElementById('setting-org-ketua').value
        };

        try {
            const docRef = doc(db, 'settings', 'org_profile');
            await setDoc(docRef, settings);
            
            // Update header UI names dynamically
            const sidebarName = document.getElementById('org-name-sidebar');
            const headerName = document.getElementById('org-name-header');
            if (sidebarName) sidebarName.innerText = settings.orgNama;
            if (headerName) headerName.innerText = settings.orgNama;
            
            showToast('Profil organisasi berhasil disimpan!');
        } catch (error) {
            showToast('Gagal menyimpan profil: ' + error.message, 'danger');
        }
    });

    // Logout
    document.getElementById('btn-logout-settings').addEventListener('click', async () => {
        await logout();
        window.location.reload();
    });
};
