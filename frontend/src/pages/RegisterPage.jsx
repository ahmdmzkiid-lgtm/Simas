import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { IconBuildingCommunity } from '../components/common/Icons';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '', nama_lengkap: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      localStorage.setItem('simas_token', res.data.token);
      localStorage.setItem('simas_user', JSON.stringify(res.data.user));
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-background-page)',
      padding: 20,
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 380, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 48,
            height: 48,
            backgroundColor: 'var(--color-primary)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            color: 'white',
          }}>
            <IconBuildingCommunity size={28} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Daftar Akun Baru</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Buat akun untuk mengakses SImas
          </p>
        </div>

        {error && (
          <div style={{
            padding: '8px 12px',
            backgroundColor: 'var(--color-danger-light)',
            color: 'var(--color-danger-dark)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 16,
            fontSize: 12,
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Nama Lengkap</label>
            <input className="input" type="text" placeholder="Masukkan nama lengkap" value={form.nama_lengkap} onChange={e => setForm(p => ({ ...p, nama_lengkap: e.target.value }))} autoFocus />
          </div>
          <div className="form-group">
            <label className="label">Username</label>
            <input className="input" type="text" placeholder="Masukkan username" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="Minimal 6 karakter" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', marginTop: 8 }} disabled={loading}>
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
          <span style={{ color: 'var(--color-text-tertiary)' }}>Sudah punya akun? </span>
          <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>Masuk</Link>
        </div>
      </div>
    </div>
  );
}