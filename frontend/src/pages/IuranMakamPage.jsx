import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import Modal from '../components/common/Modal';

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function IuranMakamPage() {
  const [rekap, setRekap] = useState([]);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedWarga, setSelectedWarga] = useState(null);
  const [form, setForm] = useState({ bulan_dari: 1, bulan_sampai: 12, tahun: new Date().getFullYear(), jumlah_bayar: '', tanggal_bayar: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchRekap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/iuran-makam/rekap/${tahun}`);
      setRekap(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tahun]);

  useEffect(() => { fetchRekap(); }, [fetchRekap]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWarga) return;
    setError('');

    const bulanMulai = Math.min(form.bulan_dari, form.bulan_sampai);
    const bulanAkhir = Math.max(form.bulan_dari, form.bulan_sampai);
    const sudahBayar = [];
    for (let b = bulanMulai; b <= bulanAkhir; b++) {
      if (selectedWarga.bulanan?.[b]?.jumlah_bayar > 0) {
        sudahBayar.push(BULAN[b - 1]);
      }
    }
    if (sudahBayar.length > 0) {
      setError(`${sudahBayar.join(', ')} sudah dibayar, tidak bisa dibayar lagi`);
      return;
    }

    setSubmitting(true);
    try {
      const isRange = form.bulan_dari !== form.bulan_sampai;
      if (isRange) {
        await api.post('/iuran-makam/bayar-bulanan/bulk', {
          warga_id: selectedWarga.id,
          bulan_dari: form.bulan_dari,
          bulan_sampai: form.bulan_sampai,
          tahun: form.tahun,
          jumlah_bayar: parseFloat(form.jumlah_bayar),
          tanggal_bayar: form.tanggal_bayar,
        });
      } else {
        await api.post('/iuran-makam/bayar-bulanan', {
          warga_id: selectedWarga.id,
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

  const openBayar = (w) => {
    setSelectedWarga(w);
    const tagihan = w.iuran_makam?.tagihan_per_bulan || 0;
    setForm({ bulan_dari: 1, bulan_sampai: 12, tahun: new Date().getFullYear(), jumlah_bayar: tagihan, tanggal_bayar: new Date().toISOString().split('T')[0] });
    setError('');
    setShowModal(true);
  };


  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Iuran Makam</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
                      const terbayar = b?.jumlah_bayar > 0;
                      return (
                        <td key={i} style={{
                          textAlign: 'center',
                          backgroundColor: terbayar ? 'var(--color-primary-light)' : 'var(--color-background-tertiary)',
                          color: terbayar ? 'var(--color-primary-dark)' : 'var(--color-text-tertiary)',
                          fontSize: 12,
                          fontWeight: terbayar ? 600 : 400,
                        }}>
                          {terbayar ? '✓' : '-'}
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

      {showModal && selectedWarga && (
        <Modal title="Bayar Iuran Makam" onClose={() => setShowModal(false)}>
          {error && (
            <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger-dark)', borderRadius: 'var(--radius-md)', marginBottom: 12, fontSize: 12 }}>
              {error}
            </div>
          )}
          <div style={{ marginBottom: 12, fontSize: 13 }}>
            <strong>{selectedWarga.nama_kk}</strong> ({selectedWarga.no_kartu})
          </div>
          <div style={{
            padding: '10px 12px',
            backgroundColor: 'var(--color-primary-light)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 12,
            fontSize: 12,
            color: 'var(--color-primary-dark)',
          }}>
            Rp {(selectedWarga.iuran_makam?.tagihan_per_bulan || 0).toLocaleString()} per bulan |
            Total terbayar: <strong>Rp {(selectedWarga.iuran_makam?.total_terbayar || 0).toLocaleString()}</strong>
          </div>
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
              <div className="form-group" style={{ flex: 1, minWidth: 100 }}>
                <label className="label">Tahun</label>
                <select className="input" value={form.tahun} onChange={e => setForm(p => ({ ...p, tahun: parseInt(e.target.value) }))}>
                  {[2024, 2025, 2026, 2027].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Jumlah Bayar per Bulan (Rp)</label>
              <input
                className="input"
                type="number"
                min={1000}
                value={form.jumlah_bayar}
                onChange={e => setForm(p => ({ ...p, jumlah_bayar: parseFloat(e.target.value) || 0 }))}
              />
              <small style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>
                Rp {(selectedWarga.iuran_makam?.tagihan_per_bulan || 0).toLocaleString()} per bulan
              </small>
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
