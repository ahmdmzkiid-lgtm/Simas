const R = 15.91549430918954;
const CIRCUMFERENCE = 2 * Math.PI * R;

function segmentProps(value, offset) {
  const dashLen = (value / 100) * CIRCUMFERENCE;
  const gapLen = CIRCUMFERENCE - dashLen;
  return {
    strokeDasharray: `${dashLen} ${gapLen}`,
    strokeDashoffset: -offset,
  };
}

export default function DonutChart({ stats, kolektibilitas }) {
  const currentMonth = new Date().getMonth();
  const bulanData = kolektibilitas?.[currentMonth] || {};
  const bulananPct = bulanData.kolektibilitas_bulanan || 0;
  const belumPct = Math.max(0, 100 - bulananPct);

  const segments = [
    { label: 'Iuran Bulanan', pct: bulananPct, color: '#0F6E56', offset: 0 },
    { label: 'Belum Bayar', pct: belumPct, color: '#d9e5e7', offset: bulananPct / 100 * CIRCUMFERENCE },
  ];

  const totalTerbayar = bulananPct;
  const centerLabel = totalTerbayar > 0 ? `${Math.round(totalTerbayar)}%` : '0%';

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-primary)' }}>
          Total Kolektibilitas
        </h3>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          Overview of the current collection status across all categories.
        </p>
      </div>

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
        <svg width={240} height={240} viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)' }}>
          {segments.map((seg, i) => (
            <circle
              key={seg.label}
              cx="21" cy="21" fill="transparent" r={R}
              stroke={seg.color}
              strokeWidth="6"
              {...segmentProps(seg.pct, seg.offset)}
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
          ))}
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>{centerLabel}</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</span>
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: 'Iuran Bulanan', pct: bulananPct, color: '#0F6E56' },
          { label: 'Belum Bayar', pct: belumPct, color: '#d9e5e7' },
        ].map(item => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-background-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color, display: 'inline-block' }} />
              <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{item.label}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: item.color === '#d9e5e7' ? 'var(--color-text-tertiary)' : item.color }}>
              {item.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
