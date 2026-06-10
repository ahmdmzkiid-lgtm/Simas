import { NavLink } from 'react-router-dom';
import {
  IconDashboard,
  IconUsers,
  IconCalendar,
  IconBone,
  IconDownload,
  IconActivity,
  IconSettings,
  IconFileSpreadsheet as IconBook,
} from '../common/Icons';

const menuItems = [
  { label: 'Dashboard', icon: IconDashboard, path: '/dashboard' },
  { label: 'Data Warga', icon: IconUsers, path: '/warga', badge: null },
  { label: 'Iuran Bulanan', icon: IconCalendar, path: '/iuran-bulanan' },
  { label: 'Iuran Makam', icon: IconBone, path: '/iuran-makam' },
  { label: 'Export Laporan', icon: IconDownload, path: '/export' },
  { label: 'Riwayat Pembayaran', icon: IconActivity, path: '/riwayat' },
  { label: 'Pengaturan', icon: IconSettings, path: '/pengaturan' },
  { label: 'Panduan', icon: IconBook, path: '/panduan' },
];

const sectionLabels = {
  'Dashboard': 'Utama',
  'Data Warga': 'Utama',
  'Iuran Bulanan': 'Penagihan',
  'Iuran Makam': 'Penagihan',
  'Export Laporan': 'Laporan',
  'Riwayat Pembayaran': 'Laporan',
  'Pengaturan': 'Sistem',
  'Panduan': 'Sistem',
};

export default function Sidebar({ onClose }) {
  let currentSection = '';
  return (
    <div style={{
      width: '100%',
      height: '100%',
      overflowY: 'auto',
      padding: '12px 0',
    }}>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const section = sectionLabels[item.label];
        const showSection = section !== currentSection;
        if (showSection) currentSection = section;

        return (
          <div key={item.path}>
            {showSection && (
              <div style={{
                padding: '8px 16px 4px',
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--color-text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                {section}
              </div>
            )}
            <NavLink
              to={item.path}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 16px',
                margin: '1px 8px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                transition: 'all 0.1s ease',
              })}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          </div>
        );
      })}
    </div>
  );
}
