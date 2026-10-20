building dan pengembangan project website sampai saat ini sudah cukup baik. sekarang saya mau ada tambahan dan penyesuaian baru. penjelasannya sebagai berikut:

1. saya mau untuk akses project ini menggunakan sistem login sesuai username dan password sesuai billingnesia. karena kan saat ini untuk user loginnya hanya menggunakan user login billingnesia saya, saya tidak mau seperti saat ini karena log nya di billingnesia kan menjadi user saya saja. karena username loginnya kan ditanam di environment variable vercel. jadi saya mau user loginnya sesuai billingnesia masing masing jika nanti rekan kerja saya juga ingin menggunakannya. intinya saya ingin sistem ini aman apalagi sekarang ada isue ada malware di javascript. mungkin bisa dibuatkan database untuk user project ini saja atau bagaimana, yang jelas username dan passwordnya harus sesuai billingnesia. nanti jika rekan saya ingin menggunakan project saya ini, saya tinggan inputkan username dan password dari sistem di project ini. user saya superadmin jadi bisa mengontrol semua user yang terdaftar di project ini, bisa menambahkan user, menghapus user, mengubah status user (aktif/tidak aktif), mengubah role user, bisa mengganti password user. nanti user biasa tidak bisa melakukan hal tersebut. intinya aksesnya harus lebih fleksibel dan aman. jadi mungkin dan pastinya perlu halaman manajemen untuk saya menambahkan user baru, dan mengizinkan akses mana saja yang bisa dibuka atau diakses oleh user rekan rekan saya nantinya. sebenarnya di billingnesia juga ada menu dan fitur untuk ubah password, jadi kalau bisa sih di scrapping agar saya atau rekan saya mengganti password dari project ini juga terintegrasi dengan database billingnesia tanpa api billingnesia secara langsung (untuk username dan passwordnya nya tetap menggunakan login billingnesia masing masing 

2. sebenarnya di billingnesia kan saya juga perlu melaporkan pekerjaan yang sudah saya kerjakan sesuai apa yang telah saya laporkan. karena di billingnesia kamu tahu kan ada menu input aktivitas, nah disitu tempatnya. disitu ada keterangan/tindakannya, persentase per tindakan, lampiran per tindakan(tidak semua tindakan memerlukan lampiran foto ini), karyawan(kelemahannya disini harus memilih secara manual, jadi tidak sesuai user login karena biasanya yang mengerjakan sebuah tiket dan sebuah tindakan itu tidak hanya 1 orang. sebanarnya harapan saya dalam project ini tuh untuk pilih karyawannya atau yang mengerjakan tindakan itu sesuai user loginnya bisa juga menambahkan karyawan lain jika memang yang mengerjakan ada lebih dari 1 orang). dan yang terakhir adalah "Pengeluaran Barang Gudang" ada pilihan "Ya, menggunakan barang
dan Tidak menggunakan barang". untuk tidak menggunakan barang ini biasanya diberi alasan kenapa tidak menggunakan barang dan kalau menggunakan barang ini pilih barang sesuai NTP dan nantinya ini akan ter input di gudang dan ada keterangan NTP dan barang yang digunakan di log aktivitas. sebenarnya tidak benar benar terinput digudang karena informasi dari atasan walaupun sudah input di billingnesia, di https://gudang.at-in.net/ saya harus input lagi. di "https://gudang.at-in.net/" ini juga memakai user login berbeda dengan billingnesia. 

dan ada lagi ketika psb tuh laporannya ada salah satunya seperti ini:
[Pemakaian Barang]
ONT : 1
Kabel:  32m
fastkon : 1
PS Besar :
PS Kecil :
Barrel : 
Splitter: 
Kabel Ties:
Paku Klip: 7
Lain-lain:

ini dilakukan manual di telegram karena semua tiket itu lognya juga dimasukan ke telegram berdasarkan id tiket dari log aktivitas billingnesia.  dan harus melampirkan 6 atau 7 foto bukti pekerjaan.
sedangkan di billingnesia hanya bisa menginput 1 lampiran. jadi dengan project ini bisa menjadi solusi untuk masalah ini. jadi nanti bisa di project ini saya bisa menginput lampiran lebih dari 1 foto. dan untuk pelaporannya bisa langsung terkirim ke telegram sesuai id tiket dari log aktivitas billingnesia. dan untuk kolom karyawan di billingnesia nanti bisa di project ini bisa otomatis sesuai user loginnya bisa juga menambahkan karyawan lain jika memang yang mengerjakan ada lebih dari 1 orang.

3. ketika saya backup untuk monitoring itu biasanya juga membuat tiket di "https://billing.at-in.net/admin/tiket/addtiket". membuat tiket ini seringnya pelanggan dying, los, mantenance jaringan nanti dikerjakan tim yang bertugas di lapangan. disini awalnya harus pilih jenis tiket (hanya ada 1 pilihan sih sebanarnya yaitu "teknis"), selanjutnya pilih kategori tiket(ada maintenance retail, maintenance jaringan, project, dan kegiatan lainnya) kalau maintenance retail itu tiket dying, kompain pelanggan yang memerlukan kunjugan ke lokasi, pindah alat, kabel pelanggan putus (loss), ganti alat dan lain lain. kalau maintenance jaringan itu biasanya untuk kabel jalur yang gangguan, contoh 1 pon loss dan lain sebagainya. 


jadi seperti itu. untuk yang nomot 3 ini masih belum detail jadi belum perlu dikerjakan sekarang yang utaman point 1 dan 2