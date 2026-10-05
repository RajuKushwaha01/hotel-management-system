import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BedDouble, CalendarCheck, Users, FileText, Sparkles,
  UtensilsCrossed, Wrench, Package, Settings, LogOut, ClipboardList, ChefHat,
  DollarSign, Receipt, Truck, Database, Activity, ScrollText, FolderOpen,
  ListChecks, LayoutGrid, Shield, Gift, Star, MapPin, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Every role's navigation, grouped into labeled sections for scan-ability.
// The key here (e.g. "admin", "manager") is the ONLY thing that decides what a role
// sees — this is the single source of truth for every sidebar in the app.
const SECTIONS_BY_VARIANT = {
  admin: [
    { heading: 'Overview', items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/room-status-board', label: 'Room Status', icon: LayoutGrid },
    ]},
    { heading: 'Property', items: [
      { to: '/admin/rooms', label: 'Rooms', icon: BedDouble },
      { to: '/admin/room-types', label: 'Room Types', icon: BedDouble },
      { to: '/admin/services', label: 'Service Catalog', icon: ListChecks },
    ]},
    { heading: 'People', items: [
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/permissions', label: 'Permissions', icon: Shield },
    ]},
    { heading: 'System', items: [
      { to: '/admin/settings', label: 'Settings', icon: Settings },
      { to: '/admin/backup', label: 'Backup', icon: Database },
      { to: '/admin/database-schema', label: 'Database Schema', icon: Database },
      { to: '/admin/workflow', label: 'Workflow', icon: Activity },
      { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
      { to: '/documents', label: 'Documents', icon: FolderOpen },
    ]},
  ],
  manager: [
    { heading: 'Overview', items: [
      { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/room-status-board', label: 'Room Status', icon: LayoutGrid },
    ]},
    { heading: 'Front Desk', items: [
      { to: '/manager/reservations', label: 'Reservations', icon: CalendarCheck },
      { to: '/manager/calendar', label: 'Booking Calendar', icon: CalendarCheck },
      { to: '/manager/room-rates', label: 'Room Rates', icon: BedDouble },
    ]},
    { heading: 'Operations', items: [
      { to: '/manager/inventory', label: 'Inventory', icon: Package },
      { to: '/manager/suppliers', label: 'Suppliers', icon: Truck },
      { to: '/manager/procurement', label: 'Procurement', icon: FileText },
      { to: '/manager/events', label: 'Events', icon: Sparkles },
    ]},
    { heading: 'People', items: [
      { to: '/manager/staff', label: 'Staff', icon: Users },
      { to: '/manager/attendance', label: 'Attendance', icon: ClipboardList },
      { to: '/manager/crm', label: 'CRM', icon: Users },
    ]},
    { heading: 'Insights', items: [
      { to: '/manager/reviews-complaints', label: 'Reviews & Complaints', icon: FileText },
      { to: '/manager/reports', label: 'Reports', icon: FileText },
      { to: '/manager/night-audit', label: 'Night Audit', icon: Activity },
    ]},
  ],
  receptionist: [
    { heading: 'Front Desk', items: [
      { to: '/receptionist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/receptionist/reservations', label: 'Reservations', icon: CalendarCheck },
      { to: '/receptionist/check-in', label: 'Check-In', icon: Users },
      { to: '/receptionist/check-out', label: 'Check-Out', icon: Users },
    ]},
    { heading: 'Guests', items: [
      { to: '/receptionist/guests', label: 'Guests', icon: Users },
      { to: '/receptionist/services', label: 'Front Desk Services', icon: Sparkles },
      { to: '/receptionist/transport', label: 'Transport', icon: Truck },
    ]},
    { heading: 'Live', items: [
      { to: '/room-status-board', label: 'Room Status', icon: LayoutGrid },
    ]},
  ],
  housekeeping: [
    { heading: 'Housekeeping', items: [
      { to: '/housekeeping/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/housekeeping/laundry', label: 'Laundry', icon: Sparkles },
      { to: '/housekeeping/lost-found', label: 'Lost & Found', icon: Package },
    ]},
    { heading: 'Live', items: [
      { to: '/room-status-board', label: 'Room Status', icon: LayoutGrid },
    ]},
  ],
  fnb_staff: [
    { heading: 'Restaurant', items: [
      { to: '/restaurant/tables', label: 'Tables', icon: UtensilsCrossed },
      { to: '/restaurant/menu', label: 'Menu', icon: FileText },
      { to: '/restaurant/orders', label: 'Orders', icon: Receipt },
    ]},
  ],
  chef: [
    { heading: 'Kitchen', items: [
      { to: '/kitchen/dashboard', label: 'Kitchen Display', icon: ChefHat },
    ]},
  ],
  accountant: [
    { heading: 'Finance', items: [
      { to: '/accountant/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/accountant/payments', label: 'Payments', icon: DollarSign },
      { to: '/accountant/expenses', label: 'Expenses', icon: Receipt },
      { to: '/accountant/deposits', label: 'Deposits & Refunds', icon: DollarSign },
      { to: '/manager/reports', label: 'Reports', icon: FileText },
    ]},
  ],
  maintenance: [
    { heading: 'Maintenance', items: [
      { to: '/maintenance/dashboard', label: 'Tickets', icon: Wrench },
      { to: '/maintenance/equipment', label: 'Equipment', icon: Wrench },
    ]},
  ],
  customer: [
    { heading: 'My Stay', items: [
      { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/customer/bookings', label: 'My Bookings', icon: CalendarCheck },
      { to: '/customer/invoices', label: 'Invoices', icon: FileText },
    ]},
    { heading: 'Services', items: [
      { to: '/customer/services', label: 'Services & Complaints', icon: Sparkles },
      { to: '/customer/reviews', label: 'Reviews', icon: Star },
      { to: '/customer/loyalty', label: 'Loyalty', icon: Gift },
    ]},
    { heading: 'Account', items: [
      { to: '/customer/profile', label: 'Profile', icon: Users },
    ]},
  ],
};

export default function Sidebar({ open, mobileOpen = false, variant = 'manager', onToggleCollapse }) {
  const { logout, user } = useAuth();
  const sections = SECTIONS_BY_VARIANT[variant] || SECTIONS_BY_VARIANT.manager;

  return (
    <aside
      className={[
        'fixed md:static inset-y-0 left-0 z-40 h-full flex flex-col shrink-0',
        'bg-navy dark:bg-darkCard text-white',
        'transition-all duration-300 ease-in-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0',
        open ? 'w-64' : 'w-[72px]',
      ].join(' ')}
    >
      {/* Brand */}
      <div className={`h-16 flex items-center border-b border-white/10 shrink-0 ${open ? 'px-6' : 'px-0 justify-center'}`}>
        {open ? (
          <span className="font-display text-xl whitespace-nowrap">
            Grand<span className="text-gold">Vista</span>
          </span>
        ) : (
          <span className="font-display text-xl text-gold">GV</span>
        )}
      </div>

      {/* User chip */}
      {open && user && (
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-goldLight flex items-center justify-center text-navy font-semibold text-sm shrink-0">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
            <p className="text-[11px] text-white/50 capitalize truncate">{user.role?.replace(/_/g, ' ')}</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {sections.map((section) => (
          <div key={section.heading}>
            {open && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                {section.heading}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={!open ? label : undefined}
                  className={({ isActive }) =>
                    [
                      'relative flex items-center gap-3 rounded-lg text-sm transition-all duration-200 whitespace-nowrap group',
                      open ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center',
                      isActive
                        ? 'bg-gold/15 text-gold font-medium'
                        : 'text-white/65 hover:bg-white/5 hover:text-white',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-gold" />}
                      <Icon size={18} className="shrink-0" />
                      {open && <span className="truncate">{label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={onToggleCollapse}
        className="hidden md:flex items-center justify-center gap-2 mx-3 mb-2 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition text-xs"
      >
        {open ? <><ChevronLeft size={14} /> Collapse</> : <ChevronRight size={14} />}
      </button>

      {/* Logout */}
      <button
        onClick={logout}
        className={`flex items-center gap-3 border-t border-white/10 text-white/65 hover:text-danger hover:bg-white/5 transition text-sm shrink-0 ${open ? 'px-6 py-4' : 'px-0 py-4 justify-center'}`}
      >
        <LogOut size={18} />
        {open && <span>Logout</span>}
      </button>
    </aside>
  );
}
