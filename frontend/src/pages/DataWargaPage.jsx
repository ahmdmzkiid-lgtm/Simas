import { useState, useEffect, useCallback, useRef } from 'react';
import api, { API_BASE } from '../api/client';
import Modal from '../components/common/Modal';
import { IconDownload, IconUpload, IconFileSpreadsheet, IconX, IconCheck } from '../components/common/Icons';

const downloadTemplate = async () => {
  const token = localStorage.getItem('simas_token');
  const res = await fetch(`${API_BASE}/export/template-warga`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal mengunduh template');
  const blob = await res.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'template-import-warga.xlsx';
  link.click();
  URL.revokeObjectURL(link.href);
};

export default function DataWargaPage() {
  const [warga, setWarga] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editWarga, setEditWarga] = useState(null);
  const [form, setForm] = useState({ no_kartu: '', nama_kk: '', jumlah_jiwa: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [importFile, setImportFile] = useState(null);
  const [importMode, setImportMode] = useState('skip');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const fileRef = useRef(null);

  const fetchWarga = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/warga', { params });
      setWarga(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchWarga(); }, [fetchWarga]);

  const openAdd = () => {
    setEditWarga(null);
    setForm({ no_kartu: '', nama_kk: '', jumlah_jiwa: 1 });
    setError('');
    setShowModal(true);
  };

  const openEdit = (w) => {
    setEditWarga(w);
    setForm({ no_kartu: w.no_kartu, nama_kk: w.nama_kk, jumlah_jiwa: w.jumlah_jiwa });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editWarga) {
        await api.put(`/warga/${editWarga.id}`, { nama_kk: form.nama_kk, jumlah_jiwa: form.jumlah_jiwa });
      } else {
        await api.post('/warga', form);
      }
      setShowModal(false);
      fetchWarga();
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      fd.append('mode', importMode);
      const res = await api.post('/warga/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      setImportFile(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchWarga();
    } catch (e) {
      setImportResult({ error: e.response?.data?.message || 'Gagal mengimpor' });
    } finally {
      setImportLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus warga ini?')) return;
    try {
      await api.delete(`/warga/${id}`);
      fetchWarga();
    } catch (e) {
      alert('Gagal menghapus');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Hapus SEMUA data warga? Data iuran terkait juga akan ikut terhapus. Tindakan ini tidak bisa dibatalkan!')) return;
    try {
      await api.delete('/warga');
      fetchWarga();
      alert('Semua data warga berhasil dihapus');
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal menghapus semua data');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Data Warga</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={downloadTemplate}><IconDownload size={14} /> Template</button>
          <button className="btn btn-primary" onClick={openAdd}>+ Tambah Warga</button>
          <button className="btn btn-danger" onClick={handleDeleteAll}>Hapus Semua</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ maxWidth: 280, minWidth: 180 }}
            placeholder="Cari No Kartu / Nama KK..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select className="input" style={{ maxWidth: 160 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Semua Status</option>
            <option value="Lunas">Lunas</option>
            <option value="Mencicil">Mencicil</option>
            <option value="Belum Bayar">Belum Bayar</option>
          </select>
          <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            {total} warga
          </span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
        <div
          style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', backgroundColor: 'var(--color-background-secondary)', borderBottom: showImport ? '0.5px solid var(--color-border)' : 'none', userSelect: 'none' }}
          onClick={() => setShowImport(!showImport)}
        >
          <IconUpload size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>Import Warga dari Excel</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{showImport ? 'Sembunyikan' : 'Buka'}</span>
        </div>
        {showImport && (
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div
                  className="dropzone"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setImportFile(f); }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={e => setImportFile(e.target.files[0] || null)}
                  />
                  <div className="dropzone-icon"><IconFileSpreadsheet size={32} /></div>
                  {importFile ? (
                    <>
                      <div className="dropzone-title">{importFile.name}</div>
                      <div className="dropzone-hint">{(importFile.size / 1024).toFixed(1)} KB — klik/ganti file</div>
                    </>
                  ) : (
                    <>
                      <div className="dropzone-title">Pilih file Excel</div>
                      <div className="dropzone-hint">Klik atau seret file .xlsx ke sini</div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ minWidth: 180 }}>
                <div className="form-group">
                  <label className="label">Mode Import</label>
                  <select className="input" value={importMode} onChange={e => setImportMode(e.target.value)}>
                    <option value="skip">Skip (lewati duplikat)</option>
                    <option value="overwrite">Overwrite (timpa data lama)</option>
                  </select>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={handleImport} disabled={!importFile || importLoading}>
                  {importLoading ? 'Mengimpor...' : 'Import'}
                </button>
              </div>
            </div>
            {importResult && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: importResult.error ? 'var(--color-danger-light)' : 'var(--color-primary-light)', fontSize: 12 }}>
                {importResult.error ? (
                  <div style={{ color: 'var(--color-danger-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IconX size={14} /> {importResult.error}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <IconCheck size={14} /> Import selesai
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: 'var(--color-primary-dark)' }}>
                      <span>Total: {importResult.total} baris</span>
                      <span style={{ color: 'var(--color-primary)' }}>Baru: {importResult.imported}</span>
                      <span style={{ color: 'var(--color-warning-dark)' }}>Ditimpa: {importResult.overwritten}</span>
                      <span style={{ color: 'var(--color-text-tertiary)' }}>Di skip: {importResult.skipped}</span>
                      {importResult.rejected > 0 && <span style={{ color: 'var(--color-danger-dark)' }}>Ditolak: {importResult.rejected}</span>}
                    </div>
                    {importResult.errors?.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontWeight: 500, marginBottom: 4, color: 'var(--color-warning-dark)' }}>Peringatan:</div>
                        {importResult.errors.map((e, i) => (
                          <div key={i} style={{ color: 'var(--color-warning-dark)', marginLeft: 8 }}>• {e.baris}: {e.alasan}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>No Kartu</th>
                <th>Nama KK</th>
                <th>Jiwa</th>
                <th>Tagihan Makam</th>
                <th>Terbayar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24 }}>Memuat...</td></tr>
              ) : warga.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-tertiary)' }}>Belum ada data warga</td></tr>
              ) : (
                warga.map((w, i) => {
                  const tagihan = parseFloat(w.iuran_makam?.total_tagihan || 0);
                  const terbayar = parseFloat(w.iuran_makam?.total_terbayar || 0);
                  return (
                    <tr key={w.id}>
                      <td style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 12 }}>{(page - 1) * 20 + i + 1}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{w.no_kartu}</td>
                      <td>{w.nama_kk}</td>
                      <td>{w.jumlah_jiwa}</td>
                      <td>Rp {tagihan.toLocaleString()}</td>
                      <td>Rp {terbayar.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(w)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(w.id)}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '0.5px solid var(--color-border)' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              {total} warga — Halaman {page} dari {Math.ceil(total / 20)}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Sebelumnya</button>
              <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Selanjutnya</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editWarga ? 'Edit Warga' : 'Tambah Warga'} onClose={() => setShowModal(false)}>
          {error && (
            <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger-dark)', borderRadius: 'var(--radius-md)', marginBottom: 12, fontSize: 12 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">No Kartu</label>
              <input className="input" value={form.no_kartu} onChange={e => setForm(f => ({ ...f, no_kartu: e.target.value }))} disabled={!!editWarga} required />
            </div>
            <div className="form-group">
              <label className="label">Nama KK</label>
              <input className="input" value={form.nama_kk} onChange={e => setForm(f => ({ ...f, nama_kk: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Jumlah Jiwa</label>
              <input className="input" type="number" min={1} value={form.jumlah_jiwa} onChange={e => setForm(f => ({ ...f, jumlah_jiwa: parseInt(e.target.value) || 1 }))} required />
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
