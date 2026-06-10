# PRODUCT REQUIREMENT DOCUMENT (PRD)
## Sistem Informasi Iuran Kas & Makam Warga — SImas

---

| Atribut | Detail |
|---|---|
| **Nama Proyek** | Sistem Informasi Iuran Kas & Makam Warga (SImas) |
| **Versi Dokumen** | v1.1 — Baseline Siap Eksekusi + UI Specification |
| **Tech Stack** | ReactJS (Frontend), NodeJS & Express (Backend), Neon Postgres (Serverless Database) Schema Prisma|
| **Target Pengguna** | Pengurus Administrasi Warga (RT/RW/Pengelola Makam) & Warga (Penerima Laporan) |
| **Tanggal Revisi** | Juni 2026 |
| **Status** | Disetujui — Siap Pengembangan |

---

## Daftar Isi

1. [Pendahuluan & Latar Belakang](#1-pendahuluan--latar-belakang)
2. [Arsitektur Teknis & Pemilihan Tech Stack](#2-arsitektur-teknis--pemilihan-tech-stack)
3. [Tarif & Aturan Iuran](#3-tarif--aturan-iuran)
4. [Ruang Lingkup Fitur](#4-ruang-lingkup-fitur)
5. [Spesifikasi Fungsional](#5-spesifikasi-fungsional)
6. [Perancangan Skema Database](#6-perancangan-skema-database)
7. [Aturan Bisnis & Logika Finansial](#7-aturan-bisnis--logika-finansial)
8. [Spesifikasi UI & Desain Antarmuka](#8-spesifikasi-ui--desain-antarmuka)
9. [Spesifikasi Dokumen Output Laporan](#9-spesifikasi-dokumen-output-laporan)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Glosarium](#11-glosarium)

---

## 1. Pendahuluan & Latar Belakang

Pengelolaan kas warga seperti iuran bulanan dan pelunasan makam seringkali menghadapi kendala administrasi berupa hilangnya pencatatan manual, miskalkulasi data keuangan, serta kurangnya transparansi pelaporan terhadap warga.

**SImas** dikembangkan untuk mendigitalisasi proses pencatatan iuran tersebut, berfokus pada:

- **Kemudahan pengisian data massal** lewat import file Excel.
- **Keterbukaan informasi publik** melalui fitur export report siap dibagikan kepada warga dalam format spreadsheet (`.xlsx`).
- **Transparansi real-time** melalui dashboard yang dapat diakses pengurus kapan saja.
- **Kalkulasi otomatis** tagihan berdasarkan jumlah jiwa per KK, mengurangi risiko kesalahan hitung manual.

### Masalah yang Diselesaikan

| Masalah Lama | Solusi SImas |
|---|---|
| Pencatatan manual di buku/kertas rentan hilang | Data tersimpan di database Neon Postgres yang persisten |
| Miskalkulasi iuran per jiwa | Kalkulasi otomatis berbasis `jumlah_jiwa × tarif` |
| Tidak ada transparansi ke warga | Export laporan `.xlsx` siap dibagikan via WhatsApp |
| Sulit lacak riwayat cicilan makam | Tabel `iuran_makam` dengan tracking `total_terbayar` dan sisa piutang |

---

## 2. Arsitektur Teknis & Pemilihan Tech Stack

Sistem mengimplementasikan arsitektur pengembang modern dengan pemisahan tanggung jawab yang jelas:

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                       │
│              ReactJS SPA (Single Page App)              │
│   Dashboard · Form Input · Import/Export · Grafik       │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API (JSON)
┌──────────────────────▼──────────────────────────────────┐
│                      API LAYER                          │
│               NodeJS + Express Server                   │
│   Auth (JWT) · Parsing Excel · Kalkulasi Finansial      │
└──────────────────────┬──────────────────────────────────┘
                       │ SQL (pg / Drizzle ORM)
┌──────────────────────▼──────────────────────────────────┐
│                   DATABASE LAYER                        │
│            Neon Postgres (Serverless)                   │
│    warga · iuran_bulanan · iuran_makam · users          │
└─────────────────────────────────────────────────────────┘
```

### Justifikasi Pemilihan Teknologi

**Frontend — ReactJS**
Digunakan untuk membangun Single Page Application (SPA) yang responsif dan interaktif. React dipilih agar transisi halaman dashboard, grafik visualisasi, dan modal import terasa instan tanpa reload halaman penuh. Library pendukung: `recharts` atau `Chart.js` untuk visualisasi, `xlsx` atau `exceljs` untuk parsing Excel di sisi klien.

**Backend — NodeJS + Express**
Menyediakan RESTful API berkinerja tinggi. Menangani beban komputasi ketika melakukan parsing file Excel berukuran besar serta menangani kalkulasi saldo keuangan secara dinamis. Middleware utama: `multer` (upload file), `jsonwebtoken` (autentikasi), `exceljs` (generate laporan).

**Database — Neon Postgres**
Database relasional Postgres yang dihosting secara serverless di Neon. Memastikan integritas data keuangan terjaga (ACID compliant), relasi tabel yang kuat, serta fitur pemisahan branch database (data branching) untuk mempermudah development tanpa merusak data produksi.

---

## 3. Tarif & Aturan Iuran

> Seluruh kalkulasi tagihan di sistem **wajib mengacu pada tabel tarif berikut**. Tarif bersifat konfigurabel oleh admin melalui tabel `settings` di database.

### 3.1. Tabel Tarif Resmi

| Jenis Iuran | Satuan Hitung | Tarif per Satuan | Keterangan |
|---|---|---|---|
| Iuran Bulanan | Per KK / per bulan | **Rp 10.000** | Flat, tidak bergantung jumlah jiwa |
| Iuran Pelunasan Makam | Per jiwa dalam KK | **Rp 10.000** | Total tagihan = `jumlah_jiwa × Rp 10.000` |

### 3.2. Contoh Kalkulasi Otomatis

| Nama KK | Jumlah Jiwa | Iuran Bulanan | Total Tagihan Makam | Keterangan |
|---|---|---|---|---|
| Budi Santoso | 4 jiwa | Rp 10.000 | Rp 40.000 | 4 × Rp 10.000 |
| Siti Rahayu | 3 jiwa | Rp 10.000 | Rp 30.000 | 3 × Rp 10.000 |
| Ahmad Fauzi | 5 jiwa | Rp 10.000 | Rp 50.000 | 5 × Rp 10.000 |
| Dewi P. | 2 jiwa | Rp 10.000 | Rp 20.000 | 2 × Rp 10.000 |

### 3.3. Logika Kalkulasi Backend

```
// Iuran Bulanan: flat per KK
tagihan_bulanan = TARIF_BULANAN  -- Rp 10.000

// Iuran Makam: berbasis jiwa
total_tagihan_makam = jumlah_jiwa × TARIF_MAKAM_PER_JIWA  -- jumlah_jiwa × Rp 10.000

// Sisa piutang makam
sisa_piutang = total_tagihan_makam - total_terbayar

// Status otomatis
IF total_terbayar >= total_tagihan_makam THEN status = 'Lunas'
ELSE IF total_terbayar > 0               THEN status = 'Mencicil'
ELSE                                          status = 'Belum Bayar'
```

---

## 4. Ruang Lingkup Fitur

### 4.1. Fitur Utama Manajemen Warga — Import Excel

Sistem wajib mendukung import database warga secara massal dari file Excel dengan skema kolom yang telah ditentukan secara kaku:

**Format Kolom Excel Wajib:**

```
| NO KARTU | NAMA KEPALA KELUARGA | JUMLAH JIWA |
```

**Aturan Import:**
- Kolom `NO KARTU` bertindak sebagai ID unik warga; sistem melakukan pengecekan duplikasi.
- Jika ada kecocokan data lama dengan file baru, sistem menampilkan opsi:
  - **Overwrite** — Perbarui `jumlah_jiwa` dengan data baru.
  - **Skip** — Abaikan baris tersebut, pertahankan data lama.
- Sistem menolak baris dengan `JUMLAH JIWA ≤ 0`.
- Setelah import berhasil, sistem **otomatis menghitung ulang** `total_tagihan` di tabel `iuran_makam` berdasarkan `jumlah_jiwa` terbaru.

### 4.2. Manajemen Iuran Bulanan

- Input tagihan rutin berdasarkan parameter bulan dan tahun berjalan.
- Status otomatis berubah menjadi `Lunas` jika nominal bayar = `Rp 10.000`.
- Sistem dapat menampilkan grid bulan (Januari–Desember) per warga untuk melihat histori pembayaran tahunan secara visual.

### 4.3. Manajemen Pelunasan Makam

- Input cicilan atau pelunasan sekaligus (lump-sum) per KK.
- Sistem melacak `total_terbayar` dan menghitung `sisa_piutang` secara real-time.
- `total_tagihan` ditetapkan saat pertama kali data warga dibuat berdasarkan `jumlah_jiwa × Rp 10.000`.
- Jika `jumlah_jiwa` diperbarui via import Excel, `total_tagihan` diperbarui dan sistem mencatat selisihnya.

### 4.4. Dashboard Analisis Keuangan

- **Widget Metrik Utama:** Total kas terkumpul, kas iuran bulanan, kas makam, total tunggakan.
- **Grafik Kolektibilitas:** Line chart persentase kolektibilitas penagihan per bulan (Iuran Bulanan vs Makam).
- **Ringkasan Status:** Kartu ringkasan jumlah KK Lunas / Mencicil / Menunggak beserta nominal.
- **Feed Aktivitas:** Riwayat transaksi terbaru secara kronologis.

### 4.5. Fitur Export Laporan Keuangan (Excel)

Modul krusial untuk mengekspor rekap hasil penagihan menjadi file Excel siap cetak/share ke grup WhatsApp warga atau dicetak saat rapat RT/RW. Spesifikasi detail di Bagian 9.

---

## 5. Spesifikasi Fungsional

| ID Fitur | Modul | Deskripsi Kebutuhan Sistem | Prioritas |
|---|---|---|---|
| FR-01 | Autentikasi Pengurus | Halaman login untuk pengurus RT/RW menggunakan JWT (JSON Web Token) via NodeJS. Semua API endpoint dilindungi middleware autentikasi. | HIGH |
| FR-02 | Import Excel Warga | Frontend menyediakan drag-and-drop file uploader. Backend memproses file menggunakan library `xlsx` atau `exceljs`, melakukan validasi tipe data `JUMLAH JIWA` (harus bilangan bulat positif), menangani duplikasi, dan menyimpan ke Neon Postgres. Setelah import, `total_tagihan` makam dihitung ulang otomatis. | HIGH |
| FR-03 | Entri Transaksi Penagihan | Form input pembayaran iuran bulanan dan cicilan makam dengan validasi nominal tidak boleh negatif atau nol. Status otomatis berubah menjadi `Lunas` jika total pembayaran terpenuhi. | HIGH |
| FR-04 | Dashboard Grafik | Visualisasi line chart kolektibilitas bulanan dan ringkasan status bayar warga. Menggunakan `Chart.js` atau `Recharts`. Data di-fetch dari API secara real-time. | MEDIUM |
| FR-05 | Export Laporan Bulanan | Pengurus dapat mengunduh file Excel (`.xlsx`) berisi rekap data warga, total tagihan bulanan, total terbayar, dan sisa tunggakan. Layout wajib: judul laporan, header tebal, border rapi, kolom Total dengan formula `=SUM(...)`. | HIGH |
| FR-06 | Kalkulasi Tarif Otomatis | Saat warga baru ditambahkan atau `jumlah_jiwa` diperbarui, sistem otomatis menghitung dan menyimpan `total_tagihan_makam = jumlah_jiwa × 10000` ke tabel `iuran_makam`. | HIGH |
| FR-07 | Manajemen Warga | CRUD data warga secara manual (tambah, edit, hapus) selain via import Excel. Penghapusan warga menggunakan soft-delete atau CASCADE sesuai konfigurasi FK. | MEDIUM |
| FR-08 | Feed Aktivitas | Panel aktivitas terbaru menampilkan transaksi masuk, import berhasil, dan perubahan status secara kronologis. | LOW |

---

## 6. Perancangan Skema Database

Skema database dirancang ternormalisasi demi menjamin konsistensi data finansial warga.

### Tabel 1: `warga`

| Nama Kolom | Tipe Data | Atribut | Keterangan |
|---|---|---|---|
| `id` | `SERIAL` | Primary Key | ID internal auto-increment |
| `no_kartu` | `VARCHAR(50)` | UNIQUE, NOT NULL, INDEX | ID unik warga sesuai format Excel |
| `nama_kk` | `VARCHAR(255)` | NOT NULL | Nama Kepala Keluarga |
| `jumlah_jiwa` | `INTEGER` | NOT NULL, CHECK > 0, DEFAULT 1 | Jumlah jiwa dalam KK; penentu tarif makam |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Waktu data dibuat |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Waktu data terakhir diubah |

### Tabel 2: `iuran_bulanan`

| Nama Kolom | Tipe Data | Atribut | Keterangan |
|---|---|---|---|
| `id` | `SERIAL` | Primary Key | |
| `warga_id` | `INTEGER` | FK → `warga(id)` ON DELETE CASCADE | Relasi ke warga |
| `bulan` | `SMALLINT` | CHECK (1–12) | Bulan pembayaran (1=Januari) |
| `tahun` | `INTEGER` | NOT NULL | Contoh: 2026 |
| `jumlah_bayar` | `NUMERIC(12,2)` | NOT NULL, CHECK > 0 | Nominal yang dibayarkan (Rp 10.000) |
| `tanggal_bayar` | `DATE` | NOT NULL | Tanggal uang diterima |
| `status` | `VARCHAR(20)` | CHECK IN ('Lunas','Belum Lunas') | Auto-set oleh backend |
| `dicatat_oleh` | `INTEGER` | FK → `users(id)` | Pengurus yang mencatat |

> **Unique Constraint:** `(warga_id, bulan, tahun)` — mencegah duplikasi pencatatan per bulan per KK.

### Tabel 3: `iuran_makam`

| Nama Kolom | Tipe Data | Atribut | Keterangan |
|---|---|---|---|
| `id` | `SERIAL` | Primary Key | |
| `warga_id` | `INTEGER` | FK → `warga(id)` ON DELETE CASCADE, UNIQUE | Satu record per KK |
| `total_tagihan` | `NUMERIC(12,2)` | NOT NULL | `jumlah_jiwa × 10000`, dihitung otomatis |
| `total_terbayar` | `NUMERIC(12,2)` | NOT NULL, DEFAULT 0 | Akumulasi cicilan masuk |
| `status` | `VARCHAR(20)` | CHECK IN ('Lunas','Mencicil','Belum Bayar') | Auto-update oleh backend |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | |

### Tabel 4: `cicilan_makam` *(Tabel Riwayat)*

| Nama Kolom | Tipe Data | Atribut | Keterangan |
|---|---|---|---|
| `id` | `SERIAL` | Primary Key | |
| `iuran_makam_id` | `INTEGER` | FK → `iuran_makam(id)` ON DELETE CASCADE | |
| `jumlah_bayar` | `NUMERIC(12,2)` | NOT NULL, CHECK > 0 | Nominal cicilan sekali bayar |
| `tanggal_bayar` | `DATE` | NOT NULL | |
| `dicatat_oleh` | `INTEGER` | FK → `users(id)` | |

### Tabel 5: `users`

| Nama Kolom | Tipe Data | Atribut | Keterangan |
|---|---|---|---|
| `id` | `SERIAL` | Primary Key | |
| `username` | `VARCHAR(100)` | UNIQUE, NOT NULL | |
| `password_hash` | `TEXT` | NOT NULL | bcrypt hash |
| `nama_lengkap` | `VARCHAR(255)` | NOT NULL | |
| `role` | `VARCHAR(20)` | CHECK IN ('admin','pengurus') | |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | |

### Tabel 6: `settings`

| Nama Kolom | Tipe Data | Keterangan |
|---|---|---|
| `key` | `VARCHAR(100)` PRIMARY KEY | Contoh: `tarif_bulanan`, `tarif_makam_per_jiwa` |
| `value` | `TEXT` NOT NULL | Contoh: `10000` |
| `updated_at` | `TIMESTAMP` | |

### Entity Relationship Diagram (Ringkas)

```
users ──────────────────────────────────────────────────────┐
                                                            │ dicatat_oleh
warga (1) ──── (N) iuran_bulanan                           │
warga (1) ──── (1) iuran_makam ──── (N) cicilan_makam ─────┘
```

---

## 7. Aturan Bisnis & Logika Finansial

Aturan berikut **wajib diimplementasikan di layer Backend NodeJS** untuk mencegah manipulasi atau kesalahan input:

### 7.1. Validasi Input

| Aturan | Implementasi |
|---|---|
| `JUMLAH JIWA` tidak boleh ≤ 0 | Validasi saat import Excel dan form manual; return HTTP 422 jika dilanggar |
| Nominal bayar tidak boleh ≤ 0 | Validasi pada semua endpoint POST transaksi |
| `total_terbayar` tidak boleh melebihi `total_tagihan` | Backend menolak pembayaran berlebih; return HTTP 400 |
| `bulan` harus 1–12, `tahun` harus 4 digit | Validasi tipe data di level schema (Joi/Zod) |

### 7.2. Kalkulasi Otomatis

```
// Saat warga baru dibuat atau jumlah_jiwa diperbarui:
total_tagihan_makam = warga.jumlah_jiwa × settings['tarif_makam_per_jiwa']
// → INSERT atau UPDATE ke tabel iuran_makam

// Saat cicilan makam dicatat:
iuran_makam.total_terbayar += cicilan.jumlah_bayar
iuran_makam.sisa_piutang   = iuran_makam.total_tagihan - iuran_makam.total_terbayar

// Auto-update status:
IF total_terbayar >= total_tagihan  → status = 'Lunas'
ELSE IF total_terbayar > 0          → status = 'Mencicil'
ELSE                                → status = 'Belum Bayar'

// Iuran bulanan — auto-set status:
IF jumlah_bayar >= settings['tarif_bulanan']  → status = 'Lunas'
ELSE                                           → status = 'Belum Lunas'
```

### 7.3. Penanganan Import Duplikasi

```
FOR EACH baris IN excel_file:
  existing = SELECT * FROM warga WHERE no_kartu = baris.no_kartu
  
  IF existing IS NULL:
    INSERT INTO warga (no_kartu, nama_kk, jumlah_jiwa)
    INSERT INTO iuran_makam (warga_id, total_tagihan = jiwa × tarif)
    
  ELSE IF mode == 'overwrite':
    UPDATE warga SET jumlah_jiwa = baris.jumlah_jiwa, nama_kk = baris.nama_kk
    UPDATE iuran_makam SET total_tagihan = jiwa_baru × tarif
    // Jika tagihan berubah dan total_terbayar > tagihan_baru → flag manual review
    
  ELSE IF mode == 'skip':
    CONTINUE  // Abaikan baris ini
```

---

## 8. Spesifikasi UI & Desain Antarmuka

### 8.1. Identitas Visual

| Token | Nilai | Penggunaan |
|---|---|---|
| **Primary** | `#0F6E56` | Tombol utama, nav aktif, status Lunas, grafik |
| **Primary Light** | `#E1F5EE` | Background badge Lunas, nav aktif, highlight |
| **Warning** | `#BA7517` | Status Mencicil, grafik makam |
| **Warning Light** | `#FAEEDA` | Background badge Mencicil |
| **Danger** | `#A32D2D` | Status Menunggak, metrik tunggakan |
| **Danger Light** | `#FCEBEB` | Background badge Menunggak |
| **Neutral** | `var(--color-text-secondary)` | Label, teks pendukung |
| **Font Mono** | `var(--font-mono)` | Nomor kartu, kode referensi |

### 8.2. Struktur Layout

```
┌─────────────────────────── TOPBAR (56px) ──────────────────────────────┐
│  [Brand Icon] SImas                [Periode] [Export] [Import] [+Bayar]│
└────────────────────────────────────────────────────────────────────────┘
┌────────────┬───────────────────────────────────────────────────────────┐
│            │  PAGE HEADER                                               │
│  SIDEBAR   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  (200px)   │  │ Kas Total│ │ Bulanan  │ │  Makam   │ │ Tunggakan│    │
│            │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│  Dashboard │                                                            │
│  Data Warga│  ┌─────────────────────────┐ ┌──────────────────────┐    │
│            │  │   GRAFIK KOLEKTIBILITAS  │ │  STATUS PEMBAYARAN   │    │
│  Iuran Bln │  │   (line chart 2 series) │ │  87 KK Lunas         │    │
│  Iur. Makam│  └─────────────────────────┘ │  17 KK Mencicil      │    │
│            │                               │  23 KK Menunggak     │    │
│  Analisis  │                               └──────────────────────┘    │
│  Export    │  ┌─────────────────────────┐ ┌──────────────────────┐    │
│            │  │   TABEL WARGA + STATUS  │ │  IMPORT EXCEL        │    │
│  Pengaturan│  │   (tab: Bln | Makam)    │ │  AKTIVITAS TERBARU   │    │
│            │  └─────────────────────────┘ └──────────────────────┘    │
└────────────┴───────────────────────────────────────────────────────────┘
```

### 8.3. Komponen UI Utama

#### Topbar
- Tinggi tetap 56px, background `--color-background-primary`, border bawah 0.5px.
- Brand icon: kotak hijau 32px dengan icon `building-community`.
- Kanan: badge periode aktif, tombol Export, tombol Import, tombol primer "+ Catat Bayar".

#### Sidebar Navigasi
Lebar 200px. Grup menu:
- **Utama:** Dashboard, Data Warga (dengan badge jumlah KK)
- **Penagihan:** Iuran Bulanan, Iuran Makam
- **Laporan:** Analisis, Export Laporan
- **Sistem:** Pengaturan

Item aktif: background `#E1F5EE`, teks `#0F6E56`, font-weight 500.

#### Metric Cards (4 kolom)
Grid 4 kolom, background `--color-background-primary`, border 0.5px, radius-lg. Setiap card: label 11px + ikon di atas, nilai 20px font-weight 500 di bawah, delta/subinfo 11px di bawahnya.

#### Tabel Warga
Header: background `--color-background-secondary`, font 11px uppercase, letter-spacing 0.04em. Baris: border-bottom 0.5px, hover background secondary. Kolom status menggunakan pill berwarna (lihat 8.4).

#### Status Pills

| Status | Background | Warna Teks | Ikon |
|---|---|---|---|
| Lunas | `#E1F5EE` | `#085041` | `ti-check` |
| Mencicil | `#FAEEDA` | `#633806` | `ti-dots` |
| Menunggak | `#FCEBEB` | `#791F1F` | `ti-x` |
| Belum Bayar | `#FCEBEB` | `#791F1F` | `ti-x` |

#### Zona Import Excel
Border dashed 1.5px, border-radius-lg. Hover: border berubah ke `#0F6E56` + background `#E1F5EE` 13% opacity. Di dalam: ikon spreadsheet, judul, hint teks, dan chip kolom (`NO KARTU`, `NAMA KK`, `JUMLAH JIWA`) dalam font mono.

#### Grafik Kolektibilitas
Line chart 2 series: Iuran Bulanan (garis solid `#0F6E56`) dan Iuran Makam (garis putus `#BA7517`). Sumbu Y: 40%–100%, label `%`. Legend kustom HTML, bukan Chart.js default.

### 8.4. Halaman: Entri Transaksi (Modal/Form)

Field wajib untuk iuran bulanan:
- Warga (autocomplete by no_kartu/nama)
- Bulan & Tahun
- Jumlah Bayar (pre-fill Rp 10.000)
- Tanggal Bayar

Field wajib untuk cicilan makam:
- Warga
- Jumlah Bayar (min Rp 1.000, max = sisa piutang)
- Tanggal Bayar
- Tampilkan sisa piutang real-time saat warga dipilih

### 8.5. Halaman: Data Warga

Tabel lengkap dengan fitur:
- Search by nama/no_kartu
- Filter status (Lunas / Mencicil / Menunggak)
- Kolom: No Kartu, Nama KK, Jumlah Jiwa, Tarif Makam (computed), Status Makam, Progres bar
- Grid bulan (Jan–Des) per baris untuk visualisasi histori iuran bulanan tahunan

---

## 9. Spesifikasi Dokumen Output Laporan (Excel Export)

File Excel yang diunduh oleh pengurus wajib memenuhi ketentuan struktural berikut agar mudah dibaca di smartphone maupun saat dicetak:

### Sheet 1: Rekap Iuran Bulanan

| Kolom | Keterangan |
|---|---|
| No Kartu | Kode unik warga |
| Nama KK | Nama Kepala Keluarga |
| Jan – Des | Status per bulan: `✓ Lunas` / `-` (12 kolom) |
| Total Bayar | Total nominal terbayar sepanjang tahun |

- **Baris terakhir:** Total akumulasi kas bulanan menggunakan formula `=SUM(...)`, bukan angka statis.
- **Format header:** Background hijau teal, font putih, bold.
- **Format Lunas:** Cell hijau muda, teks gelap.
- **Format kosong/belum bayar:** Cell abu-abu muda.

### Sheet 2: Pelunasan Makam Warga

| Kolom | Keterangan |
|---|---|
| No Kartu | Kode unik warga |
| Nama KK | Nama Kepala Keluarga |
| Jumlah Jiwa | Jumlah anggota KK |
| Target Iuran Makam | `jumlah_jiwa × Rp 10.000` |
| Sudah Dibayar | Akumulasi cicilan masuk |
| Sisa Piutang | `=D{n}-E{n}` — formula Excel |
| Status | Lunas / Mencicil / Belum Bayar |

- **Baris terakhir:** `=SUM(D2:D{n})` untuk total target, `=SUM(E2:E{n})` untuk total terbayar.
- Formula Excel (bukan nilai statis dari backend) menjamin akurasi jika file diedit kembali.

### Aturan Formatting Excel

- Semua border: thin border semua sisi.
- Kolom nominal: format currency `Rp #,##0` (tanpa desimal).
- Header row: freeze pane (header tetap terlihat saat scroll).
- Lebar kolom: auto-fit content, minimum 80px untuk kolom bulan.
- Judul laporan di baris 1: merge cell, font 14px bold.
- Info periode di baris 2: "Laporan Iuran RT 05 / RW 03 — Periode: [Bulan] [Tahun]".

---

## 10. Non-Functional Requirements

| ID | Kategori | Kebutuhan |
|---|---|---|
| NFR-01 | Keamanan | Semua API endpoint (kecuali `/auth/login`) wajib menggunakan Bearer JWT. Token expire 8 jam. |
| NFR-02 | Keamanan | Password pengurus di-hash menggunakan bcrypt (min rounds: 12). |
| NFR-03 | Performa | Response API rata-rata < 500ms untuk query standar (tanpa export). |
| NFR-04 | Performa | Import Excel hingga 500 baris harus selesai < 5 detik. |
| NFR-05 | Reliabilitas | Database Neon Postgres: ACID compliance, auto-backup harian. |
| NFR-06 | Kompatibilitas | Export Excel kompatibel dengan Microsoft Excel 2016+, LibreOffice, dan Google Sheets. |
| NFR-07 | Responsivitas | Dashboard dapat diakses via mobile browser (min lebar 375px). |
| NFR-08 | Audit | Setiap transaksi finansial menyimpan `dicatat_oleh` (user ID pengurus) untuk audit trail. |
| NFR-09 | Integritas | Constraint database (FK, CHECK, UNIQUE) menjadi lapis pertahanan terakhir selain validasi backend. |

---

## 11. Glosarium

| Istilah | Definisi |
|---|---|
| **KK** | Kartu Keluarga; unit keluarga yang menjadi subjek iuran |
| **No Kartu** | Nomor identifikasi unik warga dalam sistem RT/RW; bersumber dari data Excel |
| **Jiwa** | Anggota keluarga dalam satu KK; menjadi penentu besaran iuran makam |
| **Iuran Bulanan** | Iuran rutin per KK sebesar Rp 10.000 per bulan, tidak bergantung jumlah jiwa |
| **Iuran Makam** | Iuran wajib untuk pemeliharaan makam, dihitung Rp 10.000 per jiwa, dapat dicicil |
| **Kolektibilitas** | Persentase KK yang telah membayar dari total KK terdaftar dalam satu periode |
| **Sisa Piutang** | Sisa tagihan makam yang belum terbayar: `total_tagihan - total_terbayar` |
| **Lump-sum** | Pembayaran sekaligus penuh untuk melunasi seluruh tagihan makam |
| **Import Overwrite** | Mode import Excel yang memperbarui data warga yang sudah ada jika `no_kartu` cocok |
| **Import Skip** | Mode import Excel yang mengabaikan baris baru jika `no_kartu` sudah terdaftar |
| **JWT** | JSON Web Token; metode autentikasi stateless untuk API |
| **ACID** | Atomicity, Consistency, Isolation, Durability; standar integritas database relasional |
| **SPA** | Single Page Application; aplikasi web yang tidak reload saat berpindah halaman |

---

*Dokumen ini merupakan gabungan dari PRD baseline v1.0 dan spesifikasi UI/tarif yang disempurnakan. Segala perubahan pada tarif atau aturan bisnis wajib diperbarui secara bersamaan di Bagian 3 dan Bagian 7 dokumen ini, serta di tabel `settings` pada database produksi.*

---

**SImas** — Sistem Informasi Iuran Kas & Makam Warga  
Dikembangkan untuk RT/RW · Transparansi Keuangan Komunitas