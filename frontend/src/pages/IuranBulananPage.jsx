import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import StatusPill from '../components/common/StatusPill';
import Modal from '../components/common/Modal';

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function IuranBulananPage() {
  const [rekap, setRekap] = useState([]);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedWarga, setSelectedWarga] = useState(null);
  const [form, setForm] = useState({ bulan_dari: new Date().getMonth() + 1, bulan_sampai: new Date().getMonth() + 1, jumlah_bayar: 10000, tanggal_bayar: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchRekap = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await api.get(`/iuran-bulanan/rekap/${tahun}`, { params });
      setRekap(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tahun, search]);

  useEffect(() => { fetchRekap(); }, [fetchRekap]);

  const openBayar = (warga) => {
    setSelectedWarga(warga);
    setForm({ bulan_dari: 1, bulan_sampai: 12, jumlah_bayar: 10000, tanggal_bayar: new Date().toISOString().split('T')[0] });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWarga) return;
    setError('');

    const bulanMulai = Math.min(form.bulan_dari, form.bulan_sampai);
    const bulanAkhir = Math.max(form.bulan_dari, form.bulan_sampai);
    const sudahLunas = [];
    for (let b = bulanMulai; b <= bulanAkhir; b++) {
      if (selectedWarga.bulanan?.[b]?.status === 'Lunas') {
        sudahLunas.push(BULAN[b - 1]);
      }
    }
    if (sudahLunas.length > 0) {
      setError(`${sudahLunas.join(', ')} sudah Lunas, tidak bisa dibayar lagi`);
      return;
    }

    setSubmitting(true);
    try {
      const isRange = form.bulan_dari !== form.bulan_sampai;
      if (isRange) {
        await api.post('/iuran-bulanan/bulk', {
          warga_id: selectedWarga.id,
          bulan_dari: form.bulan_dari,
          bulan_sampai: form.bulan_sampai,
          tahun,
          jumlah_bayar: parseFloat(form.jumlah_bayar),
          tanggal_bayar: form.tanggal_bayar,
        });
      } else {
        await api.post('/iuran-bulanan', {
          warga_id: selectedWarga.id,
          bulan: form.bulan_dari,
          tahun,
          jumlah_bayar: parseFloat(form.jumlah_bayar),
          tanggal_bayar: form.tanggal_bayar,
        });
      }
      setShowModal(false);
      fetchRekap();
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Iuran Bulanan</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="input"
            style={{ maxWidth: 260, minWidth: 160 }}
            placeholder="Cari No Kartu / Nama KK..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="input" style={{ maxWidth: 100 }} value={tahun} onChange={e => setTahun(parseInt(e.target.value))}>
            {[2024, 2025, 2026, 2027].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>No Kartu</th>
                <th>Nama KK</th>
                {BULAN.map((b, i) => <th key={i} style={{ textAlign: 'center', minWidth: 48 }}>{b.substring(0, 3)}</th>)}
                <th>Total</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={16} style={{ textAlign: 'center', padding: 24 }}>Memuat...</td></tr>
              ) : rekap.length === 0 ? (
                <tr><td colSpan={16} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-tertiary)' }}>Belum ada data</td></tr>
              ) : (
                rekap.map(w => (
                  <tr key={w.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{w.no_kartu}</td>
                    <td>{w.nama_kk}</td>
                    {BULAN.map((_, i) => {
                      const b = w.bulanan[i + 1];
                      const isLunas = b?.status === 'Lunas';
                      return (
                        <td key={i} style={{
                          textAlign: 'center',
                          backgroundColor: isLunas ? 'var(--color-primary-light)' : 'var(--color-background-tertiary)',
                          color: isLunas ? 'var(--color-primary-dark)' : 'var(--color-text-tertiary)',
                          fontSize: 12,
                          fontWeight: isLunas ? 600 : 400,
                        }}>
                          {isLunas ? '✓' : '-'}
                        </td>
                      );
                    })}
                    <td style={{ fontWeight: 500 }}>Rp {(w.total_bayar || 0).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => openBayar(w)}>Bayar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="Catat Iuran Bulanan" onClose={() => setShowModal(false)}>
          {error && (
            <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger-dark)', borderRadius: 'var(--radius-md)', marginBottom: 12, fontSize: 12 }}>
              {error}
            </div>
          )}
          {selectedWarga && (
            <div style={{ marginBottom: 12, fontSize: 13 }}>
              <strong>{selectedWarga.nama_kk}</strong> ({selectedWarga.no_kartu})
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                <label className="label">Dari Bulan</label>
                <select className="input" value={form.bulan_dari} onChange={e => setForm(p => ({ ...p, bulan_dari: parseInt(e.target.value) }))}>
                  {BULAN.map((b, i) => <option key={i} value={i + 1}>{b}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                <label className="label">Sampai Bulan</label>
                <select className="input" value={form.bulan_sampai} onChange={e => setForm(p => ({ ...p, bulan_sampai: parseInt(e.target.value) }))}>
                  {BULAN.map((b, i) => <option key={i} value={i + 1}>{b}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Jumlah Bayar (Rp)</label>
              <input className="input" type="number" value={form.jumlah_bayar} onChange={e => setForm(p => ({ ...p, jumlah_bayar: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="form-group">
              <label className="label">Tanggal Bayar</label>
              <input className="input" type="date" value={form.tanggal_bayar} onChange={e => setForm(p => ({ ...p, tanggal_bayar: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
