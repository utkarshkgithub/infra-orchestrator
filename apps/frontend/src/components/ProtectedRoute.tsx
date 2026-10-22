import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  // The session cookie is the only source of truth. While the check runs we
  // must not render the protected pages, otherwise a stale "hasSession" hint
  // in localStorage flashes the dashboard of a user who is not logged in.
  if (status === "unknown") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-d-bg">
        <div className="w-6 h-6 border-2 border-neutral-200 dark:border-d-200 border-t-black dark:border-t-d-fg rounded-full animate-spin-fast" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
