import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../constants/roles';
import Spinner from '../components/ui/Spinner';

/**
 * allowedRoles = [] or omitted -> any logged-in user allowed
 * allowedRoles = ['super_admin', 'hotel_manager'] -> only those roles allowed
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={40} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={homeFor(user.role)} replace />; // send them home, not to a blank "access denied"
  }

  return <Outlet />;
}
