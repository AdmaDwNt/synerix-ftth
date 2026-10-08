pengembangan dan penyesuaian ini untuk pekerjaan dan sismantle

saya ingin melakukan perombakan besar kali ini. mekanisme tambah data:
1. ketika saya klik tambah data, munculkan sebuah komponen tambahan seperti bagian "Cari ID, Judul, Pelanggan...."
2. saya akan mencari berdasarkan salah satu antara nama/id pelanggan, id tiket, alamat singkat, nomer hp. kalau nama kan biasanya ada nama entah awalan, tengah atau akhiran yang sama. itu nanti tampilkan daftarnya saya akan memilih. 
3. kalau sudah saya pilih dan saya klik "
Simpan Tugas Dismantle" maka langsung ditambahkan ke daftar di halaman /dismantles. 
tolong hilangkan saja fitur Autofill ini. ganti dengan pencarian data seperti yang saya jelaskan
4. untuk "Tambah Tugas Dismantle Baru" saat ini sepertinya tidak diperlukan lagi, jadi sembuyikan saja, tapi jangan sampai memperberat project ini
5. kalau nanti search nya via id tiket nanti yang ditambahkan ke tabel kolom pelangggan itu bukan id tiketnya melainkan id pelanggan ya. 
6. untuk nama tabelnya sama seperti scrapping. jadi ada 
#ID
NAMA PELANGGAN
DESA / DUSUN	
NO WA	
TGL DAFTAR
STATUS	
ITN	
PJK	
AKSI
pembedanya untuk melihat detailnya di billingnesia itu harus klik icom mata di kolom aksi. untuk project ini selain klik icon mata juga bisa klik id pelanggan ya. kolom pelanggan kan berupa link. tambahan lagi untuk di kolom aksi tambahkan icon lokasi yang fungsinya untuk membuka sharelok scraping.
7. ketika saya klik id tiket atau icon mata, akan membuka https://billing.at-in.net/admin/data/detailpelanggan/"id pelanggan" dari hasil scraping. ini full ya
8. di https://billing.at-in.net/admin/data/detailpelanggan/"id pelanggan" ada bar "tiket" di bagian tiket ini tabel yang ditampilkan :

#ID
TGL DIBUAT
TINDAKAN TERAKHIR	
%	
STATUS
AKSI
disini untuk melihat detail tiketnya bisa dengan cara klik icon mata di kolom aksi dan bisa juga dengan cara klik id tiketnya. 

##ketika saya nanti sudah klik "
Simpan Tugas Dismantle" nanti di peta cluster gis akan menambahkan pin baru sesuai data sharelok dari scraping. selain di pin juga diberikan sesuai namanya. ketika saya klik pinya akan ditampikan kotak dialog yang berisi nama pelanggan, id, alamat(bukan sharelok ya), no wa, status, daftar dismantle(kabel/ont/tagihan/ seberapa diantara ketiga itu) (biasanya di "https://billing.at-in.net/admin/tiket/detailtiket/"id tiket" di bagian "Keterangan / Indikasi Awal" Dismantle total
Tagihan tertunggak Rp 222.000) ada keterangannya seperti ini, tapi perlu divalidasi lagi di log aktivitas id tiket dismantlenya, disitu ada laporannya kalau ont/kabel/tagihan sudah diambil semua atau masih beberapa. utnuk tagiihan bisa divalidasi lagi di menu invoice kalau statusnya jatuh tempo berarti ada tagihan kalau lunas berarti tidak ada tagihan. selain itu jangan lupa untuk menandai progresnya sudah di dismantle apa aja