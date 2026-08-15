import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function GuestRoute() {
  const { user, loading } = useAuth();

  // While the session is being restored, render nothing: the page's own
  // centered loader is the only spinner shown while loading.
  if (loading) return null;

  if (user) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
