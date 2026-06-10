import StatusPill from '../common/StatusPill';
import { IconUsers } from '../common/Icons';

export default function StatusRingkasan({ stats }) {
  const items = [
    { label: 'Lunas', count: stats?.status_makam?.lunas || 0, status: 'Lunas' },
    { label: 'Mencicil', count: stats?.status_makam?.mencicil || 0, status: 'Mencicil' },
    { label: 'Menunggak', count: stats?.status_makam?.belum_bayar || 0, status: 'Belum Bayar' },
  ];

  return (
    <div className="card">
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Status Pembayaran Makam</div>
      {items.map(item => (
        <div key={item.label} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 0',
          borderBottom: '0.5px solid var(--color-border-light)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconUsers size={16} style={{ color: 'var(--color-text-tertiary)' }} />
            <span style={{ fontSize: 13 }}>{item.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{item.count}</span>
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>KK</span>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 12 }}>
        <StatusPill status={stats?.status_makam?.lunas > stats?.total_warga / 2 ? 'Lunas' : 'Mencicil'} />
        <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {stats?.total_warga || 0} KK terdaftar
        </span>
      </div>
    </div>
  );
}
