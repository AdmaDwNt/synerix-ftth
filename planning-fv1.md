# PERENCANAAN MATANG IMPLEMENTASI SISTEM FTTH (FV-1)
## Synerix Network Operations Platform
**Dokumen Arsitektur & Roadmap Eksekusi: Modul Dismantle & Guide Core Fiber**
*Versi: 1.0 (Draft Final Perencanaan)*  
*Tanggal: Oktober 2026*  
*Status: Siap Ditinjau & Disetujui (Ready for Review - No Code Applied Yet)*

---

## 1. PENDAHULUAN & LATAR BELAKANG

Berdasarkan evaluasi dokumen `plan.md` dan `modul.md`, platform **Synerix Network Operations** telah menyelesaikan pondasi awal (Next.js 16, Tailwind CSS v4, Lucide Icons, Topbar Ekosistem Asterix/Fibermaxs/Digimaxs/Synerix, Supabase Database dasar, Dashboard Utama, dan Modul Work-Logs). 

Sesuai prioritas yang ditentukan pada baris akhir `plan.md`:
> *"Fitur pertama adalah Modul Dismantle/Guide Core"*

Pengembangan tahap ini akan difokuskan secara mendalam pada dua pilar operasional teknis lapangan yang saling melengkapi:
1. **Modul Dismantle Grouping & Cluster Routing (`/dismantles`)**: Solusi efisiensi penarikan perangkat ONT/STB dari pelanggan churn/berhenti berlangganan, rute cerdas berbasis klaster/ODP terdekat, dan rekapitulasi serah terima logistik.
2. **Modul Guide & Trakea Jointing Core Fiber (`/core-guide`)**: Standarisasi visual TIA-598 untuk teknisi lapangan, pencegahan salah potong core (zero downtime risk), pendataan matriks trakea sambungan kabel di Joint Box/Closure, serta arsip foto fisik baki (tray).

Dokumen ini disusun sebagai panduan menyeluruh sebelum penulisan kode (*coding*) dimulai, agar seluruh arsitektur data, alur pengguna (*user journey*), dan integrasi komponen berjalan presisi tanpa pengerjaan ulang (*rework*).

---

## 2. ARSITEKTUR BASIS DATA & SKEMA SUPABASE (POSTGRESQL)

Dua modul ini membutuhkan struktur tabel yang terintegrasi dengan tabel yang sudah ada (`work_logs` dan `network_nodes`).

```
 +---------------------------------------------------------------------------------+
 |                              SUPABASE POSTGRESQL                                |
 +---------------------------------------------------------------------------------+
          |                                                   |
          v                                                   v
 [dismantle_tasks]                                      [joint_boxes]
   - id (UUID, PK)                                        - id (UUID, PK)
   - customer_name & id_pelanggan                         - name (e.g. JB-MHS-01)
   - cluster_name & parent_odp_id (FK: network_nodes)    - coordinates (lat, lng)
   - status: QUEUE | IN_PROGRESS | COMPLETED | FAILED     - total_tubes, cores_per_tube
   - coordinates (lat, lng)                               - tray_photo_url
   - device_type, serial_number, mac_address              - notes
   - evidence_photo_url, handover_status                  - created_at
          |                                                   |
          | (Opsional Log Serah Terima)                       v
          v                                            [joint_box_splices]
   [dismantle_handovers]                                  - id (UUID, PK)
     - batch_number                                       - joint_box_id (FK)
     - total_devices                                      - in_cable_name, in_tube, in_core
     - warehouse_receiver                                 - out_cable_name, out_tube, out_core
     - handover_date                                      - status: ACTIVE | SPARE | DAMAGED
                                                          - optical_loss_db
```

### 2.1. Tabel `dismantle_tasks`
Menyimpan seluruh data penugasan penarikan perangkat.

| Kolom | Tipe Data | Keterangan / Constraint |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `default gen_random_uuid()` |
| `customer_id` | `VARCHAR(50)` | ID Pelanggan / Nomor Kontrak (unik) |
| `customer_name` | `VARCHAR(150)` | Nama Lengkap Pelanggan |
| `phone_number` | `VARCHAR(25)` | Nomor Kontak / WhatsApp Pelanggan |
| `address` | `TEXT` | Alamat Lengkap Rumah/Kantor |
| `cluster_name` | `VARCHAR(100)` | Nama Area/Cluster (contoh: *Kediri Indah, Mojoroto*) |
| `parent_odp_id` | `UUID` | Foreign Key opsional ke `network_nodes(id)` |
| `parent_odp_name` | `VARCHAR(100)` | Cadangan nama ODP jika node belum terdata di GIS |
| `latitude` | `DOUBLE PRECISION` | Titik koordinat Latitude pelanggan |
| `longitude` | `DOUBLE PRECISION` | Titik koordinat Longitude pelanggan |
| `status` | `VARCHAR(20)` | `QUEUE`, `IN_PROGRESS`, `COMPLETED`, `FAILED` |
| `device_type` | `VARCHAR(100)` | Tipe/Brand ONT (contoh: *ZTE F609, Huawei HG8245H5*) |
| `serial_number` | `VARCHAR(100)` | SN Perangkat yang berhasil ditarik |
| `mac_address` | `VARCHAR(50)` | MAC Address perangkat (opsional) |
| `accessories` | `TEXT[]` | Perlengkapan: `['ADAPTOR', 'PATCHCORD', 'STB', 'REMOTE']` |
| `evidence_photo_url` | `TEXT` | URL Foto bukti pencabutan (dari Supabase Storage) |
| `failure_reason` | `TEXT` | Alasan jika `FAILED` (Rumah Kosong, Menolak, Sengketa, dll) |
| `technician_name` | `VARCHAR(100)` | Nama teknisi pelaksana penarikan |
| `completed_at` | `TIMESTAMPTZ` | Waktu selesai dieksekusi |
| `handover_id` | `UUID` | ID Batch serah terima gudang |
| `created_at` | `TIMESTAMPTZ` | Default `NOW()` |

### 2.2. Tabel `joint_boxes` (Closure / Titik Sambungan)
Menyimpan identitas fisik setiap kotak sambungan fiber (Dome Closure / Inline Closure).

| Kolom | Tipe Data | Keterangan / Constraint |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `default gen_random_uuid()` |
| `name` | `VARCHAR(100)` | Kode/Nama Closure (contoh: *JB-FE-01-KDR*) |
| `closure_type` | `VARCHAR(50)` | `DOME_CLOSURE`, `INLINE_CLOSURE`, `ODC_TRAY`, `OPTICAL_SPLITTER_BOX` |
| `cluster_area` | `VARCHAR(100)` | Nama Wilayah/Cluster penempatan |
| `pole_number` | `VARCHAR(50)` | Nomor Tiang / Titik Handhole |
| `latitude` | `DOUBLE PRECISION` | Titik koordinat Latitude |
| `longitude` | `DOUBLE PRECISION` | Titik koordinat Longitude |
| `capacity_cores` | `INTEGER` | Kapasitas total sambungan (contoh: 24, 48, 96, 144 core) |
| `tray_count` | `INTEGER` | Jumlah baki/tray splicing di dalam closure |
| `tray_photo_url` | `TEXT` | URL Dokumentasi visual isi tray trakea sambungan |
| `notes` | `TEXT` | Catatan khusus (contoh: *Tray 2 kendor, kabel slack 15m*) |
| `created_at` | `TIMESTAMPTZ` | Default `NOW()` |

### 2.3. Tabel `joint_box_splices` (Matriks Trakea Core Masuk vs Keluar)
Mencatat pemetaan sambungan core-to-core secara digital per Joint Box.

| Kolom | Tipe Data | Keterangan / Constraint |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `default gen_random_uuid()` |
| `joint_box_id` | `UUID` | Foreign Key ke `joint_boxes(id)` ON DELETE CASCADE |
| `tray_number` | `INTEGER` | Nomor baki sambungan (1, 2, 3...) |
| `in_cable_name` | `VARCHAR(100)` | Identitas Kabel Masuk (contoh: *Feeder A 48c*) |
| `in_tube_num` | `INTEGER` | Nomor Tube Masuk (1 - 12) |
| `in_core_num` | `INTEGER` | Nomor Core Masuk (1 - 12) |
| `in_core_global` | `INTEGER` | Nomor Core Absolut Kabel Masuk (1 - 144) |
| `out_cable_name` | `VARCHAR(100)` | Identitas Kabel Keluar (contoh: *Distribusi B 24c*) |
| `out_tube_num` | `INTEGER` | Nomor Tube Keluar (1 - 12) |
| `out_core_num` | `INTEGER` | Nomor Core Keluar (1 - 12) |
| `out_core_global` | `INTEGER` | Nomor Core Absolut Kabel Keluar (1 - 144) |
| `splice_type` | `VARCHAR(30)` | `FUSION_SPLICE`, `MECHANICAL`, `PASS_THROUGH` |
| `status` | `VARCHAR(20)` | `ACTIVE` (Live Traffic), `SPARE` (Kosong), `DAMAGED` (Rusak/High Loss) |
| `destination_target` | `VARCHAR(100)` | Tujuan core (contoh: *ODP-MHS-04 Port 1, Backbone POP*) |
| `optical_loss_db` | `DECIMAL(4,2)` | Nilai redaman titik splicing (dB), e.g. 0.02 dB |
| `updated_at` | `TIMESTAMPTZ` | Default `NOW()` |

### 2.4. Storage Buckets Supabase
Dua bucket penyimpanan objek publik/terproteksi:
1. `dismantle-evidence`: Menyimpan foto bukti pencabutan perangkat di rumah pelanggan (kompresi web-friendly max 2MB).
2. `closure-photos`: Menyimpan dokumentasi foto resolusi tinggi tata letak tray/trakea Joint Box.

---

## 3. SPESIFIKASI MODUL DISMANTLE (`/dismantles`)

### 3.1. Alur Kerja (Lifecycle State Machine)
Setiap tugas dismantle bergerak melalui 4 status utama:

```
          [ + BARU / IMPORT ]
                   |
                   v
              [ QUEUE ]  (Merah/Amber - Menunggu Teknisi)
                   |
                   |--> Teknisi klik "Menuju Lokasi" (Mengaktifkan GPS & Rute)
                   v
           [ IN_PROGRESS ] (Kuning/Cyan - Teknisi Sedang OTW / Di Rumah Klien)
                   |
         +---------+---------+
         |                   |
    (Berhasil Tarik)    (Ada Kendala Lapangan)
         |                   |
         v                   v
   [ COMPLETED ]        [ FAILED ]
   - Input SN ONT       - Catat Alasan (Rumah Kosong / Menolak)
   - Foto Bukti         - Foto Pagar / Rumah Tampak Depan
   - Checklist Aksesoris- Siap Re-Schedule / Eskalasi
         |
         v
  [ SIAP SERAH TERIMA GUDANG ]
```

### 3.2. Fitur Grouping & Cluster Routing
1. **Cluster Selector & Filter**:
   - Pilihan instan filter berdasarkan:
     - Seluruh Area (*All Clusters*)
     - Nama Perumahan / Sub-Distrik (contoh: *Cluster Graha Indah, Mojoroto Regency*)
     - Parent ODP (semua pelanggan yang berasal dari 1 ODP yang sama).
   - Tampilan ringkasan badge counter: Total Antrean (`QUEUE`), Sedang Jalan (`IN_PROGRESS`), Selesai (`COMPLETED`), Gagal (`FAILED`).
2. **Proximity Sorter (Haversine Algorithm)**:
   - Mengambil koordinat GPS teknisi saat ini via HTML5 Geolocation API (`navigator.geolocation.getCurrentPosition`).
   - Menghitung jarak lurus (meter / kilometer) ke setiap titik dismantle secara real-time:
     $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
   - Mengurutkan daftar kartu penarikan dari **yang paling dekat dengan posisi teknisi saat ini** (*Nearest First*), memangkas waktu tempuh kendaraan operasional hingga 40%.
3. **One-Click External Navigation Launcher**:
   - Pada setiap card dismantle dan popup peta, tersedia 2 tombol launcher instan:
     - **Google Maps**: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
     - **Waze App**: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
   - Membuka langsung navigasi turn-by-turn di smartphone teknisi tanpa perlu copy-paste koordinat manual.

### 3.3. Peta GIS Dismantle (Leaflet Interactive Cluster)
- Menampilkan peta full responsif dengan marker warna khusus status:
  - 🔴 **Merah**: Status `QUEUE`
  - 🟡 **Kuning / Emas**: Status `IN_PROGRESS`
  - 🟢 **Hijau Emerald**: Status `COMPLETED`
  - ⚪ **Abu-Abu Gelap**: Status `FAILED`
- Saat marker diklik:
  - Menampilkan Modal/Drawer mini berisi info Nama Pelanggan, Alamat, Tipe ONT, Jarak dari teknisi, Tombol Status Toggle, dan Tombol Navigasi.

### 3.4. Output & Serah Terima Logistik (Handover Generator)
- Tab / Tombol **"Rekap Serah Terima Gudang"**:
  - Memfilter semua item berstatus `COMPLETED` yang belum diserahterimakan.
  - Menampilkan tabel checklist nomor Serial Number (SN), Merk/Tipe, kelengkapan adaptor/kabel, dan nama teknisi penarik.
  - Fitur **Export to CSV / Excel (`xlsx`)** atau **Printable Delivery Receipt (Surat Jalan Serah Terima)** untuk arsip fisik logistik kantor.

---

## 4. SPESIFIKASI MODUL GUIDE & TRAKEA JOINTING CORE FIBER (`/core-guide`)

### 4.1. Standar Pewarnaan TIA-598 (12 Warna Internasional)
Urutan baku 12 warna serat optik & loose tube:

| No | Nama Warna (ID) | TIA-598 Name | Kode Hex | Kelas Warna Visual |
| :-: | :--- | :--- | :-: | :--- |
| **1** | Biru | Blue | `#2563EB` | Biru Terang (Teks Putih) |
| **2** | Oranye | Orange | `#EA580C` | Oranye Cerah (Teks Putih) |
| **3** | Hijau | Green | `#16A34A` | Hijau Daun (Teks Putih) |
| **4** | Cokelat | Brown | `#854D0E` | Cokelat Kayu (Teks Putih) |
| **5** | Abu-Abu (Slate) | Slate / Gray | `#64748B` | Abu-Abu Netral (Teks Putih) |
| **6** | Putih | White | `#F8FAFC` | Putih Bersih (Border & Teks Slate Gelap) |
| **7** | Merah | Red | `#DC2626` | Merah Solid (Teks Putih) |
| **8** | Hitam | Black | `#0F172A` | Hitam Pekat (Teks Putih / Border Abu) |
| **9** | Kuning | Yellow | `#EAB308` | Kuning Emas (Teks Hitam) |
| **10** | Ungu | Violet / Purple| `#9333EA` | Ungu Tajam (Teks Putih) |
| **11** | Merah Muda (Pink)| Rose / Pink | `#EC4899` | Pink Cerah (Teks Putih) |
| **12** | Toska (Aqua) | Aqua / Turquoise | `#06B6D4`| Biru Toska (Teks Hitam/Putih) |

### 4.2. Interactive TIA-598 Core Calculator
Kalkulator interaktif 2 arah:
1. **Pencarian Berdasarkan Nomor Core Global (Contoh: Core 1 s/d 288)**:
   - *Algoritma*:
     $$\text{Tube Index} = \left\lfloor \frac{\text{Core Number} - 1}{12} \right\rfloor + 1$$
     $$\text{Core in Tube Index} = ((\text{Core Number} - 1) \pmod{12}) + 1$$
   - *Contoh Eksekusi*:
     - User input: **Core 28**
     - Sistem langsung menghitung: $\lfloor(28-1)/12\rfloor + 1 = 3$ (Tube Hijau) dan $((28-1)\%12)+1 = 4$ (Core Cokelat).
     - Menghasilkan visualisasi kartu kabel interaktif:
       - **Tube 3 (Hijau)** $\rightarrow$ **Core 4 (Cokelat)**.
2. **Reverse Selector (Pilih Tube & Core)**:
   - Teknisi memilih visual warna Tube dan Core pada baki $\rightarrow$ Sistem mengembalikan nomor Core Global.

### 4.3. Digital Jointing Matrix (Pendataan Trakea per Closure)
Menggantikan buku coretan kertas teknisi yang rawan basah/hilang:
1. **Daftar Joint Box / Closure**:
   - Menampilkan list seluruh closure yang ada di lapangan, dilengkapi kode area, tiang, dan kapasitas (24c/48c/96c).
2. **Visual Splicing Matrix**:
   - Skema tabel interaktif 3 kolom:
     - **Kabel Masuk (In-Cable)**: Nama Kabel, Tube, Core (dengan badge warna TIA-598).
     - **Status Sambungan**:
       - 🟢 **ACTIVE (Live Traffic)**: Diberi tanda gembok/peringatan tegas *"BERBAHAYA: Jangan Dipotong, Membawa Traffic Aktif!"*.
       - ⚪ **SPARE (Cadangan)**: Siap digunakan untuk ekspansi atau pelanggan baru.
       - 🔴 **DAMAGED (Rusak / Putus)**: Redaman tinggi atau putus di tengah jalur.
     - **Kabel Keluar (Out-Cable)**: Nama Kabel Distribusi/Dropcore, Tube, Core tujuan.
3. **Penyimpanan Foto Tray Fisik**:
   - Fasilitas upload foto langsung dari kamera HP teknisi saat closure dibuka.
   - Fitur zoom/pan foto tray agar teknisi maintenance berikutnya bisa melihat jalur susunan trakea tanpa harus meraba atau mengangkat baki yang berisiko patah.

---

## 5. RENCANA TAHAPAN EKSEKUSI (SPRINT IMPLEMENTATION ROADMAP)

Pengerjaan akan dibagi secara bertahap dan teratur (terdiri dari 5 Tahap) untuk menjamin stabilitas setiap komponen:

```
+------------------------------------------------------------------------------------+
|                                 TAHAPAN EKSEKUSI                                   |
+------------------------------------------------------------------------------------+
  [TAHAP 1] Persiapan Database & Storage Supabase
            - Pembuatan skema SQL lengkap (dismantle_tasks, joint_boxes, joint_box_splices).
            - Setup storage bucket (dismantle-evidence & closure-photos).
            - Penambahan mock/seed data realistis FTTH untuk testing instan.
       |
       v
  [TAHAP 2] Modul Guide Core & Kalkulator TIA-598 (/core-guide)
            - Library helper matematika konversi TIA-598 (colors.ts).
            - Komponen UI Color Calculator interaktif dengan badge warna kontras tinggi.
            - Halaman /core-guide dengan tabs (Kalkulator Warna & Daftar Closure).
       |
       v
  [TAHAP 3] Digital Jointing Matrix & Dokumentasi Tray (/core-guide/[id])
            - Halaman detail Joint Box & visualisasi trakea core-to-core.
            - Form penambahan/update splice (Fusion, Active/Spare/Damaged).
            - Proteksi alert untuk status ACTIVE.
            - Upload & viewer foto fisik tray closure.
       |
       v
  [TAHAP 4] Modul Dismantle: List, Grouping & Lifecycle (/dismantles)
            - Halaman /dismantles dengan filter Cluster & ODP.
            - Lifecycle state transition (Queue -> In Progress -> Completed/Failed).
            - Form modal pencatatan SN ONT, aksesoris, dan foto bukti.
            - Deteksi GPS live teknisi & pengurutan jarak terdekat (Haversine proximity).
       |
       v
  [TAHAP 5] Modul Dismantle: Integrasi GIS Cluster & Logistik Gudang
            - Tampilan tab peta Leaflet untuk cluster dismantle dengan marker status.
            - Tombol launcher sekali-klik Google Maps & Waze.
            - Tab generator serah terima gudang & tombol export data ke CSV/Excel.
            - Review responsivitas mobile & validasi menyeluruh.
```

---

## 6. DETAIL STRUKTUR FILE BARU YANG AKAN DIBUAT

Berikut adalah proyeksi pohon berkas (*file tree*) yang akan diimplementasikan pada tahap koding:

```
src/
├── app/
│   ├── core-guide/
│   │   ├── page.tsx                  # Halaman utama kalkulator TIA-598 & list Joint Box
│   │   └── [id]/
│   │       └── page.tsx              # Detail Joint Box & Matriks Splicing Trakea
│   └── dismantles/
│       └── page.tsx                  # Halaman utama Dismantle (List, Map, Serah Terima)
├── components/
│   ├── core-guide/
│   │   ├── TIACalculator.tsx         # Widget interaktif konversi core TIA-598
│   │   ├── ColorReferenceTable.tsx   # Tabel acuan 12 warna dan loose tube
│   │   ├── JointingMatrixTable.tsx   # Matriks trakea core masuk vs keluar
│   │   └── TrayPhotoViewer.tsx       # Komponen viewer & upload foto baki closure
│   └── dismantles/
│       ├── DismantleCard.tsx         # Kartu tugas dismantle dengan indikator jarak GPS
│       ├── DismantleClusterFilter.tsx# Filter dropdown/pills area & parent ODP
│       ├── DismantleMap.tsx          # Peta Leaflet khusus sebaran tugas dismantle
│       ├── DismantleStatusModal.tsx  # Modal transisi status, input SN & foto
│       └── HandoverSummaryTable.tsx  # Tabel rekapitulasi serah terima logistik
└── lib/
    ├── ftth/
    │   ├── tia598.ts                 # Utilitas kalkulasi TIA-598 (Tube, Core, Color Tokens)
    │   └── distance.ts               # Algoritma Haversine hitung jarak koordinat
    └── types/
        ├── dismantle.ts              # TypeScript interfaces untuk data dismantle
        └── coreGuide.ts              # TypeScript interfaces untuk Joint Box & Splice Matrix
```

---

## 7. ANALISIS RISIKO & STRATEGI MITIGASI

| Skenario Lapangan / Teknis | Risiko Potensial | Solusi Mitigasi yang Dirancang |
| :--- | :--- | :--- |
| **Sinyal Lemah di Perumahan** | Teknisi kesulitan upload foto atau gagal update status | Implementasi *Optimistic UI Update* di sisi React State agar teknisi tetap bisa melanjutkan pekerjaan, dengan notifikasi status sinkronisasi. |
| **Akses GPS Ditolak / Tidak Aktif** | Jarak terdekat tidak bisa dihitung otomatis | Sediakan fallback manual: daftar diurutkan berdasarkan alfabetis cluster atau ODP, serta tombol *Retry Get Location* yang ramah pengguna. |
| **Kesalahan Potong Core Aktif** | Pemadaman massal jika teknisi salah menyambung core yang ada pelanggan | Berikan indikator visual merah menyala dengan icon gembok pada status `ACTIVE` dan konfirmasi ganda (*Double Confirmation Dialog*) sebelum data splicing bisa diubah. |
| **Leaflet Hydration Error di Next.js** | Error rendering browser saat load peta GIS | Menggunakan `next/dynamic` dengan opsi `{ ssr: false }` sebagaimana yang sudah sukses diimplementasikan pada `FTTHMap.tsx`. |
| **Foto Kamera HP Terlalu Besar** | Kuota teknisi boros dan upload lambat | Terapkan kompresi gambar sisi klien (*client-side canvas resize*) sebelum upload ke Supabase Storage (max width 1280px, kualitas 80%). |

---

## 8. KESIMPULAN & LANGKAH PERSETUJUAN (NEXT STEPS)

Perencanaan matang ini (`planning-fv1.md`) dirancang untuk memastikan bahwa pengembangan fitur **Dismantle Grouping** dan **Guide Core TIA-598** menjawab kebutuhan riil teknisi di lapangan secara akurat, modern, dan mudah digunakan pada perangkat mobile.

### Pertanyaan Konfirmasi untuk User:
1. **Apakah skema alur dan pembagian tahap pengerjaan di atas sudah disetujui?**
2. **Apakah kita siap melanjutkan ke TAHAP 1 (Menyiapkan Skema SQL & Database Supabase untuk Dismantle & Joint Box)?**
