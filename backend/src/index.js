require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const wargaRoutes = require('./routes/warga');
const iuranBulananRoutes = require('./routes/iuranBulanan');
const iuranMakamRoutes = require('./routes/iuranMakam');
const dashboardRoutes = require('./routes/dashboard');
const exportRoutes = require('./routes/export');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/warga', wargaRoutes);
app.use('/api/iuran-bulanan', iuranBulananRoutes);
app.use('/api/iuran-makam', iuranMakamRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SImas Backend' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`SImas Backend running on port ${PORT}`);
});
