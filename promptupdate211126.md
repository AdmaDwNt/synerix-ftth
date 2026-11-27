# SYSTEM & IMPLEMENTATION PROMPT: FTTH COMMAND CENTER UPGRADE (V2 - NON-AI & DYNAMIC SCRAPER CONFIG)

Kamu bertindak sebagai **Senior Full-Stack Engineer & Security Architect**. Kamu sudah memahami arsitektur project **Command Center FTTH** ini (Next.js + Tailwind CSS + Database) yang memiliki mekanisme **scraping data dari Billingnesia** (yang saat ini dipicu melalui input pencarian di `/dismantles` dan work logs `/pekerjaan`).

Tugasmu adalah mengimplementasikan seluruh peningkatan fitur operasional, konfigurasi scraper dinamis, UI/UX, dan keamanan berikut tanpa mengubah bahasa desain yang sudah ada (**Light Clean Surface `#F8FAFC`/`#FFFFFF`, aksen Emerald/Teal, dan Dark Banner/Card kontras tinggi**).

**CATATAN PENTING:** Jangan gunakan integrasi AI / LLM eksternal apa pun untuk tahap ini. Semua proses parsing, pembersihan data, dan pengecekan duplikasi hasil scraping dilakukan menggunakan *rule-based parser* (regex/DOM/string parser standar di backend) dan validasi manual oleh user melalui tabel *Staging*.

---

## 1. MANAJEMEN KONFIGURASI SCRAPING DINAMIS & STAGING BILLINGNESIA

### A. Konfigurasi Domain & Endpoint Billingnesia di Settings (Simpan ke Database)
* **Masalah Saat Ini:** Domain dan URL target scraping Billingnesia masih ditulis langsung (*hardcoded*) di dalam kode program. Jika suatu saat domain/IP Billingnesia berubah, kode harus diedit ulang.
* **Solusi yang Diminta:**
  1. Buat tabel konfigurasi di database (misal `scraper_configs` atau `system_settings`) untuk menyimpan pengaturan scraper secara dinamis.
  2. Di halaman **Settings**, sediakan form **Konfigurasi Target Billingnesia** yang memungkinkan Superadmin mengubah dan menyimpan:
     * **Base URL / Domain Billingnesia** (contoh: `https://billingnesia...` atau IP lokalnya).
     * **Endpoint Path Pencarian / Dismantle / Detail Pelanggan** (opsional/modular agar fleksibel jika rute URL berubah).
     * **Kredensial / Session Cookie / Token Scraper** (jika diperlukan untuk autentikasi penarikan data) & **Timeout / Interval Request**.
     * **Tombol Test Koneksi:** Untuk mengecek apakah domain/URL Billingnesia yang baru disimpan bisa dijangkau oleh server.
  3. Ubah seluruh fungsi scraper yang ada di backend agar membaca **Base URL & Endpoint** secara dinamis dari database (dengan *fallback* ke `.env` jika database kosong), bukan lagi dari *hardcode*.

### B. Alur Staging & Distribusi Hasil Scrape (Settings → `/dismantles` atau `/pekerjaan`)
* **Kondisi Saat Ini:** Penarikan/scraping data Billingnesia hanya bisa dilakukan dengan mengetik manual di kolom *search* pada halaman `/dismantles` dan `/pekerjaan` (Work Logs).
* **Perubahan yang Diminta:**
  1. Pertahankan mekanisme pencarian yang sudah ada, tetapi tambahkan menu **Billingnesia Scraper & Staging** di dalam halaman **Settings** (dan/atau tab khusus **Antrean Hasil Scrape** sebelum masuk ke daftar utama `/dismantles`).
  2. Dari halaman **Settings**, user bisa memicu penarikan data (scraping/sync) atau melakukan input/paste data mentah Billingnesia secara manual, lalu ditampung terlebih dahulu di **Tabel Staging** (dengan struktur kolom yang **identik** dengan tabel utama `/dismantles`).
  3. Backend melakukan *parsing* standar dan menandai otomatis jika ada `id_pelanggan` atau `no_tiket` yang sudah terdaftar di database (`BARU` vs `DUPLIKAT`).
  4. Dari tabel *Staging* tersebut, user bisa menyeleksi data (satuan atau massal) dan mengirimkannya secara fleksibel ke:
     * **Daftar Dismantle (`/dismantles`)**, ATAU
     * **Work Logs / Pekerjaan (`/pekerjaan`)**.

### C. Tampilan Detail Dismantle & Fitur Smart Copy untuk Tim Lapangan
* Di halaman `/dismantles` (`http://localhost:3000/dismantles`), selain tampilan tabel ringkas, buat juga **Mode Tampilan Detail (Card / List View)** yang sangat mudah dibaca dan dipahami saat dikirim ke grup tim lapangan.
* **Data Wajib per Item:** Nomor Tiket, ID Pelanggan, Nama Pelanggan, Alamat Lengkap (RT/RW, Dusun, Desa, Kecamatan), dan Nomor HP/WA.
* **Fitur Smart Copy:**
  1. **Copy All:** Menyalin seluruh daftar dismantle yang tampil/terfilter dalam format teks rapi siap tempel ke WhatsApp.
  2. **Copy Terpilih (Manual Selection):** Sediakan *checkbox* pada setiap item sehingga user bisa memilih beberapa pelanggan saja (misal satu cluster/desa), lalu klik tombol **"Salin Terpilih (X Data)"** dengan output teks terstruktur.

---

## 2. EMPAT MODUL BARU & FEATURE TOGGLE DI SETTINGS

Bangun 4 modul berikut dengan menyesuaikan estetika UI project saat ini:

1. **Pemisahan "Catatan Sheet NOC" & "Catatan Bebas (Notion-Style)":**
   * **Catatan Sheet NOC:** Spreadsheet ringan multi-tab (seperti tab *List Perbaikan*, *List Dismantle*, *+ Tab Baru*), mendukung edit sel langsung, tambah/hapus baris & kolom, ratakan kolom, simpan manual/otomatis, dan ekspor data.
   * **Catatan / Notes Bebas (Notion-Style):** Halaman terpisah dengan editor berbasis blok (*Block-based editor*: Heading H1-H3, To-Do Checklist, Bullet/Numbered list, Code Block untuk config OLT/MikroTik, Callout box, dan struktur sub-halaman bersarang).
2. **Riwayat & Rekapitulasi Laporan Tiket Shift:**
   * Arsip serah-terima tiket per petugas dan per shift (`PAGI`, `SORE`, `MALAM`, `SOC`) lengkap dengan filter **Nama Staff**, **Shift**, dan **Rentang Tanggal**.
   * Menampilkan ringkasan `Menerima: X Tiket` & `Menangani: Y Tiket`, tombol **Salin Laporan** (1-klik copy rekap shift ke WA), serta tombol **Ekspor Excel & PDF**.
3. **Template Chat WhatsApp Cepat:**
   * Dapat diakses cepat dari *navbar* (modal/drawer global) tanpa meninggalkan halaman aktif.
   * Fitur: Pencarian judul/isi, filter kategori (`Konfirmasi Pelanggan`, `Pembayaran`, `Gangguan`, dll.), dukungan placeholder dinamis (misal `{sapaan}`), tombol **Salin Pesan** 1-klik, dan CRUD penuh (`+ Buat Baru`, Edit, Hapus).
4. **Menu Layanan & Feature Flag (Beta Toggle) di Settings:**
   * Tambahkan pengelompokan menu layanan:
     * *Infrastruktur & Visual:* Topologi Jaringan, Management Core Fiber, IP Management, Laporan Jaringan.
     * *Pelanggan & Layanan NOC:* Data Pelanggan, Lemburan Staff, Input Tiket Harian, Riwayat Tiket, Catatan Sheet NOC, Jadwal Backup Perangkat.
     * *Edukasi Pelanggan:* **Panduan Wi-Fi Modem**.
   * **Aturan Beta Toggle:** Seluruh menu baru di atas—**KECUALI Panduan Wi-Fi Modem**—berstatus **BETA** dan harus bisa diaktifkan atau dinonaktifkan (ON/OFF) melalui sakelar (*feature toggle*) di halaman **Settings** oleh Superadmin.

---

## 3. KEAMANAN KETAT, ANTI BRUTE-FORCE & STEALTH AUDIT LOG

Implementasikan proteksi keamanan menyeluruh di sisi *middleware*, API/Server Actions, dan UI:

### A. Proteksi Form Login & Rate Limiting Berlapis
1. **Rate Limit Ketat (`HTTP 429`):** Batasi maksimal **5 percobaan login per menit** per IP/endpoint. Jika melebihi batas, server langsung menolak dan merespons dengan status kode **`429 Too Many Requests`**.
2. **Progressive Lockout (Per Akun & Per IP):** Catat kegagalan berdasarkan kombinasi **Akun (Email/Username)** dan **IP Address** dengan waktu tunggu bertingkat:
   * Gagal ke-1 & ke-2: Tanpa jeda.
   * Gagal ke-3: Jeda **1 menit**.
   * Gagal ke-4: Jeda **2 menit**.
   * Gagal ke-5: Jeda **3 menit**.
   * Gagal ke-6: Jeda **4 menit**.
   * Gagal ke-7 dan seterusnya: Jeda **5 menit (maksimal, tetap 5 menit untuk percobaan gagal berikutnya)**.
   * Counter hanya di-reset setelah login sukses sepenuhnya.
3. **CAPTCHA & Verifikasi Dua Langkah (2FA) Otomatis:**
   * Mulai dari **percobaan ke-3 dan seterusnya** (setelah 2 kali gagal), form login **wajib menampilkan CAPTCHA** (verifikasi server-side) **DAN wajib mengaktifkan tantangan Verifikasi Dua Langkah (2FA / OTP)** meskipun password yang dimasukkan benar.
4. **Anti Account Enumeration:**
   * Jangan pernah menampilkan pesan *"Email tidak terdaftar"* atau *"User tidak ditemukan"*.
   * Gunakan pesan error tunggal untuk semua kegagalan kredensial: **`"Email atau password salah."`** serta terapkan *constant-time hash check* agar tidak bisa ditebak lewat selisih waktu respons.

### B. Stealth Audit Log & Security Monitoring (Khusus Superadmin)
* Bangun dashboard **Stealth Audit Log** yang hanya bisa diakses oleh **Superadmin** untuk memantau:
  1. **Activity & Data Log:** Perubahan data (CRUD), perubahan konfigurasi domain scraper di Settings, aktivitas scraping, serta pemindahan data dari Staging Settings ke `/dismantles` atau `/pekerjaan` (mencatat user, waktu, dan detail perubahan).
  2. **Auth & Session Log:** Riwayat login sukses/gagal, logout, perubahan hak akses, IP address, dan User-Agent.
  3. **Bot & Intrusion Detection Log:** Mendeteksi percobaan *brute-force*, pemicu error `429`, *User-Agent* bot/scraper ilegal (`curl`, `python`, *headless browser* mencurigakan), dan percobaan akses ilegal ke route admin (`403`), dilengkapi badge tingkat risiko (`INFO`, `WARNING`, `CRITICAL`) serta aksi **Blokir IP** secara langsung.

---

## ATURAN EKSEKUSI UNTUK AI AGENT
1. **Jangan berasumsi berlebihan di luar spesifikasi:** Pahami bahwa scraper Billingnesia adalah fitur internal sah milik sistem ini—jangan memblokir skrip/extension internal milik sistem sendiri saat menerapkan deteksi bot (gunakan *API Key / Internal Secret Header* untuk membedakan request internal dengan bot eksternal).
2. **Bug Fixes Sekalian:** Perbaiki juga bug kecil yang terlihat di UI:
   * Render mentah ```` ```[span_0](start_span)[span_0](end_span) ```` pada daftar nama NOC di halaman Shift & Cuti.
   * Tabrakan rentang legenda SLA (`2-9 jam` dan `> 8 jam` perbaiki menjadi `2-8 jam` dan `> 8 jam`).
   * Pastikan footer tidak tertutup indikator pojok kiri bawah.
3. **Tahapan Kerja:** Mulai dengan memigrasi konfigurasi URL/domain scraper dari *hardcode* ke database (`scraper_configs`), lanjutkan dengan skema database modul baru (`scraper_staging`, `noc_sheets`, `notion_notes`, `wa_templates`, `feature_flags`, `login_attempts`, `audit_logs`), implementasi backend/middleware keamanan, lalu bangun komponen UI secara modular.