import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DataWargaPage from './pages/DataWargaPage';
import IuranBulananPage from './pages/IuranBulananPage';
import IuranMakamPage from './pages/IuranMakamPage';
import ExportLaporanPage from './pages/ExportLaporanPage';
import RiwayatPembayaranPage from './pages/RiwayatPembayaranPage';
import PengaturanPage from './pages/PengaturanPage';
import PanduanPage from './pages/PanduanPage';
import Layout from './components/Layout/Layout';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Memuat...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Memuat...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="warga" element={<DataWargaPage />} />
        <Route path="iuran-bulanan" element={<IuranBulananPage />} />
        <Route path="iuran-makam" element={<IuranMakamPage />} />
        <Route path="export" element={<ExportLaporanPage />} />
        <Route path="riwayat" element={<RiwayatPembayaranPage />} />
        <Route path="pengaturan" element={<PengaturanPage />} />
        <Route path="panduan" element={<PanduanPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
