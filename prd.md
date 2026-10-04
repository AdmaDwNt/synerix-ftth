Berikut adalah dokumen Product Requirement Document (PRD) dan Rencana Pengerjaan (Implementation Plan) lengkap untuk mengintegrasikan fitur Smart Auto-Ingest Dismantle via Bookmarklet (Mobile-First) ke dalam aplikasi Synerix FTTH:

Markdown
# PRODUCT REQUIREMENT DOCUMENT (PRD) & PLAN PENGERJAAN
## Fitur: Smart Auto-Ingest Dismantle via Bookmarklet (Mobile-First)
**Aplikasi:** Synerix FTTH (`synerix-ftth`)  
**Target User:** Field Technician / Maintenance Team (Penggunaan via HP Android/iOS)  
**Tujuan Utama:** Memangkas alur input manual data dismantle dari Billingnesia ke Synerix dari 7 langkah menjadi 1-tap via Bookmarklet browser HP.

---

### 1. RINGKASAN MASALAH & SOLUSI

* **Masalah Saat Ini:**
  Teknisi di lapangan harus menyalin ID Tiket, mencari detail pelanggan, menyalin alamat lengkap, mencari lokasi Google Maps manual, mencatat tunggakan tagihan dari invoice, lalu membuat marker/label manual di Google Maps (e.g. O-01). Alur ini sangat lambat dan tidak efisien jika dikerjakan murni lewat HP.

* **Solusi Solutif:**
  Membuat endpoint API khusus `/api/dismantle/ingest` di Synerix dan script **Bookmarklet JavaScript Mobile** yang berjalan langsung di browser Chrome/Safari HP. Script akan secara otomatis memindai DOM Billingnesia (Detail Tiket, Detail Pelanggan, Tab Invoice), mengekstrak seluruh data penting, dan mengirimkannya ke Supabase Synerix secara real-time.

---

### 2. KEBUTUHAN RUNTIME & TEKNIS (REQUIREMENTS)

#### A. Data Payload (Yang Otomatis Diambil dari Billingnesia)
1. **Ticket ID & Customer ID:** Diambil dari teks/URL halaman (e.g. `TKT202610014768`, `0101010602040`).
2. **Nama Pelanggan:** Diambil dari header/elemen nama (`SRI RAHAYU`).
3. **Alamat Lengkap & Wilayah:** Diambil dari blok alamat/info pribadi.
4. **Koordinat GIS (Lat/Lng):** Di-extract dari atribut `href` link Google Maps yang tertanam di halaman Billingnesia.
5. **Detail Tagihan Tertunggak:**
   - Memindai tab Invoice untuk baris berstatus **`JATUH TEMPO`** (badge merah).
   - Menjumlahkan nominal otomatis (e.g. `Rp 111.000`).
6. **Auto Cluster Tag:** Sistem Synerix otomatis menautkan tag tanggal berdasarkan tanggal ingest (e.g. `O-03` untuk Oktober tanggal 3).
7. **Detail Peralatan:** Default set ke `ONT, Kabel Dropcore` (dapat disesuaikan lewat UI Synerix).

#### B. API Endpoint Backend (`/api/dismantle/ingest`)
- **Method:** `POST`
- **Security:** Ingest Token / Secret Header validation.
- **Handling Dupes:** Jika `ticket_id` atau `customer_id` sudah ada di database, lakukan `UPSERT` (update data terbaru tanpa duplikasi).

---

### 3. RANCANGAN SKEMA DATABASE (SUPABASE)

Pastikan tabel `dismantles` pada Supabase mendukung kolom pendukung berikut:

```sql
-- Penyesuaian skema dismantles di Supabase
ALTER TABLE public.dismantles 
ADD COLUMN IF NOT EXISTS ticket_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS unpaid_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_url TEXT,
ADD COLUMN IF NOT EXISTS auto_ingested BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_dismantles_ticket_id ON public.dismantles(ticket_id);
4. DOKUMEN SCRIPT BOOKMARKLET (SIAP DIPASANG DI HP)
Simpan script JavaScript berikut sebagai URL Bookmark di browser HP (diberi nama + Kirim ke Synerix):

JavaScript
javascript:(function(){
  const API_URL = '[https://synerix-ftth.vercel.app/api/dismantle/ingest](https://synerix-ftth.vercel.app/api/dismantle/ingest)';
  
  let payload = {
    ticket_id: '',
    customer_id: '',
    customer_name: '',
    address: '',
    latitude: null,
    longitude: null,
    unpaid_amount: 0,
    notes: 'Dismantle Total',
    billing_url: window.location.href
  };

  // 1. Extract Ticket ID dari URL atau Teks
  const ticketMatch = window.location.href.match(/TKT\d+/i) || document.body.innerText.match(/TKT\d+/i);
  if(ticketMatch) payload.ticket_id = ticketMatch[0];

  // 2. Extract Customer ID (13 Digit angka)
  const idMatch = document.body.innerText.match(/\b\d{13}\b/);
  if(idMatch) payload.customer_id = idMatch[0];

  // 3. Extract Nama Pelanggan
  const nameElem = document.querySelector('.card-title, h3, .detail-name');
  if(nameElem) {
    let rawName = nameElem.innerText.split('-')[1] || nameElem.innerText;
    payload.customer_name = rawName.trim();
  }

  // 4. Extract Alamat
  const bodyText = document.body.innerText;
  const addrMatch = bodyText.match(/(jalan|jl\.|dusun|desa|kecamatan)[\s\S]*?(?=\b(MARKETER|COMMITMENT|SERVER|KOMITMEN)\b|$)/i);
  if(addrMatch) payload.address = addrMatch[0].replace(/\n/g, ' ').trim();

  // 5. Extract Nominal Tagihan Jatuh Tempo (Tab Invoice)
  let totalUnpaid = 0;
  const rows = Array.from(document.querySelectorAll('tr'));
  rows.forEach(row => {
    if(row.innerText.includes('JATUH TEMPO')) {
      const priceMatch = row.innerText.match(/Rp\s*([\d.]+)/);
      if(priceMatch) {
        totalUnpaid += parseInt(priceMatch[1].replace(/\./g, ''), 10);
      }
    }
  });
  if(totalUnpaid > 0) payload.unpaid_amount = totalUnpaid;

  // 6. Extract Koordinat Lat/Lng Google Maps
  const mapLinks = Array.from(document.querySelectorAll('a[href*="[google.com/maps](https://google.com/maps)"], a[href*="maps.google.com"]'));
  for(let link of mapLinks) {
    const coordsMatch = link.href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || link.href.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if(coordsMatch) {
      payload.latitude = parseFloat(coordsMatch[1]);
      payload.longitude = parseFloat(coordsMatch[2]);
      break;
    }
  }

  // Send to Synerix API
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(res => {
    if(res.success) alert('✅ Berhasil dikirim ke Synerix!\nPelanggan: ' + (payload.customer_name || 'Terdeteksi') + '\nTag Cluster: ' + res.cluster_tag);
    else alert('❌ Gagal Ingest: ' + res.error);
  })
  .catch(err => alert('❌ Error Koneksi ke Synerix: ' + err.message));
})();
5. TAHAPAN PLAN PENGERJAAN (STEP-BY-STEP IMPLEMENTATION)
Phase 1: Database & Backend API Route 
Update Skema Supabase:

Jalankan script SQL penyesuaian di Supabase SQL Editor.

Buat File API Route Route Next.js:

Buat file src/app/api/dismantle/ingest/route.ts.

Implementasikan handler POST dengan kalkulasi otomatis cluster_tag berbasis tanggal hari ini (e.g. O-03 untuk 3 Oktober).

Tambahkan fungsi penanganan koordinat default jika pelanggan belum memiliki koordinat Maps.

Phase 2: UI Improvement di Synerix Dismantle Page 
Tambahkan Badge Tag & Nominal Tagihan:

Di komponen DismantleCard.tsx / DismantleTable.tsx, tampilkan nominal unpaid_amount dengan format Rupiah yang menonjol.

Sediakan tombol pintas Buka Billingnesia berdasarkan billing_url.

Direct Google Maps Navigation:

Sediakan tombol Navigasi (Google Maps) yang langsung mengarahkan HP teknisi ke koordinat target.

Phase 3: Testing & Deployment 
Commit & Push ke GitHub:

git add .

git commit -m "feat: add dismantle auto ingest API and mobile bookmarklet support"

git push origin main

Validasi Deployment Vercel:

Pastikan build Vercel sukses tanpa error.

Pemasangan Bookmarklet di HP Android/iOS:

Simpan bookmarklet di Google Chrome HP.

Uji coba klik bookmarklet di halaman Detail Pelanggan & Invoice Billingnesia.

Pastikan data muncul di peta & daftar dismantle Synerix.