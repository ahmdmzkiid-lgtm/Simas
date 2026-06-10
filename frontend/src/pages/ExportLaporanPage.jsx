import { useState } from 'react';
import { IconDownload, IconFileSpreadsheet } from '../components/common/Icons';
import api, { API_BASE } from '../api/client';

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function ExportLaporanPage() {
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [loadingBulanan, setLoadingBulanan] = useState(false);
  const [loadingMakam, setLoadingMakam] = useState(false);
  const [tahunGabungan, setTahunGabungan] = useState(new Date().getFullYear());
  const [bulanGabungan, setBulanGabungan] = useState('');
  const [loadingGabungan, setLoadingGabungan] = useState(false);
  const [detailBulan, setDetailBulan] = useState('');
  const [detailTahun, setDetailTahun] = useState(new Date().getFullYear());
  const [loadingDetail, setLoadingDetail] = useState(false);

  const downloadFile = async (url, filename) => {
    const token = localStorage.getItem('simas_token');
    const res = await fetch(`${API_BASE}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Gagal mengunduh');
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportBulanan = async () => {
    setLoadingBulanan(true);
    try {
      await downloadFile(`/export/iuran-bulanan/${tahun}`, `rekap-iuran-bulanan-${tahun}.xlsx`);
    } catch (e) {
      alert('Gagal mengexport laporan bulanan');
    } finally {
      setLoadingBulanan(false);
    }
  };

  const exportMakam = async () => {
    setLoadingMakam(true);
    try {
      await downloadFile('/export/iuran-makam', 'rekap-pelunasan-makam.xlsx');
    } catch (e) {
      alert('Gagal mengexport laporan makam');
    } finally {
      setLoadingMakam(false);
    }
  };

  const exportDetail = async () => {
    setLoadingDetail(true);
    try {
      const params = new URLSearchParams({ tahun: detailTahun });
      if (detailBulan) params.set('bulan', detailBulan);
      await downloadFile(`/export/detail-pembayaran?${params.toString()}`, `detail-pembayaran-${detailBulan ? detailBulan + '-' : ''}${detailTahun}.xlsx`);
    } catch (e) {
      alert('Gagal mengexport detail pembayaran');
    } finally {
      setLoadingDetail(false);
    }
  };

  const exportGabungan = async () => {
    setLoadingGabungan(true);
    try {
      const params = new URLSearchParams();
      if (bulanGabungan) params.set('bulan', bulanGabungan);
      const qs = params.toString();
      await downloadFile(`/export/rekap-gabungan/${tahunGabungan}${qs ? '?' + qs : ''}`, `rekap-gabungan-${tahunGabungan}.xlsx`);
    } catch (e) {
      alert('Gagal mengexport rekap gabungan');
    } finally {
      setLoadingGabungan(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Export Laporan</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, maxWidth: 700 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <IconFileSpreadsheet size={28} style={{ color: 'var(--color-primary)' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Rekap Iuran Bulanan</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                Laporan status pembayaran per bulan sepanjang tahun
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select className="input" style={{ maxWidth: 100 }} value={tahun} onChange={e => setTahun(parseInt(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="btn btn-primary" onClick={exportBulanan} disabled={loadingBulanan}>
              <IconDownload size={14} />
              {loadingBulanan ? 'Mengunduh...' : 'Download'}
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            Format: Excel (.xlsx) &middot; Header hijau &middot; Freeze pane &middot; Formula SUM
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <IconFileSpreadsheet size={28} style={{ color: 'var(--color-warning)' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Pembayaran Iuran Perluasan Makam</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                Laporan tagihan dan pembayaran iuran perluasan makam per warga
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={exportMakam} disabled={loadingMakam}>
            <IconDownload size={14} />
            {loadingMakam ? 'Mengunduh...' : 'Download'}
          </button>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            Format: Excel (.xlsx) &middot; Per Bulan × Total 36 bln &middot; Total Terbayar
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <IconFileSpreadsheet size={28} style={{ color: 'var(--color-primary)' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Rekap Gabungan Iuran</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                Gabungan iuran bulanan & iuran makam per warga per tahun
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select className="input" style={{ maxWidth: 130 }} value={bulanGabungan} onChange={e => setBulanGabungan(e.target.value)}>
              <option value="">Semua Bulan</option>
              {BULAN.map((b, i) => <option key={i} value={i + 1}>{b}</option>)}
            </select>
            <select className="input" style={{ maxWidth: 100 }} value={tahunGabungan} onChange={e => setTahunGabungan(parseInt(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="btn btn-primary" onClick={exportGabungan} disabled={loadingGabungan}>
              <IconDownload size={14} />
              {loadingGabungan ? 'Mengunduh...' : 'Download'}
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            Format: Excel (.xlsx) &middot; 1 baris/transaksi &middot; Bulanan & Makam digabung
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <IconFileSpreadsheet size={28} style={{ color: 'var(--color-primary)' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Rekap Bulanan Perluasan Makam</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                transaksi pembayaran iuran perluasan makam per bulan, bisa difilter per bulan/tahun
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select className="input" style={{ maxWidth: 130 }} value={detailBulan} onChange={e => setDetailBulan(e.target.value)}>
              <option value="">Semua Bulan</option>
              {BULAN.map((b, i) => <option key={i} value={i + 1}>{b}</option>)}
            </select>
            <select className="input" style={{ maxWidth: 100 }} value={detailTahun} onChange={e => setDetailTahun(parseInt(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="btn btn-primary" onClick={exportDetail} disabled={loadingDetail}>
              <IconDownload size={14} />
              {loadingDetail ? 'Mengunduh...' : 'Download'}
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            Format: Excel (.xlsx) &middot; 1 baris/transaksi &middot; Bulan digabung
          </div>
        </div>
      </div>
    </div>
  );
}
