import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import PageLoader from '../components/ui/Spinner.jsx';

export default function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (user) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
