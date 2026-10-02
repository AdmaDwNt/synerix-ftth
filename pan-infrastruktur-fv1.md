================================================================================
          PERENCANAAN & INFRASTRUKTUR GIS SYNERIX (KML/KMZ PARSER)
================================================================================

1. ARSITEKTUR PEMROSESAN DATA (PARSING PIPELINE)
--------------------------------------------------------------------------------
* Client-Side Parsing: File .kml/.kmz diproses langsung di browser menggunakan 
  JSZip dan @tmcw/togeojson tanpa membebani server backend.
* Data Sanitizer: Pemisahan otomatis antara Point (ODP, ODC, Server, Tiang) 
  dan LineString (Jalur Kabel Fiber Optik).
* Bulk Ingest: Proses batch INSERT ke Supabase PostgreSQL agar proses simpan 
  ratusan titik data berjalan instan tanpa timeout.


2. STRATEGI OPTIMALISASI TAMPILAN MAP (ANTI-CLUTTERED & PERFORMANSI HIGH-FPS)
--------------------------------------------------------------------------------
* Dynamic Marker Clustering:
  - Zoom 1 - 13 : Ratusan titik otomatis melebur menjadi 1 bulatan cluster angka.
  - Zoom 14 - 16: Cluster mengecil dan menampilkan ikon kategori node.
  - Zoom 17+    : Titik menyebar penuh. Mengaktifkan fitur "Spiderfy" jika ada 
                  beberapa node di koordinat yang sangat berdekatan.
* Smart Label Visibility:
  - Label teks nama ODP/ODC/Tiang disembunyikan secara bawaan pada zoom jauh.
  - Teks label hanya muncul otomatis saat di-zoom dekat atau saat marker diklik.
* Micro-SVG Rendering:
  - Mengganti ikon pin default yang besar dengan Micro-Dot Vector SVG (12-16px).
  - Engine Canvas Renderer untuk jalur kabel agar gerakan peta tetap mulus 60 FPS 
    di layar smartphone.


3. STRUKTUR DATABASE SUPABASE (POSTGIS EXTENSION)
--------------------------------------------------------------------------------
* kml_layers    : Menyimpan metadata file .kml/.kmz yang di-upload.
* network_lines : Menyimpan jalur koordinat kabel fiber optik (LineString).
* network_nodes : Menyimpan titik ODP, ODC, POP, Server, dan Tiang beserta 
                  layer_id dan atribut aslinya (raw_properties).


4. ALUR INTERAKSI UI/UX DI MODUL MAPPING (/mapping)
--------------------------------------------------------------------------------
* Import KML/KMZ Drag-and-Drop Button pada Topbar Modul Mapping.
* Layer Manager (Side Panel) dengan Toggle Switch (ON/OFF) untuk menyembunyikan/
  menampilkan layer tertentu.
* Fast Category Filter Button: [All] [Server/POP] [ODC] [ODP] [Tiang] [Dismantle].
================================================================================