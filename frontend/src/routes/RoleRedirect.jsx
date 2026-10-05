import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../constants/roles';
import Spinner from '../components/ui/Spinner';

// The literal control point: every "get me to my dashboard" moment in the app — the
// post-login redirect, a bookmarked /dashboard link, a bare "/" hit while logged in —
// passes through here exactly once. There is no second place in the codebase that
// decides where a role lands; if you ever need to change a role's landing page,
// change ROLE_HOME in constants/roles.js and every entry point updates together.
export default function RoleRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={36} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={homeFor(user.role)} replace />;
}
