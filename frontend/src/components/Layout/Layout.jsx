import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import ModalBayar from '../common/ModalBayar';

export default function Layout() {
  const [showBayar, setShowBayar] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Topbar onOpenBayar={() => setShowBayar(true)} onToggleSidebar={() => setSidebarOpen(o => !o)} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />
        <div className={`sidebar-drawer${sidebarOpen ? ' open' : ''}`}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
        <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--color-background-page)' }}>
          <Outlet />
        </main>
      </div>
      {showBayar && <ModalBayar onClose={() => setShowBayar(false)} />}
    </div>
  );
}
