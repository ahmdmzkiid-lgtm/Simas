import { IconActivity } from '../common/Icons';

export default function AktivitasFeed({ aktivitas }) {
  if (!aktivitas || aktivitas.length === 0) {
    return (
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Aktivitas Terbaru</div>
        <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-tertiary)', fontSize: 12 }}>
          Belum ada aktivitas
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <IconActivity size={16} style={{ color: 'var(--color-primary)' }} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Aktivitas Terbaru</span>
      </div>
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {aktivitas.map((a, i) => (
          <div key={i} style={{
            padding: '8px 0',
            borderBottom: '0.5px solid var(--color-border-light)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: 4,
                backgroundColor: a.tipe === 'Iuran Bulanan' ? 'var(--color-primary-light)' : 'var(--color-warning-light)',
                color: a.tipe === 'Iuran Bulanan' ? 'var(--color-primary-dark)' : 'var(--color-warning-dark)',
              }}>
                {a.tipe}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>{a.message}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
              {a.user} &middot; {new Date(a.tanggal).toLocaleDateString('id-ID')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
