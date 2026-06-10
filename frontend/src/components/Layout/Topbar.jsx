import { useState } from 'react';
import { IconBuildingCommunity, IconDownload, IconUpload, IconPlus, IconLogout, IconX } from '../common/Icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ onOpenBayar, onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [fabOpen, setFabOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fabActions = [
    { icon: IconDownload, label: 'Export', type: 'navigate', path: '/export' },
    { icon: IconUpload, label: 'Import', type: 'navigate', path: '/warga' },
    { icon: IconPlus, label: 'Catat Bayar', type: 'openBayar' },
  ];

  const handleFabAction = (item) => {
    setFabOpen(false);
    if (item.type === 'navigate') navigate(item.path);
    else if (item.type === 'openBayar') onOpenBayar();
  };

  return (
    <>
      <div style={{
        height: 'var(--topbar-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        backgroundColor: 'var(--color-background-primary)',
        borderBottom: '0.5px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="sidebar-toggle" onClick={onToggleSidebar} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text-secondary)', display: 'flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div style={{
            width: 32,
            height: 32,
            backgroundColor: 'var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}>
            <IconBuildingCommunity size={18} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--color-text-primary)' }}>SImas</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="desktop-only" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {user?.nama_lengkap}
          </span>
          <div className="desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/export')}>
              <IconDownload size={14} /> Export
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/warga')}>
              <IconUpload size={14} /> Import
            </button>
            <button className="btn btn-primary btn-sm" onClick={onOpenBayar}>
              <IconPlus size={14} /> Catat Bayar
            </button>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout} title="Logout">
            <IconLogout size={14} />
          </button>
        </div>
      </div>

      <div className="fab-container">
        {fabOpen && (
          <div className="fab-backdrop" onClick={() => setFabOpen(false)} />
        )}
        <div className={`fab-menu${fabOpen ? ' open' : ''}`}>
          {fabActions.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label} className="fab-action" onClick={() => handleFabAction(item)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        <button className="fab-btn" onClick={() => setFabOpen(o => !o)}>
          {fabOpen ? <IconX size={22} /> : <IconPlus size={22} />}
        </button>
      </div>
    </>
  );
}
