import { showToast } from './utils.js';
import { login, logout, registerUser, initAuthListener, getCurrentUser } from './auth.js';
import { initRouter } from './router.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Refresh Lucide Icons global registry
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // 2. Setup Auth listener to handle session state changes dynamically
    initAuthListener(async (user) => {
        if (user) {
            document.getElementById('login-container').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');
            
            // Populate profile cards in Sidebar
            document.getElementById('user-name').innerText = user.nama;
            
            const roleEl = document.getElementById('user-role');
            roleEl.innerText = user.role.toUpperCase();
            
            document.getElementById('user-avatar').innerText = user.nama.charAt(0).toUpperCase();

            // Check if user has permission to add transactions (Bendahara or Admin)
            const canWrite = ['bendahara', 'admin'].includes(user.role);
            const floatBtn = document.getElementById('btn-floating-add');
            const sidebarActionBox = document.getElementById('sidebar-action-box');
            
            if (canWrite) {
                floatBtn?.classList.remove('hidden');
                sidebarActionBox?.classList.remove('hidden');
            } else {
                floatBtn?.classList.add('hidden');
                sidebarActionBox?.classList.add('hidden');
            }

            // Set different avatars for roles
            const avatarImg = document.getElementById('header-avatar-img');
            if (avatarImg) {
                if (user.role === 'bendahara') {
                    avatarImg.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuAkYBrXd4hzoKzg3MOjfDUEgUatJ6A8YtoE0tQZseBmBrKvuQYc7hfIzNdYgo1IzgomRecZxrN1ekJfNvgHq9PrqemoGErWuvVyYOEm71xpT90i0fmACkaCpZaD-gwF299aOMr84rhhfyyNJJ3j9fHMNx8xwyLNxlbzEq9B5WO85R_eI-yc8Hjtlc3KUVxxJYKBTgmxtZQqusyPG7O94GKWm03rFQOxBav0BxbwNE2K9HV_qU8VAcaGZMUusSF3ZFa5AjBg0_mFeA";
                } else if (user.role === 'ketua') {
                    avatarImg.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuBz0BpaYBjUOrrSJrlHKTLdg_pK5VeY2Y3XFhwIOkqeIVQ33FmdQE8DpX_5p1lFksLAurCIjIpitZ1J2WhdQHH8ZEPXEEb8O7urPPB9tf5Vhj5832LUCxK_IsLCD9LSGxJjwDNJDFjORIAWxJg4aHtAvuUcRSo2SABBbctUwZsTzlYZdC2OLFTYUvgUgoE53SHQ6oj08N8YOC0CF7rtFI4ugedd49ZDwvck09IRTrW4ybFcVk7j4PtAjq7KBxFgYysYqPJinpx2gw";
                } else {
                    avatarImg.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuBInDxgs3MXlePLGkoRqIozk57gsV3F-hoy6JPWphtk4MGNg5q9YLL8usf3woH2brIavkBHClHeALmvjpLHR7nsBYi__ZJuRNaVHWFeMiV3FBl-aNdp1WCt4sxSTWUAEKx8IRatJ7VGXakegxJbJwWhyIdDOMZR69_yQZmpQhzAcHHWOo9ZG1Us-JVku27HT5XZ2ZGp66FV-NKE2tYpEI_3Ft_n7W9LVG16KpHoUQUnjFISe_Rj1Jf8Umnh6qqaWdrnYYUxmDNfWw";
                }
            }

            // Set organization name in Sidebar & Header
            // In pure Firebase mode, we default to "Kas Korda Bung Tomo" and load settings from Firestore
            document.getElementById('org-name-sidebar').innerText = "Kas Korda BT";
            document.getElementById('org-name-header').innerText = "Kas Korda Bung Tomo";

            const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            const { db } = await import('./firebase-config.js');
            try {
                const docRef = doc(db, 'settings', 'org_profile');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const settings = docSnap.data();
                    document.getElementById('org-name-sidebar').innerText = settings.orgNama;
                    document.getElementById('org-name-header').innerText = settings.orgNama;
                }
            } catch (e) {
                console.error("Gagal memuat profil organisasi:", e);
            }

            // Fire up hash router engine
            await initRouter();
        } else {
            document.getElementById('app-container').classList.add('hidden');
            document.getElementById('login-container').classList.remove('hidden');
        }
    });

    // 3. Handle Login Form Submit
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            await login(email, password);
            showToast('Berhasil masuk ke sistem!');
        } catch (error) {
            showToast(error.message, 'danger');
        }
    });


    // 6. Sidebar Toggle listener (Mobile drawer)
    const btnToggle = document.getElementById('btn-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (btnToggle && sidebar) {
        btnToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });

        // Close sidebar drawer when clicking anywhere outside it on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 1024 && !sidebar.contains(e.target) && e.target !== btnToggle) {
                sidebar.classList.remove('open');
            }
        });
    }

    // Hide sidebar on navigating page in mobile
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth < 1024 && sidebar) {
                sidebar.classList.remove('open');
            }
        });
    });

    // 7. Global logout button click handlers
    document.getElementById('btn-logout').addEventListener('click', async () => {
        await logout();
        window.location.reload();
    });

    // 8. Quick Transaction triggers
    const triggerQuickTrx = () => {
        window.triggerTrxModal = true;
        window.location.hash = '#/transactions';
        // If already on transactions hash, trigger manually via dispatcher
        const currentHash = window.location.hash;
        if (currentHash === '#/transactions') {
            window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
    };
    
    document.getElementById('btn-floating-add')?.addEventListener('click', triggerQuickTrx);
    document.getElementById('sidebar-btn-quick-trx')?.addEventListener('click', triggerQuickTrx);
});
