Berikut adalah rekapitulasi status pengerjaan proyek Synerix Network Operations Platform berdasarkan perencanaan awal hingga progres saat ini:

Fitur yang Sudah Selesai (Completed)
Inisialisasi Project & Core Stack: Setup Next.js App Router, Tailwind CSS (Clean Light Theme), dan integrasi Lucide Icons.

Branding & Topbar Navigation: Topbar responsif yang menampilkan logo utama Synerix beserta ekosistem logo Asterix, Fibermaxs, dan Digimaxs.

Database & Security Setup (Supabase): Integrasi Supabase client/server SDK, konfigurasi .env.local, dan pembuatan skema tabel PostgreSQL dasar (work_logs, network_nodes, dll).

Overview Dashboard (/): Tampilan Command Center, widget Quick Stats, Action Shortcuts, serta Redaman Loss Calculator interaktif.

Modul Log Pekerjaan (/work-logs): Form pencatatan case operasional (Maintenance, Project, Dismantle), penangkapan koordinat GPS otomatis, input nilai redaman dBm, dan filter/pencarian riwayat.

Fitur yang Sudah Dibuat Tapi Belum Selesai (In Progress / Need Testing)
Modul Peta GIS & Tagging Jaringan (/mapping):

Status: Komponen peta Leaflet (FTTHMap.tsx) dan halaman /mapping sudah dikoding, namun perlu dipastikan berjalan tanpa error 404 serta diuji fungsi click-to-tag koordinat ODP, ODC, POP, dan Server.

Fitur yang Belum Dikerjakan (Backlog / To-Do)
Modul Dismantle Grouping & Routing (/dismantles):

Pengelompokan daftar tugas penarikan perangkat berdasarkan area/cluster perumahan.

Status eksekusi (Queue, In Progress, Completed, Failed).

Visualisasi rute dismantle pada peta GIS.

Modul Jadwal Shift & Cuti (/shifts):

Fitur import/upload file spreadsheet (.xlsx/.csv) jadwal shift bulanan.

Ringkasan jam kerja bulanan dan riwayat shift.

Tracker kuota cuti tahunan (12x/tahun) dan form pengajuan cuti.

Modul Catat Lembur / Overtime Tracker (/overtime):

Form log durasi lembur (Start Time, End Time, jenis pekerjaan).

Opsi kompensasi (Uang Lembur vs Libur Pengganti/Off Replacement).

Fitur rekapitulasi & ekspor laporan lembur bulanan.

Modul Guide & Trakea Jointing Core Fiber (/core-guide):

Alat bantu visual urutan 12 warna tube & core fiber optik standar TIA-598.

Pencatatan jointing matrix (pemetaan core masuk vs core keluar) per Joint Box/Closure.

Status core (Active, Spare, Damaged).

Modul Monitoring Backup NOC (/noc-monitor):

Quick status board untuk catatan outage / pemotongan fiber massal.

Tracker latency / ping sederhana ke perangkat OLT/POP.

Modul Autentikasi & Manajemen Akses User:

Halaman Login (/login) menggunakan Supabase Auth.

Manajemen role pengguna (Admin vs Rekan Kerja/Teknisi) beserta pembuatan akun baru.

Pengaktifan kembali Row Level Security (RLS) agar data aman terenkripsi.

modul pertama adalah Modul Dismantle/Guide Core.
