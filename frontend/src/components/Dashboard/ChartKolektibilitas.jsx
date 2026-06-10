import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const bulanNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const CustomLegend = () => (
  <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 16, height: 2, backgroundColor: '#0F6E56', display: 'inline-block' }}></span>
      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Iuran Bulanan</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 16, height: 2, backgroundColor: '#E8A838', display: 'inline-block' }}></span>
      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Iuran Makam</span>
    </div>
  </div>
);

export default function ChartKolektibilitas({ data }) {
  const chartData = data.map((d, i) => ({
    bulan: bulanNames[i],
    Bulanan: d.kolektibilitas_bulanan || 0,
    Makam: d.kolektibilitas_makam || 0,
  }));

  return (
    <div className="card">
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Grafik Kolektibilitas</div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => `${value}%`}
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '0.5px solid #E5E7EB' }}
          />
          <Legend content={<CustomLegend />} />
          <Line type="monotone" dataKey="Bulanan" stroke="#0F6E56" strokeWidth={2} dot={{ fill: '#0F6E56', r: 3 }} />
          <Line type="monotone" dataKey="Makam" stroke="#E8A838" strokeWidth={2} dot={{ fill: '#E8A838', r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
