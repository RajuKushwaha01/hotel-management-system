import { Menu, Search, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';
import RoleBadge from './RoleBadge';

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 h-16 shrink-0 flex items-center justify-between px-4 md:px-6 bg-white/90 dark:bg-darkCard/90 backdrop-blur-md border-b border-border dark:border-darkBorder">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 shrink-0" aria-label="Toggle menu">
          <Menu size={20} />
        </button>
        <div className="relative hidden sm:block max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 text-text-secondary" size={16} />
          <input
            placeholder="Search anything..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-bgLight dark:bg-darkBg border border-border dark:border-darkBorder text-sm focus:outline-none focus:border-gold transition"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <RoleBadge />
        <button
          onClick={() => setDark((d) => !d)}
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
          aria-label="Toggle theme"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <NotificationBell />
        <div className="flex items-center gap-2 pl-2 md:pl-3 border-l border-border dark:border-darkBorder">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-goldLight flex items-center justify-center text-navy font-semibold text-sm shrink-0">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          <span className="hidden md:block text-sm font-medium truncate max-w-[100px]">{user?.firstName}</span>
        </div>
      </div>
    </header>
  );
}
