import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'unknown') {
    return (
      <div className="route-loader">
        <div className="loader-spinner" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
