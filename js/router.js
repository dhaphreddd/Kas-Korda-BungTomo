import { getCurrentUser } from './auth.js';

// Router mapping hashes to component modules
const routes = {
    '#/dashboard': { title: 'Dashboard Keuangan', component: 'dashboard.js' },
    '#/events': { title: 'Daftar & Detail Event', component: 'events.js' },
    '#/transactions': { title: 'Buku Kas & Transaksi', component: 'transactions.js' },
    '#/contributions': { title: 'Pengelolaan Iuran & Donasi', component: 'contributions.js' },
    '#/reports': { title: 'Laporan Keuangan', component: 'reports.js' },
    '#/audit': { title: 'Audit Logs System', component: 'audit.js' },
    '#/settings': { title: 'Pengaturan & Profil', component: 'settings.js' }
};

// Route matching and view renderer
export const initRouter = async () => {
    const handleRoute = async () => {
        const hash = window.location.hash || '#/dashboard';
        const user = getCurrentUser();
        
        // 1. Auth Guard: Redirect to login if user not logged in
        if (!user) {
            document.getElementById('app-container').classList.add('hidden');
            document.getElementById('login-container').classList.remove('hidden');
            return;
        }

        // Show App Container
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');

        // Match route
        const route = routes[hash] || routes['#/dashboard'];
        
        // Update document title & page header
        document.title = `${route.title} — Kas Korda`;
        const headerTitle = document.getElementById('page-title');
        if (headerTitle) headerTitle.innerText = route.title;

        // Highlight active navigation items (Tailwind classes matching)
        document.querySelectorAll('#main-navigation a').forEach(item => {
            const pageName = item.getAttribute('data-page');
            const routePage = hash.replace('#/', '');
            if (pageName === routePage) {
                // Active classes
                item.className = "flex items-center gap-3 px-4 py-3 border-l-4 border-primary bg-primary-container/10 text-primary font-bold rounded-r-lg font-body-md text-body-md";
                // Add fill-icon helper to Material Icon if applicable
                const icon = item.querySelector('.material-symbols-outlined');
                if (icon) icon.style.fontVariationSettings = "'FILL' 1";
            } else {
                // Inactive classes
                item.className = "flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/20 transition-colors rounded-lg font-body-md text-body-md";
                const icon = item.querySelector('.material-symbols-outlined');
                if (icon) icon.style.fontVariationSettings = "'FILL' 0";
            }
        });

        // 2. Load & render component dynamically
        try {
            const modulePath = `./components/${route.component}`;
            const { render } = await import(modulePath);
            const outlet = document.getElementById('content-outlet');
            if (outlet) {
                outlet.innerHTML = ''; // Clear prior content
                await render(outlet);
            }
        } catch (error) {
            console.error(`Gagal memuat halaman ${route.component}:`, error);
            const outlet = document.getElementById('content-outlet');
            if (outlet) {
                outlet.innerHTML = `
                    <div class="panel-card glass text-center" style="padding: 3rem;">
                        <i data-lucide="alert-triangle" style="width: 48px; height: 48px; color: var(--danger); margin-bottom: 1rem;"></i>
                        <h3>Gagal Memuat Halaman</h3>
                        <p style="color: var(--text-muted); margin-top: 0.5rem;">${error.message}</p>
                    </div>
                `;
                if (window.lucide) window.lucide.createIcons();
            }
        }
    };

    // Listen to changes
    window.addEventListener('hashchange', handleRoute);
    
    // Initial run
    await handleRoute();
};
