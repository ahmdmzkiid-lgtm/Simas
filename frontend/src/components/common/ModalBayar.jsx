import { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../../api/client';

export default function ModalBayar({ onClose }) {
  const [tab, setTab] = useState('bulanan');
  const [wargaList, setWargaList] = useState([]);
  const [wargaSearch, setWargaSearch] = useState('');
  const [selectedWarga, setSelectedWarga] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [formBulanan, setFormBulanan] = useState({
    bulan: new Date().getMonth() + 1,
    tahun: new Date().getFullYear(),
    jumlah_bayar: 10000,
    tanggal_bayar: new Date().toISOString().split('T')[0],
  });

  const [formMakam, setFormMakam] = useState({
    jumlah_bayar: '',
    tanggal_bayar: new Date().toISOString().split('T')[0],
  });

  const [sisaPiutang, setSisaPiutang] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (wargaSearch.length < 1) {
      setWargaList([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/warga?search=${wargaSearch}&limit=10`);
        setWargaList(res.data.data);
        setShowDropdown(true);
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [wargaSearch]);

  const selectWarga = async (w) => {
    setSelectedWarga(w);
    setWargaSearch(`${w.no_kartu} - ${w.nama_kk}`);
    setShowDropdown(false);
    try {
      const res = await api.get(`/iuran-makam`);
      const makam = res.data.find(m => m.warga_id === w.id);
      if (makam) {
        setSisaPiutang(makam.total_tagihan - makam.total_terbayar);
        setFormMakam(prev => ({ ...prev, jumlah_bayar: makam.tagihan_per_bulan }));
      }
    } catch (e) {}
  };

  const handleSubmitBulanan = async (e) => {
    e.preventDefault();
    if (!selectedWarga) return setError('Pilih warga terlebih dahulu');
    setError('');
    setSubmitting(true);
    try {
      await api.post('/iuran-bulanan', {
        warga_id: selectedWarga.id,
        ...formBulanan,
        jumlah_bayar: parseFloat(formBulanan.jumlah_bayar),
      });
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitMakam = async (e) => {
    e.preventDefault();
    if (!selectedWarga) return setError('Pilih warga terlebih dahulu');
    setError('');
    setSubmitting(true);
    try {
      await api.post('/iuran-makam/bayar-bulanan', {
        warga_id: selectedWarga.id,
        jumlah_bayar: parseFloat(formMakam.jumlah_bayar),
        tanggal_bayar: formMakam.tanggal_bayar,
      });
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][i] }));

  return (
    <Modal title="Catat Pembayaran" onClose={onClose}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className={`btn btn-sm ${tab === 'bulanan' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('bulanan')}
        >
          Iuran Bulanan
        </button>
        <button
          className={`btn btn-sm ${tab === 'makam' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('makam')}
        >
          Iuran Makam
        </button>
      </div>

      {error && (
        <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger-dark)', borderRadius: 'var(--radius-md)', marginBottom: 12, fontSize: 12 }}>
          {error}
        </div>
      )}

      <div className="form-group">
        <label className="label">Warga</label>
        <div style={{ position: 'relative' }}>
          <input
            className="input"
            placeholder="Cari No Kartu / Nama KK..."
            value={wargaSearch}
            onChange={e => { setWargaSearch(e.target.value); setSelectedWarga(null); }}
            onFocus={() => wargaList.length > 0 && setShowDropdown(true)}
          />
          {showDropdown && wargaList.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              zIndex: 10,
              maxHeight: 200,
              overflowY: 'auto',
            }}>
              {wargaList.map(w => (
                <div
                  key={w.id}
                  onClick={() => selectWarga(w)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '0.5px solid var(--color-border-light)',
                    fontSize: 13,
                  }}
                  onMouseEnter={e => e.target.style.backgroundColor = 'var(--color-background-secondary)'}
                  onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-tertiary)' }}>{w.no_kartu}</span>
                  {' '}{w.nama_kk}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {tab === 'bulanan' ? (
        <form onSubmit={handleSubmitBulanan}>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Bulan</label>
              <select className="input" value={formBulanan.bulan} onChange={e => setFormBulanan(p => ({ ...p, bulan: parseInt(e.target.value) }))}>
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Tahun</label>
              <input className="input" type="number" value={formBulanan.tahun} onChange={e => setFormBulanan(p => ({ ...p, tahun: parseInt(e.target.value) }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Jumlah Bayar (Rp)</label>
            <input className="input" type="number" value={formBulanan.jumlah_bayar} onChange={e => setFormBulanan(p => ({ ...p, jumlah_bayar: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div className="form-group">
            <label className="label">Tanggal Bayar</label>
            <input className="input" type="date" value={formBulanan.tanggal_bayar} onChange={e => setFormBulanan(p => ({ ...p, tanggal_bayar: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmitMakam}>
          {selectedWarga && (
            <div style={{
              padding: '10px 12px',
              backgroundColor: 'var(--color-primary-light)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 12,
              fontSize: 12,
              color: 'var(--color-primary-dark)',
            }}>
              Rp 10.000/jiwa per bulan
            </div>
          )}
          <div className="form-group">
            <label className="label">Jumlah Bayar (Rp)</label>
            <input
              className="input"
              type="number"
              min={1000}
              value={formMakam.jumlah_bayar}
              onChange={e => setFormMakam(p => ({ ...p, jumlah_bayar: parseFloat(e.target.value) || 0 }))}
            />
            <small style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>Min Rp 1.000, Rp 10.000/jiwa per bulan</small>
          </div>
          <div className="form-group">
            <label className="label">Tanggal Bayar</label>
            <input className="input" type="date" value={formMakam.tanggal_bayar} onChange={e => setFormMakam(p => ({ ...p, tanggal_bayar: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
