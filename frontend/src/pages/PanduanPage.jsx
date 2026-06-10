import { IconFileSpreadsheet as IconBook, IconUsers, IconCalendar, IconBone, IconDownload, IconActivity, IconSettings, IconDashboard, IconPlus } from '../components/common/Icons';

const sections = [
  {
    icon: IconDashboard,
    title: 'Dashboard (Halaman Utama)',
    steps: [
      'Setelah login, Anda akan masuk ke halaman Dashboard.',
      'Di sini Anda bisa melihat ringkasan: total warga, yang sudah bayar, dan yang belum bayar.',
      'Juga ada grafik dan aktivitas terbaru pembayaran.',
    ],
  },
  {
    icon: IconUsers,
    title: 'Data Warga',
    steps: [
      'Klik menu "Data Warga" untuk melihat daftar seluruh warga.',
      'Tombol "+ Tambah Warga" untuk menambah warga baru.',
      'Kotak pencarian untuk mencari warga berdasarkan No Kartu atau Nama.',
      'Tombol "Template" untuk download format Excel, lalu "Import" untuk memasukkan data warga dari Excel.',
    ],
  },
  {
    icon: IconCalendar,
    title: 'Iuran Bulanan',
    steps: [
      'Klik menu "Iuran Bulanan" untuk melihat iuran bulanan per warga.',
      'Tabel menampilkan status pembayaran per bulan (Januari-Desember).',
      'Klik tombol "Bayar" pada warga yang ingin dibayar iurannya.',
      'Pilih Dari Bulan sampai Bulan (misal Januari-Maret), lalu klik Simpan.',
      'Warga yang sudah lunas akan muncul dengan latar hijau.',
    ],
  },
  {
    icon: IconBone,
    title: 'Iuran Makam (Perluasan Makam)',
    steps: [
      'Klik menu "Iuran Makam" untuk melihat tagihan iuran makam per warga.',
      'Total tagihan maksimal 36 bulan. Warga bisa mencicil.',
      'Klik "Bayar" untuk membayar, pilih bulan, dan masukkan jumlah bayar.',
      'Kolom "Total Terbayar" menunjukkan berapa yang sudah dibayar.',
    ],
  },
  {
    icon: IconDownload,
    title: 'Export Laporan',
    steps: [
      'Klik menu "Export Laporan" untuk mendownload laporan ke Excel.',
      'Pilih laporan yang diinginkan: Iuran Bulanan, Iuran Makam, Gabungan, atau Detail Makam.',
      'Atur bulan/tahun jika diperlukan, lalu klik "Download".',
      'File Excel akan terdownload otomatis.',
    ],
  },
  {
    icon: IconActivity,
    title: 'Riwayat Pembayaran',
    steps: [
      'Klik menu "Riwayat Pembayaran" untuk melihat semua transaksi.',
      'Bisa dicari berdasarkan No Kartu atau Nama.',
      'Filter berdasarkan jenis (Bulanan/Makam), bulan, atau tahun.',
      'Tombol "Hapus" untuk menghapus transaksi jika ada kesalahan.',
    ],
  },
  {
    icon: IconSettings,
    title: 'Pengaturan',
    steps: [
      'Klik menu "Pengaturan" untuk mengatur aplikasi.',
      'Di sini Anda bisa mengganti password atau mengatur profile.',
    ],
  },
  {
    icon: IconPlus,
    title: 'Catat Pembayaran Cepat',
    steps: [
      'Tombol "Catat Bayar" di pojok kanan atas (atau tombol + di kanan bawah jika di HP).',
      'Cari nama warga, pilih jenis iuran (Bulanan atau Makam).',
      'Isi bulan, jumlah bayar, tanggal bayar, lalu klik Simpan.',
    ],
  },
];

export default function PanduanPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title" style={{ fontSize: 24 }}>Panduan Penggunaan Aplikasi SImas</h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
          Berikut panduan singkat untuk menggunakan aplikasi SImas
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sections.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-primary)', flexShrink: 0,
                }}>
                  <Icon size={20} />
                </div>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.title}</span>
              </div>
              <ol style={{ margin: 0, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {s.steps.map((step, i) => (
                  <li key={i} style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 16, padding: '16px 20px', backgroundColor: 'var(--color-primary-light)' }}>
        <p style={{ fontSize: 14, color: 'var(--color-primary-dark)', lineHeight: 1.6 }}>
          <strong>Tips:</strong> Jika ada kendala, coba refresh halaman atau logout lalu login kembali.
          Untuk pertanyaan lebih lanjut, hubungi pengurus.
        </p>
      </div>
    </div>
  );
}