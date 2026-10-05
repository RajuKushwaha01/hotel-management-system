import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import MobileBottomNav from '../components/common/MobileBottomNav';

export default function StaffLayout({ variant = 'manager' }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden flex bg-bgLight dark:bg-darkBg">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        open={sidebarOpen}
        mobileOpen={mobileOpen}
        variant={variant}
        onToggleCollapse={() => setSidebarOpen((o) => !o)}
      />

      {/* This column is the ONLY thing that scrolls — Navbar inside it is sticky, Sidebar outside it never moves */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Navbar onMenuClick={() => setMobileOpen((o) => !o)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-20 md:pb-6 animate-fade-in">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav variant={variant} onMore={() => setMobileOpen(true)} />
    </div>
  );
}
