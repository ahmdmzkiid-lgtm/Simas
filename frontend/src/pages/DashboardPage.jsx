import { useState, useEffect } from 'react';
import api from '../api/client';
import MetricCard from '../components/Dashboard/MetricCard';
import ChartKolektibilitas from '../components/Dashboard/ChartKolektibilitas';
import AktivitasFeed from '../components/Dashboard/AktivitasFeed';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [kolektibilitas, setKolektibilitas] = useState([]);
  const [aktivitas, setAktivitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, kolekRes, aktivitasRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/kolektibilitas'),
          api.get('/dashboard/aktivitas'),
        ]);
        setStats(statsRes.data);
        setKolektibilitas(kolekRes.data.data || []);
        setAktivitas(aktivitasRes.data);
        setLastUpdate(new Date());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="page" style={{ textAlign: 'center', paddingTop: 60 }}>Memuat data...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'inline-block' }}></span>
          Live
          {lastUpdate && <span>&middot; {lastUpdate.toLocaleTimeString('id-ID')}</span>}
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <MetricCard
          label="Total Kas"
          value={`Rp ${(stats?.total_kas || 0).toLocaleString()}`}
          sub="Gabungan Bulanan + Makam"
          color="var(--color-primary)"
        />
        <MetricCard
          label="Iuran Bulanan"
          value={`Rp ${(stats?.total_bulanan || 0).toLocaleString()}`}
          sub={`${stats?.total_warga || 0} KK terdaftar`}
          color="var(--color-primary)"
        />
        <MetricCard
          label="Iuran Makam"
          value={`Rp ${(stats?.total_makam || 0).toLocaleString()}`}
          sub="Total pembayaran masuk"
          color="var(--color-warning)"
        />
        <MetricCard
          label="Tunggakan Bulanan"
          value={`Rp ${(stats?.tunggakan_bulanan || 0).toLocaleString()}`}
          sub="Iuran bulanan belum dibayar"
          color="var(--color-danger)"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
        <ChartKolektibilitas data={kolektibilitas} />
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Aktivitas Terbaru</div>
          <AktivitasFeed aktivitas={aktivitas} />
        </div>
      </div>
    </div>
  );
}
