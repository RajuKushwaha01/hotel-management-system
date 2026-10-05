import { useAuth } from '../../context/AuthContext';
import { ROLE_META } from '../../constants/roles';

const COLOR_CLASS = {
  gold: 'bg-gold/15 text-gold', blue: 'bg-accentBlue/15 text-accentBlue',
  purple: 'bg-accentPurple/15 text-accentPurple', green: 'bg-success/15 text-success',
};

// Small confirmation chip in the navbar — proves, at a glance, that the control
// system routed this person to their correct role, every session.
export default function RoleBadge() {
  const { user } = useAuth();
  if (!user) return null;

  const meta = ROLE_META[user.role] || { label: user.role, color: 'blue' };

  return (
    <span className={`hidden sm:inline-block text-[11px] font-medium px-2.5 py-1 rounded-full ${COLOR_CLASS[meta.color]}`}>
      {meta.label}
    </span>
  );
}
