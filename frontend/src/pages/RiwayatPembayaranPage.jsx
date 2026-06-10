import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function RiwayatPembayaranPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bulan, setBulan] = useState('');
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [jenis, setJenis] = useState('');

  const fetchRiwayat = useCallback(async () => {
    setLoading(true);
    try {
      const params = { tahun };
      if (bulan) params.bulan = bulan;
      if (jenis) params.jenis = jenis;
      if (search) params.search = search;
      const res = await api.get('/export/riwayat', { params });
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun, jenis, search]);

  useEffect(() => { fetchRiwayat(); }, [fetchRiwayat]);

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleDelete = async (item) => {
    if (!confirm(`Hapus pembayaran ${item.jenis} an. ${item.nama_kk} (${BULAN[item.bulan - 1]} ${item.tahun})?`)) return;
    try {
      if (item.jenis === 'Iuran Bulanan') {
        const realId = item.id.replace('b-', '');
        await api.delete(`/iuran-bulanan/${realId}`);
      } else {
        const realId = item.id.replace('m-', '');
        await api.delete(`/iuran-makam/bulanan/${realId}`);
      }
      fetchRiwayat();
    } catch (e) {
      alert('Gagal menghapus');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Riwayat Pembayaran</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ maxWidth: 220, minWidth: 160 }}
            placeholder="Cari No Kartu / Nama..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="input" style={{ maxWidth: 150 }} value={jenis} onChange={e => setJenis(e.target.value)}>
            <option value="">Semua Jenis</option>
            <option value="bulanan">Iuran Bulanan</option>
            <option value="makam">Iuran Makam</option>
          </select>
          <select className="input" style={{ maxWidth: 140 }} value={bulan} onChange={e => setBulan(e.target.value)}>
            <option value="">Semua Bulan</option>
            {BULAN.map((b, i) => <option key={i} value={i + 1}>{b}</option>)}
          </select>
          <select className="input" style={{ maxWidth: 100 }} value={tahun} onChange={e => setTahun(parseInt(e.target.value))}>
            {[2024, 2025, 2026, 2027].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th>Tanggal</th>
                <th>No Kartu</th>
                <th>Nama KK</th>
                <th>Jenis</th>
                <th>Untuk Bulan</th>
                <th>Jumlah</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24 }}>Memuat...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-tertiary)' }}>Belum ada riwayat pembayaran</td></tr>
              ) : (
                data.map(item => (
                  <tr key={item.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(item.tanggal)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{item.no_kartu}</td>
                    <td>{item.nama_kk}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 11,
                        fontWeight: 500,
                        backgroundColor: item.jenis === 'Iuran Bulanan' ? 'var(--color-primary-light)' : 'var(--color-warning-light)',
                        color: item.jenis === 'Iuran Bulanan' ? 'var(--color-primary-dark)' : 'var(--color-warning-dark)',
                      }}>
                        {item.jenis}
                      </span>
                    </td>
                    <td>{BULAN[item.bulan - 1]} {item.tahun}</td>
                    <td style={{ fontWeight: 500 }}>Rp {item.jumlah.toLocaleString()}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 11,
                        fontWeight: 500,
                        backgroundColor: item.status === 'Lunas' || item.status === 'Dibayar' ? 'var(--color-primary-light)' : 'var(--color-danger-light)',
                        color: item.status === 'Lunas' || item.status === 'Dibayar' ? 'var(--color-primary-dark)' : 'var(--color-danger-dark)',
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item)}>Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
