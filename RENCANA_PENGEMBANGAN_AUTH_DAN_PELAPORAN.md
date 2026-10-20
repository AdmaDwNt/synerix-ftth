# Rencana & Arsitektur Implementasi Sistem: Multi-User Billingnesia, Isolasi Data, & Pelaporan Tiket Terpadu (Telegram)

Dokumen ini disusun berdasarkan analisis mendalam terhadap spesifikasi pada `newprd.md`, instruksi tambahan terkait **Isolasi Data Per-User**, **Stealth Monitoring Superadmin**, **Shared Dismantle Mapping**, serta arsitektur sistem Synerix-FTTH saat ini.

---

## 1. Pemahaman Kebutuhan & Problem Statement

### Masalah 1: Otentikasi Tunggal (Single User Hardcoded) & Keamanan
* **Kondisi Saat Ini:** Kredensial Billingnesia tertanam di Environment Variable Vercel (`BILLINGNESIA_USERNAME` & `BILLINGNESIA_PASSWORD`). Akibatnya, seluruh aktivitas scraping, tracking, dan logging tiket di Billingnesia tercatat atas nama satu akun (pemilik akun).
* **Risiko & Kendala:** Rekan kerja lain tidak dapat menggunakan akun masing-masing, log audit di Billingnesia menjadi bias, dan ada kekhawatiran terkait keamanan credential/malware JS.
* **Target Solusi:** 
  1. Sistem login mandiri per-user di Synerix-FTTH menggunakan username & password akun Billingnesia masing-masing personil.
  2. Multi-tenant session: Setiap user yang login memiliki session cookie Billingnesia sendiri yang terisolasi. Seluruh aksi scraping dan input tiket yang dilakukan oleh User A akan tercatat atas nama User A di Billingnesia.
  3. Database User lokal (Supabase) dengan Role-Based Access Control (RBAC):
     * **Superadmin:** Mengontrol semua user (tambah user, nonaktifkan/hapus, ubah role, reset password, atur hak akses modul).
     * **Teknisi / User Biasa:** Hanya dapat mengakses modul/halaman yang diizinkan Superadmin, tidak dapat mengakses panel user management.
  4. Fitur ubah password terintegrasi: Perubahan password melalui sistem Synerix-FTTH langsung disinkronkan ke Billingnesia melalui scraping endpoint ganti password Billingnesia.

### Masalah 2: Isolasi Data Per-User vs Stealth Monitoring vs Shared Mapping
* **Kebutuhan Isolasi Data:**
  * Setiap data pekerjaan, catatan, atau perubahan yang dilakukan oleh masing-masing user **terpisah secara ketat (Data Isolation)**.
  * Rekan 1 tidak dapat melihat catatan/data Rekan 2 atau data Superadmin. Data tidak boleh bercampur atau saling menimpa.
* **Pengecualian 1: Stealth Monitoring Superadmin (Mode Pemantauan Senyap):**
  * Superadmin memiliki akses pengawasan total (**God Mode**): dapat melihat seluruh aktivitas, perubahan, dan log yang dilakukan oleh semua rekan kerja tanpa terkecuali.
  * **Senyap (Stealth):** Rekan kerja sama sekali **tidak mengetahui** bahwa aktivitas mereka dipantau oleh Superadmin. Di tampilan teknisi, aplikasi tampak seperti aplikasi personal biasa tanpa ada indikator pemantauan.
* **Pengecualian 2: Shared Mapping & Peta Dismantle:**
  * Modul GIS Mapping (`/mapping`) dan Peta Cluster Dismantle (`/dismantles`) bersifat **terbuka bersama (Shared Visibility)**. Seluruh teknisi dan Superadmin dapat melihat pin lokasi dismantle dan rute yang sama agar koordinasi penarikan perangkat di lapangan tetap sinkron.

### Masalah 3: Pelaporan Aktivitas Tiket, Keterbatasan Foto di Billingnesia, & Duplikasi Kerja Telegram
* **Kondisi Saat Ini:**
  * Di Billingnesia, menu "Input Aktivitas" hanya mengizinkan **1 lampiran foto**, sedangkan standar pelaporan lapangan (terutama PSB / Aktivasi / Perbaikan) mewajibkan **6 hingga 7 foto bukti** (Rumah, ODP, OPM/Redaman, Jalur Kabel, ONT, Speedtest, Berita Acara).
  * Teknisi harus mengetik ulang laporan di Telegram secara manual dengan format baku pemakaian material (ONT, Kabel dropcore, Fastkon, Paku Klip, dll.) dan mengirimkan 6–7 foto manual ke grup Telegram.
  * Di Billingnesia, kolom "Karyawan" harus dipilih manual satu per satu, padahal pengerjaan sering dilakukan lebih dari 1 orang.
  * Opsi "Pengeluaran Barang Gudang": Ada pilihan "Ya, menggunakan barang" (menginput detail NTP) atau "Tidak menggunakan barang" (wajib menulis alasan).
* **Target Solusi:**
  1. **Form Input Aktivitas Terpadu (One-Click Submit):**
     * Default Karyawan otomatis terisi nama akun yang login, dengan opsi menambahkan rekan kerja lain (multi-PIC).
     * Toggle Pengeluaran Barang Gudang (Ya + NTP + checklist material vs Tidak + alasan).
     * Multi-Photo Uploader untuk 6–7 foto bukti pekerjaan dengan kompresi otomatis & upload ke Supabase Storage.
  2. **Dual-Dispatch Automation:**
     * **Ke Billingnesia:** Mengirimkan data aktivitas, progress (%), PIC pelaksana, dan 1 foto representatif via scraper POST request.
     * **Ke Telegram:** Secara otomatis mengirimkan laporan berformat rapi lengkap dengan rincian `[Pemakaian Barang]` beserta **album media (6–7 foto)** ke grup/channel Telegram monitoring via Telegram Bot API (`sendMediaGroup`).

---

## 2. Arsitektur Teknis Sistem & Aturan Visibilitas Data

```
                                      +-------------------------------+
                                      |   Pengguna (Teknisi / Admin)  |
                                      +---------------+---------------+
                                                      |
                                             [1. Login / Form Input]
                                                      v
+---------------------------------------------------------------------------------------------------+
| SYNERIX-FTTH NEXT.JS APPLICATION                                                                  |
|                                                                                                   |
|  [ Middleware / Session Guard ]                                                                    |
|        |                                                                                          |
|        +---> Verifikasi Sesi, Role (Superadmin vs Technician), & Izin Rute                        |
|                                                                                                   |
|  [ Data Scoping & Privacy Engine ]                                                                |
|        |                                                                                          |
|        +---> Jika ROLE = 'technician': Query dibatasi WHERE user_id = CURRENT_USER (Terisolasi)  |
|        +---> Jika ROLE = 'superadmin': Query UNRESTRICTED + Switcher Filter Anggota (Stealth)    |
|        +---> Khusus /mapping & /dismantles (Peta Pin): GLOBAL SHARED READ                         |
|                                                                                                   |
|  [ Work Log & Activity Dispatcher Service ]                                                       |
|        |                                                                                          |
|        |--- (A) Simpan Log Lokal & Upload 6-7 Foto ke Supabase Storage                           |
|        |--- (B) Kirim Form Aktivitas + 1 Foto Utama ke Billingnesia Session User                  |
|        +--- (C) Rakit Format [Pemakaian Barang] & Kirim Media Group ke Telegram Bot API           |
+--------+------------------------------------+------------------------------------+----------------+
         |                                    |                                    |
         v                                    v                                    v
+------------------+                 +-------------------+                +------------------+
| SUPABASE DB & S3 |                 | BILLINGNESIA      |                | TELEGRAM BOT API |
| - synerix_users  |                 | - Auth per User   |                | - sendMediaGroup |
| - user_sessions  |                 | - Input Aktivitas |                | - 6-7 Foto Bukti |
| - work_logs      |                 | - Ganti Password  |                | - Format Barang  |
| - user_activity_ |                 +-------------------+                +------------------+
|   audit_logs     |
| - Storage Bucket |
+------------------+
```

---

## 3. Desain Skema Database (Supabase PostgreSQL)

### 3.1. Tabel `synerix_users`
Menyimpan data pengguna lokal, kredensial terenkripsi untuk perpanjangan sesi scraper, role, dan izin rute.

```sql
CREATE TYPE user_role AS ENUM ('superadmin', 'technician', 'viewer');

CREATE TABLE IF NOT EXISTS public.synerix_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL, -- Username akun Billingnesia
    encrypted_billing_password TEXT NOT NULL, -- Password terenkripsi AES-256 untuk autologin scraper
    full_name VARCHAR(150) NOT NULL,
    role user_role DEFAULT 'technician',
    is_active BOOLEAN DEFAULT TRUE,
    allowed_routes TEXT[] DEFAULT ARRAY['/work-logs', '/dismantles', '/mapping', '/core-guide'],
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2. Tabel `user_sessions`
Menyimpan sesi aktif per user di sisi server, termasuk cookie sesi Billingnesia milik masing-masing user.

```sql
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.synerix_users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    billingnesia_cookie TEXT,
    cookie_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3. Penyesuaian Tabel `work_logs` (Isolasi Data Per-User)
Menambahkan kolom `user_id` untuk isolasi ketat antar rekan kerja.

```sql
ALTER TABLE public.work_logs 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.synerix_users(id),
ADD COLUMN IF NOT EXISTS created_by_username VARCHAR(100);

-- Kebijakan RLS (Row Level Security):
-- 1. Teknisi biasa hanya dapat melihat & mengedit baris miliknya sendiri
-- 2. Superadmin dapat melihat SEMUA baris tanpa batas
```

### 3.4. Tabel `ticket_activity_reports` (Pelaporan Lengkap & Telegram)
```sql
CREATE TABLE IF NOT EXISTS public.ticket_activity_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50),
    customer_name VARCHAR(150),
    user_id UUID REFERENCES public.synerix_users(id), -- User pembuat
    employees TEXT[] NOT NULL, -- Daftar teknisi yang terlibat
    action_description TEXT NOT NULL,
    progress_percent INTEGER DEFAULT 100,
    
    -- Gudang & Pemakaian Barang
    uses_warehouse_goods BOOLEAN DEFAULT FALSE,
    no_goods_reason TEXT,
    ntp_number VARCHAR(100),
    materials_used JSONB DEFAULT '{}'::jsonb, -- e.g. {"ont": 1, "kabel_meter": 32, "fastkon": 1, "paku_klip": 7}
    
    -- Foto & Integrasi
    photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[], -- 6-7 URL foto bukti
    billingnesia_log_synced BOOLEAN DEFAULT FALSE,
    telegram_sent BOOLEAN DEFAULT FALSE,
    telegram_message_ids TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.5. Tabel `user_activity_audit_logs` (Stealth Audit untuk Superadmin)
Mencatat seluruh aksi tanpa diketahui oleh rekan kerja (kapan login, membuka tiket mana, submit aktivitas, dll.).

```sql
CREATE TABLE IF NOT EXISTS public.user_activity_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.synerix_users(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'LOGIN', 'SCRAPE_TICKET', 'SUBMIT_ACTIVITY', 'UPDATE_DISMANTLE'
    target_id VARCHAR(100), -- ID Tiket / ID Pelanggan
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.6. Supabase Storage Bucket
* Bucket: `ticket-activities` (Public / Signed URL)
* Struktur folder: `{ticket_id}/{timestamp}_{filename}`

---

## 4. Mekanisme Isolasi Data, Stealth Audit, & Shared Resources

### A. Matriks Hak Akses & Visibilitas Data

| Modul / Fitur | Teknisi Biasa (Rekan Kerja) | Superadmin (Akun Anda) | Catatan Penting |
|---|---|---|---|
| **Catatan & Work Logs (`/work-logs`)** | Hanya melihat & mengubah data milik sendiri (`user_id = me`) | Melihat **SEMUA** data rekan + dropdown filter per anggota | Teknisi tidak melihat data Anda atau rekan lain |
| **Laporan Tiket & History Input** | Hanya riwayat input milik sendiri | Melihat seluruh riwayat pelaporan tim | Audit trail terpusat |
| **Peta Dismantle & GIS (`/dismantles`, `/mapping`)** | **Bisa Melihat Semua Pin & Jalur** (Shared) | **Bisa Melihat Semua Pin & Jalur** (Shared) | Sesuai permintaan: Peta harus bisa dilihat bersama |
| **Audit Log Rekan Kerja** | **Tidak Tahu & Tidak Bisa Akses** | Halaman Monitoring Khusus Superadmin | Stealth: Teknisi tidak tahu mereka dipantau |
| **Manajemen User (`/admin/users`)** | Akses Ditolak (403 / dialihkan) | Kontrol Penuh (Tambah, Edit, Hapus, Ubah Role) | Khusus pemilik sistem |

### B. Mekanisme Stealth Superadmin (Tanpa Diketahui Rekan)
1. **Zero UI Clutter di Sisi Teknisi:**
   * Di sisi teknisi, tidak ada tombol switcher akun, tidak ada indikator "Sedang diawasi oleh Admin", dan tidak ada menu audit log.
   * Tampilan antarmuka terlihat bersih dan personal, seperti aplikasi pencatat kerja pribadi masing-masing.
2. **Superadmin Switcher & Stealth Feed:**
   * Hanya di akun Superadmin muncul tab/dropdown:
     * `[ Tampilkan Semua ]`
     * `[ Saya Sendiri ]`
     * `[ Teknisi A ]`
     * `[ Teknisi B ]`
   * Superadmin memiliki menu rahasia `/admin/audit-trail` untuk melihat rekam jejak kerja rekan secara real-time.

---

## 5. Rincian Modul & Fitur yang Akan Dibangun

### Modul A: Otentikasi, Isolasi & Manajemen Pengguna (Point 1)
1. **Otentikasi Per-User (`/login`)**:
   * Form login meminta `Username` dan `Password` Billingnesia.
   * Server memvalidasi kredensial langsung ke Billingnesia (`https://billing.at-in.net/login`).
   * Jika valid, buat/update user di `synerix_users` dan simpan session cookie di `user_sessions`.
   * Return HTTP-only session cookie ke browser pengguna.
2. **Backend Data Scoping**:
   * Setiap operasi CRUD pada `work_logs` menyertakan `user_id` dari sesi user.
   * API Route otomatis menambahkan filter `eq('user_id', currentUser.id)` jika user bukan Superadmin.
3. **Panel Superadmin (`/admin/users`)**:
   * Daftar User, Tambah User Teknisi baru, Toggle Aktif/Nonaktif, Ubah Role, Ganti/Reset Password.
   * Checklist pengaturan izin akses menu.
4. **Sinkronisasi Ganti Password**:
   * User atau Superadmin dapat mengganti password melalui Synerix-FTTH.
   * Backend melakukan request POST ke endpoint ganti password Billingnesia menggunakan cookie user tersebut, lalu memperbarui password terenkripsi lokal.

---

### Modul B: Pelaporan Aktivitas Tiket, Multi-Foto & Bot Telegram (Point 2)
1. **Form Input Aktivitas Tiket**:
   * **Karyawan Pelaksana:** Default terisi nama user yang login, dengan opsi tombol `+ Tambah Rekan` untuk multi-PIC.
   * **Tindakan & Progress:** Textarea tindakan dan slider persentase (0–100%).
   * **Pengeluaran Barang Gudang:**
     * `[x] Menggunakan Barang`: Wajib input NTP dan kuantitas material lapangan (ONT, Kabel meter, Fastkon, PS Besar, PS Kecil, Barrel, Splitter, Kabel Ties, Paku Klip, Lain-lain).
     * `[ ] Tidak Menggunakan Barang`: Wajib menuliskan alasan peniadaan barang.
   * **Multi-Lampiran Foto Bukti (6–7 Foto Slot):**
     * Slot 1: Foto Lokasi / Rumah Pelanggan
     * Slot 2: Foto ODP & Label Core
     * Slot 3: Foto Pengukuran Redaman (OPM)
     * Slot 4: Foto Penarikan Kabel Dropcore
     * Slot 5: Foto Perangkat ONT & Lampu Indikator
     * Slot 6: Foto Hasil Speedtest / Layanan Aktif
     * Slot 7: Foto Berita Acara / Tanda Tangan (Opsional)
     * Kompresi otomatis di browser sebelum upload ke Supabase Storage.
2. **Integrasi Telegram Bot API**:
   * Otomatis memformat teks rapi:
     ```text
     📋 LAPORAN AKTIVITAS PEKERJAAN
     ID Tiket   : {ticket_id}
     Pelanggan  : {customer_name} ({customer_id})
     Teknisi    : {daftar_nama_karyawan}
     Progress   : {progress_percent}%
     Waktu      : {tanggal_waktu}

     📝 Tindakan:
     {action_description}

     📦 [Pemakaian Barang]
     NTP        : {ntp_number}
     ONT        : {ont_count}
     Kabel      : {kabel_meter}m
     fastkon    : {fastkon_count}
     PS Besar   : {ps_besar}
     PS Kecil   : {ps_kecil}
     Barrel     : {barrel}
     Splitter   : {splitter}
     Kabel Ties : {kabel_ties}
     Paku Klip  : {paku_klip}
     Lain-lain  : {lain_lain}
     ```
   * Mengirimkan 6–7 foto dalam 1 paket album Telegram (`sendMediaGroup`) ke grup monitoring.
3. **Submit ke Billingnesia Scraper**:
   * Melakukan request form POST ke endpoint input aktivitas Billingnesia menggunakan sesi user yang sedang login (sehingga tercatat atas nama user tersebut).
   * Melampirkan foto utama (Slot 1) ke form Billingnesia.

---

### Modul C: Shared Dismantle Mapping & Monitoring
* Titik-titik dismantle hasil scraping/input tugas tetap tersimpan di tabel `dismantle_tasks` yang dapat diakses oleh **semua anggota tim** di halaman `/dismantles` dan peta GIS.
* Teknisi dapat melihat status (Queue, In Progress, Selesai) secara real-time untuk mencegah dobel pengerjaan.

---

### Modul D: Point 3 PRD (Status: Ditunda / Tahap Mendatang)
* Fitur pembuatan tiket baru untuk monitoring (Dying, LOS, Maintenance Retail vs Jaringan).
* **Status:** Diarsip untuk dikerjakan setelah Point 1 dan Point 2 teruji stabil.

---

## 6. Rencana Tahapan Eksekusi (Implementation Roadmap)

| Tahap | Fokus Utama | Deliverables & Rincian Aksi |
|---|---|---|
| **Tahap 1** | **Database, Auth & Data Isolation** | 1. Script SQL Supabase untuk tabel `synerix_users`, `user_sessions`, penambahan kolom `user_id` pada `work_logs`, serta tabel `user_activity_audit_logs`.<br>2. Helper enkripsi password (AES-256) di `src/lib/auth/crypto.ts`.<br>3. API route otentikasi login & session checker (`/api/auth/login`, `/api/auth/me`, `/api/auth/logout`).<br>4. Middleware pengecekan role & filter data isolation (Teknisi hanya melihat datanya sendiri, Superadmin melihat semua).<br>5. Update `billingnesiaScraper.ts` agar menerima session cookie dinamis per user. |
| **Tahap 2** | **UI Login & Manajemen User (Superadmin)** | 1. Implementasi Halaman Login modern (`/login`).<br>2. Halaman Superadmin `/admin/users` (Daftar teknisi, tambah user, toggle aktif, ganti password, atur izin).<br>3. Halaman Stealth Activity Monitor khusus Superadmin (`/admin/audit-logs`).<br>4. Implementasi form ubah password yang terhubung ke scraper Billingnesia. |
| **Tahap 3** | **Telegram Bot Service & Storage** | 1. Service `src/lib/services/telegramService.ts` untuk pengiriman album foto (`sendMediaGroup`) & format teks laporan pemakaian barang.<br>2. Setup bucket Supabase Storage `ticket-activities` dan helper upload multi-file.<br>3. Konfigurasi environment variables Telegram. |
| **Tahap 4** | **Reverse Engineering Input Aktivitas** | 1. Analisis & implementasi fungsi submit aktivitas di `billingnesiaScraper.ts` (keterangan, progress %, karyawan, status barang, foto).<br>2. API route `/api/tickets/activity` yang mengorkestrasikan submit ke Billingnesia dan kirim ke Telegram secara paralel. |
| **Tahap 5** | **UI Form Pelaporan Tiket Terpadu** | 1. Modal pelaporan terpadu di `/work-logs` dan detail dismantle.<br>2. Komponen Multi-PIC teknisi.<br>3. Counter & checklist pemakaian barang gudang + NTP.<br>4. Uploader 6–7 foto terstruktur dengan preview visual.<br>5. Verifikasi bahwa peta `/dismantles` dan `/mapping` tetap sinkron dan dapat diakses bersama oleh seluruh rekan. |
| **Tahap 6** | **Uji Coba & Testing Operasional** | 1. Uji login 2 akun berbeda: pastikan data work-log Rekan 1 tidak tampak di Rekan 2.<br>2. Uji Superadmin: pastikan dapat melihat data Rekan 1 & Rekan 2 tanpa terdeteksi.<br>3. Uji kirim pelaporan aktivitas & album foto ke grup Telegram uji coba.<br>4. Verifikasi log aktivitas di Billingnesia tercatat sesuai user pengirim. |

---

## 7. Standar Pelabelan Kode Per-File (Clean Code & Mudah Dimaintain)

Agar setiap kode yang dibuat mudah dipahami, mudah dirawat di masa depan, dan tidak membingungkan saat pengembangan lanjutan, **setiap file kode yang dibuat wajib mengikuti standar struktur pelabelan komentar** seperti berikut:

```typescript
/**
 * ============================================================================
 * MODUL       : [Nama Modul, misal: Autentikasi & Sesi]
 * FILE        : [Path File, misal: src/lib/auth/session.ts]
 * DESKRIPSI   : [Penjelasan singkat fungsi file ini]
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BAGIAN 1: IMPORT & DEPENDENCIES
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// BAGIAN 2: DEFINISI TIPE & INTERFACE (TYPESCRIPT CONTRACT)
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// BAGIAN 3: KONSTANTA & KONFIGURASI
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// BAGIAN 4: LOGIKA UTAMA (CORE BUSINESS LOGIC)
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// BAGIAN 5: HELPER / UTILITY FUNCTIONS
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// BAGIAN 6: EXPORT & PUBLIC API
// ----------------------------------------------------------------------------
```

---

## 8. Rincian Pengerjaan Bertahap Per-File (Micro-Steps Checklist)

Untuk menghemat kuota kredit Anda dan memudahkan review, pengerjaan dipecah menjadi **langkah-langkah kecil (atomik) per file**. Anda dapat menentukan kapan lanjut ke file berikutnya setelah file sebelumnya Anda periksa dan setujui.

### 📦 FASE 1: FONDASI DATABASE & AUTH PER-USER
* [x] **Langkah 1.1**: Buat file script SQL Supabase (`supabase/schema_auth_and_isolation.sql`) yang berisi tabel `synerix_users`, `user_sessions`, penambahan `user_id` di `work_logs`, akun gudang, dan audit trail stealth.
* [ ] **Langkah 1.2**: Buat file `src/lib/auth/crypto.ts` (Enkripsi AES-256 kredensial Billingnesia & hashing token).
* [ ] **Langkah 1.3**: Buat file `src/lib/auth/session.ts` (Helper manajemen session cookie & validasi role Superadmin vs Teknisi).
* [ ] **Langkah 1.4**: Buat file `src/app/api/auth/login/route.ts` (API route login: memverifikasi kredensial langsung ke Billingnesia lalu mencatat user).
* [ ] **Langkah 1.5**: Buat file `src/app/api/auth/me/route.ts` & `src/app/api/auth/logout/route.ts` (API route pengecekan user login aktif & logout).
* [ ] **Langkah 1.6**: Sesuaikan `src/lib/scraper/billingnesiaScraper.ts` (Diberi opsi menerima cookie sesi milik user aktif, fallback ke env jika belum ada).

### 🖥️ FASE 2: TAMPILAN LOGIN & MANAGEMENT USER (SUPERADMIN)
* [ ] **Langkah 2.1**: Buat file `src/app/login/page.tsx` (Halaman login rapi, aman, responsif dengan indikator status login Billingnesia).
* [ ] **Langkah 2.2**: Buat file `src/middleware.ts` (Guard Next.js untuk proteksi route & redirection jika belum login).
* [ ] **Langkah 2.3**: Buat file `src/app/api/admin/users/route.ts` (API route CRUD user khusus Superadmin: tambah teknisi, nonaktifkan, ubah role).
* [ ] **Langkah 2.4**: Buat file `src/app/admin/users/page.tsx` (Halaman dashboard Superadmin untuk manajemen anggota dan hak akses menu).
* [ ] **Langkah 2.5**: Buat file `src/app/admin/audit-logs/page.tsx` (Halaman stealth monitoring aktivitas rekan kerja untuk Superadmin).

### 🔒 FASE 3: PENERAPAN ISOLASI DATA (DATA PRIVACY PER-USER)
* [ ] **Langkah 3.1**: Sesuaikan query di `src/app/work-logs/page.tsx` & API terkait agar Teknisi hanya melihat data buatannya sendiri (`user_id = me`), sedangkan Superadmin memiliki switcher untuk melihat semua/memfilter per teknisi.
* [ ] **Langkah 3.2**: Pastikan rute `/dismantles` dan `/mapping` tetap berstatus **Shared Visibility** (semua anggota tim melihat titik pin & jalur yang sama).

### 📱 FASE 4: TELEGRAM BOT SERVICE & MULTI-LAMPIRAN FOTO
* [ ] **Langkah 4.1**: Buat file `src/lib/services/telegramService.ts` (Fungsi kirim album foto `sendMediaGroup` dan generator format teks `[Pemakaian Barang]`).
* [ ] **Langkah 4.2**: Buat helper upload multi-foto Supabase Storage di `src/lib/services/storageService.ts` (dengan kompresi gambar).
* [ ] **Langkah 4.3**: Buat fungsi submit form aktivitas di `src/lib/scraper/billingnesiaScraper.ts`.
* [ ] **Langkah 4.4**: Buat API route `src/app/api/tickets/activity/route.ts` (Dual-dispatch: submit ke Billingnesia + broadcast ke Telegram).

### 🎨 FASE 5: UI FORM PELAPORAN TIKET TERPADU
* [ ] **Langkah 5.1**: Buat komponen `src/components/work-logs/ActivityReportModal.tsx` (Form pelaporan modern: multi-PIC, checklist barang gudang, 6–7 slot foto bukti).
* [ ] **Langkah 5.2**: Integrasikan modal ke halaman `/work-logs` dan detail dismantle.

---

## 9. Kebutuhan Konfigurasi Environment Baru

Variabel yang perlu disiapkan di `.env.local` / Vercel:

```env
# Enkripsi & Keamanan Sesi Lokal
AUTH_SECRET_KEY=kunci_rahasia_aes_256_untuk_enkripsi_token_dan_password

# Telegram Bot Integration
TELEGRAM_BOT_TOKEN=token_bot_telegram_dari_botfather
TELEGRAM_REPORT_CHAT_ID=id_grup_atau_channel_tujuan_laporan

# Billingnesia Base URL
BILLINGNESIA_BASE_URL=https://billing.at-in.net
```

