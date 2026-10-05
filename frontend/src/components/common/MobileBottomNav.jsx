import { NavLink } from 'react-router-dom';
import { LayoutDashboard, User, Menu, Bell } from 'lucide-react';
import NotificationBell from './NotificationBell';

const HOME_BY_VARIANT = {
  staff: '/manager/dashboard',
  admin: '/admin/dashboard',
  customer: '/customer/dashboard',
};
const PROFILE_BY_VARIANT = {
  staff: '/manager/settings',
  admin: '/admin/settings',
  customer: '/customer/profile',
};

export default function MobileBottomNav({ variant = 'staff', onMore }) {
  const home = HOME_BY_VARIANT[variant] || '/manager/dashboard';
  const profile = PROFILE_BY_VARIANT[variant] || '/manager/dashboard';

  const linkClass = ({ isActive }) =>
    `flex flex-col items-center gap-0.5 text-[11px] font-medium transition ${isActive ? 'text-gold' : 'text-text-secondary'}`;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-darkCard border-t border-border dark:border-darkBorder flex items-center justify-around h-16 px-2 pb-[env(safe-area-inset-bottom,0px)]">
      <NavLink to={home} className={linkClass}>
        <LayoutDashboard size={20} />
        Home
      </NavLink>
      <div className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-text-secondary">
        <NotificationBell mobileIconOnly />
        Alerts
      </div>
      <NavLink to={profile} className={linkClass}>
        <User size={20} />
        Profile
      </NavLink>
      <button onClick={onMore} className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-text-secondary">
        <Menu size={20} />
        Menu
      </button>
    </nav>
  );
}
