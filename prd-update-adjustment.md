# SYSTEM SPECIFICATION UPDATE & FEATURE EXTENSION
## Fitur: On-Demand Scraper & Smart Autofill Input Form
**Aplikasi:** Synerix FTTH (`synerix-ftth`)  
**Target Modul:** Modul Pekerjaan (`/work-logs`) & Modul Dismantle (`/dismantles`)  
**Tujuan Utama:** Menghadirkan otomatisasi pengisian form input data (Smart Autofill) secara langsung dari Billingnesia saat pengguna menambah pekerjaan/dismantle baru tanpa mengubah alur kerja native.

---

### 1. ALUR KERJA BARU (USER FLOW)

1. Pengguna membuka halaman **Pekerjaan** (`/work-logs`) atau **Dismantle** (`/dismantles`).
2. Pengguna menekan tombol **`+ Tambah Data`** / **`+ Tambah Tugas Dismantle Baru`**.
3. Di dalam modal form input, pengguna melihat blok baru paling atas: **`⚡ Tarik Data Otomatis dari Billingnesia`**.
4. Pengguna memasukkan kata kunci pada kolom khusus tersebut (bisa berupa **Nomor Tiket** `TKT...` atau **ID Pelanggan** `0101...`).
5. Pengguna menekan tombol **`🔍 Tarik Data`**.
6. Server menjalankan *On-Demand Scraper* secara instan ke Billingnesia, memuat data detail tiket, info pelanggan, status tagihan invoice, dan mengonversi link Google Maps menjadi koordinat Lat/Lng.
7. Seluruh field pada form input (Nama, No WA, Alamat, Koordinat, Kategori, Judul/Tagihan) terisi otomatis dalam 1–2 detik.
8. Pengguna meninjau hasil isian, lalu menekan tombol **`Simpan`**.

---

### 2. DESAIN & PENYESUAIAN KOMPONEN FORM INPUT

#### A. Komponen Banner Autofill (`BillingnesiaAutofillBanner.tsx`)
Komponen ini disisipkan di bagian atas form modal input:

```tsx
<div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-xl border border-teal-200 mb-5 shadow-sm">
  <div className="flex items-center gap-2 mb-2">
    <span className="text-base">⚡</span>
    <label className="text-xs font-bold text-teal-800 uppercase tracking-wider">
      Autofill Otomatis dari Billingnesia
    </label>
  </div>
  <div className="flex gap-2">
    <input 
      type="text" 
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Masukkan Nomor Tiket (TKT...) atau ID Pelanggan (0101...)" 
      className="w-full text-sm px-3 py-2 rounded-lg border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
    />
    <button 
      type="button"
      onClick={handleFetchBillingnesia}
      disabled={isLoading}
      className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-all disabled:opacity-50"
    >
      {isLoading ? 'Fetching...' : '🔍 Tarik Data'}
    </button>
  </div>
  <p className="text-[11px] text-teal-600 mt-2">
    *Isian form di bawah akan terurai dan terisi otomatis setelah data Billingnesia berhasil ditarik.
  </p>
</div>


B. Pemetaan Field Form (Mapping Data)Field Form Modal SynerixSumber Data Billingnesia yang Di-ScrapeID Pelanggancustomer_id (10–13 Digit)Nama Lengkap Pelanggancustomer_name (Di-clean dari prefix "Detail Pelanggan")No. WhatsApp / HPphone_number (Ekstraksi Regex angka 08... / 628...)Alamat Rumah Lengkapaddress (Blok alamat lengkap desa/kecamatan)Tipe / Merk ONT & Keterangandevice_type & Summary unpaid_amount (Invoice Jatuh Tempo)Titik Koordinat (Latitude & Longitude)Extracted @lat,lng dari tautan Google Maps di BillingnesiaKategori Tiketcategory (MAINTENANCE RETAIL, MAINTENANCE JARINGAN, PROJECT, KEGIATAN LAINNYA)
3. SPESIFIKASI BACKEND SCRAPER SERVICE (/api/scraper/billingnesia/route.ts)
Method: POST

Request Body:
{
  "query": "TKT202610014768" // Nomor Tiket atau ID Pelanggan
}

Prinsip Operasional Scraper:

Session Reuse: Memanfaatkan session cookie aktif yang tersimpan untuk menghindari overhead re-login.

Fast DOM Extraction: Membuka detail tiket/pelanggan target langsung via direct URL query.

Multi-Category Coverage: Mendukung penarikan data dari seluruh kategori tiket TEKNIS (MAINTENANCE RETAIL, MAINTENANCE JARINGAN, PROJECT, KEGIATAN LAINNYA).

Robust Parsing: Jika koordinat Google Maps tidak ditemukan di Billingnesia, API mengembalikan nilai fallback koordinat area operasional default dengan flag coordinates_found: false.

Response Body (Success HTTP 200):
{
  "success": true,
  "data": {
    "ticket_id": "TKT202610014768",
    "customer_id": "0101010602040",
    "customer_name": "SRI RAHAYU",
    "phone_number": "082229999875",
    "address": "Jalan Pabrik Arang Rt 03 Rw 01 Dusun Budimulyo Utara Desa Branggahan",
    "latitude": -7.8231,
    "longitude": 111.9174,
    "category": "MAINTENANCE RETAIL",
    "unpaid_amount": 111000,
    "device_type": "ONT ZTE F609",
    "billing_url": "[https://billing.at-in.net/admin/tiket/detailtiket/TKT202610014768](https://billing.at-in.net/admin/tiket/detailtiket/TKT202610014768)"
  }
}

4. RENCANA IMPLEMENTASI BERTAHAP
Tahap 1: Backend Scraper Module & API Route

Buat helper scraper src/lib/scraper/billingnesiaScraper.ts yang menangani login & DOM parsing.

Buat endpoint API Route /api/scraper/billingnesia/route.ts.

Tahap 2: Refactoring Form Input Modal (UI)

Perbarui modal Tambah Data di /work-logs (WorkLogModal.tsx).

Perbarui modal Tambah Tugas Dismantle Baru di /dismantles (DismantleModal.tsx).

Pasang blok BillingnesiaAutofillBanner dan sambungkan handler state autofill.

Tahap 3: Testing & Validation

Uji penarikan data dengan berbagai kata kunci ID Tiket & ID Pelanggan.

Validasi fallback handling saat input diisi secara manual jika jaringan ke Billingnesia lambat.

Deploy ke Vercel via GitHub Commit.