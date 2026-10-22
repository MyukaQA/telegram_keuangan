# 💰 Bot Pencatat Keuangan Telegram (Google Apps Script + Google Sheets)

Aplikasi bot Telegram untuk manajemen dan pencatatan keuangan pribadi harian, terintegrasi langsung dengan **Google Sheets** sebagai database, didukung pemantauan anggaran harian (*Daily Budget Calculator*), sistem pencatatan cicilan, sinkronisasi ke backend Laravel eksternal, dan **Web Dashboard** interaktif berbasis Chart.js.

---

## 🌟 Fitur Utama

- **Pencatatan Cepat & Natural**: Catat pengeluaran atau pemasukan langsung dari chat (contoh: `makan 25000`, `gaji 5000000`, `bensin 30000 kemarin`).
- **Deteksi Tanggal Natural**: Mendukung backdate otomatis (`kemarin`, `2 hari lalu`, `tanggal 15`, `DD/MM/YYYY`).
- **Budget Monitoring & Threshold**:
  - Menghitung sisa hari hingga tanggal gajian berikutnya.
  - Menghitung jatah belanja harian (*Daily Budget* = Saldo ÷ Sisa Hari).
  - Status indikator visual: 🔴 Kritis (*Danger*), 🟡 Peringatan (*Warning*), 🟢 Aman (*Safe*).
  - Peringatan otomatis real-time jika pengeluaran membuat budget harian masuk zona bahaya.
- **Manajemen Cicilan & Hutang**:
  - Pendaftaran cicilan baru dengan tenor, cicilan per bulan, dan tanggal jatuh tempo.
  - Pembayaran cicilan yang otomatis mengurangi sisa saldo hutang dan mencatatnya ke pengeluaran.
- **Rekap & Analitik Interaktif**:
  - Rekap harian, bulanan, dan total saldo.
  - Menu pemilih bulan interaktif menggunakan Telegram Inline Keyboard.
- **Web Dashboard Interaktif**:
  - Visualisasi grafik donat perbandingan pemasukan vs pengeluaran.
  - Bar chart tren keuangan 6 bulan terakhir.
  - Pie chart sebaran kategori pengeluaran dan tabel detail riwayat transaksi.
- **Sinkronisasi Eksternal (Opsional)**:
  - Antrean data berstatus `pending` yang dapat disinkronkan ke REST API backend (Laravel/Ngrok).

---

## 📁 Struktur File Proyek

```text
├── .gitignore              # Daftar file yang diabaikan Git
├── BudgetCalculator.gs     # Logika kalkulasi jatah harian & status threshold
├── CallbackHandler.gs      # Handler tombol inline keyboard Telegram
├── CommandHandler.gs       # Handler seluruh perintah Telegram (13 command)
├── Config.example.gs       # Template konfigurasi publik
├── Config.gs               # Konfigurasi aktif (diabaikan Git demi keamanan)
├── Dashboard.gs            # Backend controller Web App doGet()
├── Dashboards.html         # Frontend Web Dashboard (HTML + CSS + Chart.js)
├── Database.gs             # Layer interaksi & CRUD Google Sheets
├── DateParser.gs           # Parser tanggal natural dari teks pesan
├── Main.gs                 # Webhook entry point doPost(), registrasi webhook & unit test
├── SyncHandler.gs          # Client integrasi sinkronisasi data ke Laravel
├── TelegramAPI.gs          # HTTP Client pembungkus Telegram Bot API
├── TransactionHandler.gs   # Parser teks transaksi & deteksi kategori
└── Utils.gs                # Helper format Rupiah dan utilitas umum
```

---

## 🚀 Panduan Instalasi & Setup dari Awal

### Langkah 1: Buat Bot Telegram
1. Buka aplikasi Telegram, cari akun bot resmi [@BotFather](https://t.me/BotFather).
2. Kirim perintah `/newbot`.
3. Beri nama dan username bot sesuai keinginan Anda (contoh: `DompetKu_bot`).
4. `@BotFather` akan memberikan **HTTP API Bot Token** (contoh format: `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`). Simpan token ini.

---

### Langkah 2: Buat Google Spreadsheet
1. Buka [Google Sheets](https://sheets.new) untuk membuat spreadsheet baru.
2. Beri nama spreadsheet (misal: `Database Keuangan Bot`).
3. Salin **Spreadsheet ID** dari URL browser:
   ```text
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID_DISINI]/edit
   ```
   *(Contoh: Pada `https://docs.google.com/spreadsheets/d/1SfxaLqm9HZmK9kAFPtIh.../edit`, bagian `1SfxaLqm9HZmK9kAFPtIh...` adalah Spreadsheet ID)*.

---

### Langkah 3: Siapkan Google Apps Script
1. Di spreadsheet tadi, buka menu **Extensions** > **Apps Script** (atau **Ekstensi** > **Apps Script**).
2. Di panel sebelah kiri (Files / Berkas):
   - Klik ikon `+` > pilih **Script** untuk membuat file `.gs`.
   - Klik ikon `+` > pilih **HTML** untuk membuat file `.html`.
3. Salin semua file dari repositori ini ke dalam editor Apps Script dengan nama file yang persis sama:
   - `BudgetCalculator.gs`
   - `CallbackHandler.gs`
   - `CommandHandler.gs`
   - `Config.gs` *(salin dari `Config.example.gs`)*
   - `Dashboard.gs`
   - `Dashboards.html`
   - `Database.gs`
   - `DateParser.gs`
   - `Main.gs`
   - `SyncHandler.gs`
   - `TelegramAPI.gs`
   - `TransactionHandler.gs`
   - `Utils.gs`

---

### Langkah 4: Simpan Kredensial Rahasia (Script Properties)
Aplikasi ini menggunakan **Script Properties** Google Apps Script agar token dan ID spreadsheet aman dan tidak terekspos di kode sumber.

1. Di editor Google Apps Script, klik ikon gerigi ⚙️ **Project Settings** di panel kiri.
2. Gulir ke bagian **Script Properties** (Properti Skrip) > klik **Add script property**.
3. Tambahkan properti berikut:

| Property (Nama) | Value (Nilai) | Keterangan |
|---|---|---|
| `BOT_TOKEN` | `123456789:ABC...` | Token bot dari BotFather |
| `SHEET_ID` | `1SfxaLqm...` | ID spreadsheet yang dibuat di Langkah 2 |
| `LARAVEL_URL` | *(Opsional)* `https://domain-anda.com/api/sync` | Endpoint backend sinkronisasi |
| `WEBHOOK_URL` | *(Akan diisi pada Langkah 5)* | URL Web App hasil deploy |

4. Klik **Save script properties**.

---

### Langkah 5: Deploy sebagai Web App
1. Di pojok kanan atas editor Apps Script, klik tombol **Deploy** > **New deployment**.
2. Klik ikon gerigi ⚙️ pada *Select type* > pilih **Web app**.
3. Isi konfigurasi deployment:
   - **Description**: `Produksi v1`
   - **Execute as**: `Me (email anda)`
   - **Who has access**: `Anyone` *(Wajib Anyone agar server Telegram bisa mengirim data webhook)*.
4. Klik **Deploy**.
5. Berikan otorisasi izin akun Google (*Review Permissions* > pilih akun Anda > *Advanced* > *Go to ... (unsafe)* > *Allow*).
6. Salin **Web App URL** yang dihasilkan (format: `https://script.google.com/macros/s/AKfycb.../exec`).
7. Buka kembali ⚙️ **Project Settings** > **Script Properties**, tambahkan/perbarui nilai `WEBHOOK_URL` dengan Web App URL tersebut.

---

### Langkah 6: Aktifkan Webhook Telegram
1. Buka file `Main.gs` di editor Apps Script.
2. Pada dropdown pilihan fungsi di toolbar atas editor, pilih fungsi `setWebhook`.
3. Klik tombol **Run** (Jalankan).
4. Periksa panel log di bawah. Jika berhasil, akan muncul output:
   ```json
   {"ok":true,"result":true,"description":"Webhook was set"}
   ```
5. Bot Anda sekarang **resmi aktif** dan siap menerima pesan dari Telegram!

---

## 📖 Panduan Penggunaan Bot

### 1. Format Cepat Input Transaksi
Cukup ketik langsung di chat tanpa awalan command:

| Format | Contoh Input | Penjelasan |
|---|---|---|
| Pengeluaran hari ini | `makan 25000` | Mencatat kategori `makan` sebesar Rp25.000 |
| Pengeluaran kemarin | `bensin 30000 kemarin` | Mencatat transaksi dengan tanggal kemarin |
| Pengeluaran tanggal tertentu | `belanja 150000 tgl 15` | Mencatat belanja pada tanggal 15 |
| Format tanggal lengkap | `servis 200000 12/10/2026` | Mencatat transaksi pada 12 Oktober 2026 |
| Pemasukan | `gaji 5000000` | Otomatis terdeteksi sebagai pemasukan |
| Pemasukan tambahan | `bonus jualan 350000` | Otomatis terdeteksi via kata kunci pemasukan |

*Kata kunci otomatis pemasukan:* `gaji`, `bonus`, `jualan`, `investasi`, `deposit`, `terima`, `masuk`, `hasil`, `profit`, `freelance`.

---

### 2. Daftar Perintah (Commands)

#### Informasi & Bantuan
- `/start` : Menampilkan sambutan dan cara pakai singkat.
- `/help` : Panduan lengkap format chat dan daftar perintah.

#### Rekap & Anggaran
- `/hariini` : Melihat rekap transaksi dan selisih hari ini.
- `/bulanini` : Ringkasan pemasukan, pengeluaran, saldo, dan top 5 pengeluaran bulan ini.
- `/rekapbulanan` : Membuka inline keyboard untuk memilih rekap bulan dan tahun mana pun.
- `/total` : Total kumulatif pemasukan, pengeluaran, dan saldo keseluruhan.
- `/atur [tgl_gajian] [batas_bawah] [batas_atas]` : Konfigurasi tanggal gajian dan batas ambang budget harian.
  - Contoh: `/atur 25 100000 300000`
  - *(Gajian tiap tanggal 25, status Kritis jika < Rp100.000/hari, status Aman jika > Rp300.000/hari)*.
- `/cekbudget` : Melihat sisa hari ke gajian, daily budget per hari, dan status indikator saat ini.

#### Manajemen Cicilan
- `/cicilan [nama] [total_hutang] [cicilan_per_bulan] [tgl_jatuh_tempo]` : Mendaftarkan cicilan baru.
  - Contoh: `/cicilan Kredit_Motor 12000000 1000000 15`
- `/bayarcicilan [nama_cicilan] [nominal]` : Membayar cicilan. Sisa hutang berkurang, dan otomatis tercatat sebagai transaksi pengeluaran.
  - Contoh: `/bayarcicilan Kredit_Motor 1000000`
- `/cekcicilan` : Melihat daftar cicilan aktif, persentase terbayar, dan sisa total hutang.

#### Sinkronisasi & Integrasi
- `/sync` : Mengirim seluruh transaksi pending ke backend API Laravel.

---

## 📊 Akses Web Dashboard
Untuk membuka visualisasi grafik keuangan:
1. Akses **Web App URL** yang Anda dapatkan saat langkah deploy (atau buka link yang didapat dari bot).
2. Dashboard menyediakan ringkasan Total Pemasukan, Total Pengeluaran, Sisa Saldo, filter per bulan/tahun/kategori, donat chart rasio, tren 6 bulan, dan grafik pie sebaran kategori.

---

## 🔒 Catatan Keamanan
- File `Config.gs` dan direktori `.agents/` sudah didaftarkan pada `.gitignore`.
- Jangan pernah mengunggah token bot atau ID Google Sheets ke repository publik. Selalu gunakan `Config.example.gs` untuk repository Git.
- Simpan seluruh rahasia sensitif pada **Script Properties** Google Apps Script.

---

## 📄 Lisensi
Didistribusikan di bawah lisensi MIT. Bebas digunakan, dimodifikasi, dan dikembangkan untuk keperluan pribadi maupun komunitas.
