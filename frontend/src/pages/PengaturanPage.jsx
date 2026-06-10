import { useState, useEffect } from 'react';
import { IconSettings } from '../components/common/Icons';
import api from '../api/client';

export default function PengaturanPage() {
  const [settings, setSettings] = useState({ tarif_bulanan: '10000', tarif_makam_per_jiwa: '10000' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        setSettings(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await api.put('/settings', settings);
      setSettings(res.data);
      setMessage('Pengaturan berhasil disimpan');
    } catch (e) {
      setMessage('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page" style={{ textAlign: 'center', paddingTop: 60 }}>Memuat...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Pengaturan</h1>
      </div>

      <div className="card" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <IconSettings size={18} style={{ color: 'var(--color-text-secondary)' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Tarif Iuran</span>
        </div>

        {message && (
          <div style={{
            padding: '8px 12px',
            backgroundColor: message.includes('berhasil') ? 'var(--color-primary-light)' : 'var(--color-danger-light)',
            color: message.includes('berhasil') ? 'var(--color-primary-dark)' : 'var(--color-danger-dark)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 16,
            fontSize: 12,
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="label">Tarif Iuran Bulanan (Rp)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={settings.tarif_bulanan}
              onChange={e => setSettings(p => ({ ...p, tarif_bulanan: e.target.value }))}
            />
            <small style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>Iuran flat per KK setiap bulan</small>
          </div>
          <div className="form-group">
            <label className="label">Tarif Iuran Makam per Jiwa (Rp)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={settings.tarif_makam_per_jiwa}
              onChange={e => setSettings(p => ({ ...p, tarif_makam_per_jiwa: e.target.value }))}
            />
            <small style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>Dihitung dari jumlah jiwa per KK</small>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </form>
      </div>
    </div>
  );
}
