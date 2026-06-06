import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, authReady, user, token } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (authReady && !isAuthenticated) {
      if (location.pathname === "/checkout") {
        toast.info("Please login before placing an order.");
      } else if (location.pathname === "/cart") {
        toast.info("Please login to continue.");
      } else if (location.pathname === "/my-orders") {
        toast.info("Please login to see your orders.");
      }
    }
  }, [authReady, isAuthenticated, location.pathname]);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--cream)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[var(--surface)] border-t-[var(--saffron)]" />
          <p className="text-sm text-[var(--muted)]">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("PROTECTED_ROUTE_REDIRECT: User not authenticated, redirecting to login");
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (adminOnly && !isAdmin) {
    console.log("ADMIN_ROUTE_REDIRECT: User not admin, redirecting to home");
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
