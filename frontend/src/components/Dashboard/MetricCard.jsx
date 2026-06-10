export default function MetricCard({ label, value, sub, color }) {
  return (
    <div className="card">
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500, color: color || 'var(--color-text-primary)', marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{sub}</div>
    </div>
  );
}
