# Kas Korda Bung Tomo Surabaya — Sistem Informasi Kas & Keuangan Event Organisasi

Aplikasi web pengelolaan kas dan keuangan organisasi berbasis Single-Page Application (SPA) menggunakan **Vanilla JS**, **Tailwind CSS**, dan **Firebase (Auth & Firestore)**. Aplikasi ini dirancang khusus untuk membantu bendahara mengelola keuangan secara transparan, akuntabel, dan rapi, lengkap dengan alur persetujuan pengeluaran (*approval workflow*) oleh Ketua.

---

## 🚀 Fitur Utama

### 1. Sistem Autentikasi & Hak Akses (Role-Based Access Control)
* Pendaftaran dan keamanan akun dikelola terpusat langsung dari Firebase Console.
* **Bendahara**: Menginput data kas, mengelola donatur, membuat event, dan mengekspor laporan.
* **Ketua**: Melakukan review, menyetujui, atau menolak pengajuan pengeluaran kas (tidak memiliki akses input kas).
* **Admin**: Memiliki akses penuh (input data + persetujuan + pengaturan sistem).

### 2. Alur Pengajuan & Persetujuan Kanban (Drag & Drop)
* Pengeluaran kas di atas **Rp 500.000** secara otomatis berstatus **Pending** (belum memotong saldo).
* Ketua dapat menyetujui atau menolak pengajuan secara visual menggunakan **Papan Kanban (HTML5 Drag & Drop)**.
* Pengkinian saldo utama dan pencatatan transaksi terjadi secara *real-time* setelah persetujuan.

### 3. Manajemen Acara / Event Organisasi
* Pencatatan alokasi dana dan anggaran terpisah per kegiatan.
* Visualisasi progress bar dana terkumpul dibandingkan target anggaran acara.

### 4. Pengelolaan Iuran & Donasi (Kontribusi)
* Modul pencatatan iuran wajib anggota, donasi sukarela, dan dana sponsorship.
* Sinkronisasi data otomatis: mengubah kontribusi menjadi **Lunas** akan otomatis mencatat uang masuk di Buku Kas Utama.
* Ekspor rekapitulasi data kontributor langsung ke format **CSV / Excel**.

### 5. Laporan Keuangan Cetak & PDF
* Filter laporan fleksibel (Harian, Mingguan, Bulanan, Tahunan, atau per Event).
* Dilengkapi grafik diagram batang ringkasan laporan (**Chart.js**) yang ikut tercetak otomatis.
* Desain cetakan khusus (CSS print layout) yang menghasilkan lembar dokumen bersih tanpa sidebar dan tombol navigasi aplikasi.

### 6. Transparansi Log Audit (Audit Trail)
* Setiap tindakan penting (login, input kas, perubahan status lunas, persetujuan ketua) dicatat secara otomatis dan permanen demi akuntabilitas keuangan organisasi.

---

## 🛠️ Teknologi yang Digunakan
* **Core Logic**: Vanilla JavaScript (ES6 Modules)
* **Styling & Icons**: Tailwind CSS CDN & Google Material Symbols Outlined
* **Database & Auth**: Firebase Authentication & Cloud Firestore (SDK v10.8)
* **Visualisasi Data**: Chart.js
* **Hosting**: GitHub Pages

---

## 🌐 Publikasi / Deployment ke GitHub Pages
1. Masuk ke tab **Settings** repositori Anda di GitHub.
2. Pilih menu **Pages** di sidebar kiri.
3. Di bagian **Build and deployment** -> **Branch**, pilih **main** dan folder **/(root)**, lalu klik **Save**.
4. Dalam 1-2 menit, aplikasi Anda akan aktif secara online di **`https://dhaphreddd.github.io/Kas-Korda-BungTomo/`**.
