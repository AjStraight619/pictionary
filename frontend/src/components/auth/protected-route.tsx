import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "@/providers/session-provider";

type ProtectedRouteProps = {
  authRequired?: boolean; // If true, redirects to /sign-in when not authenticated
  guestOnly?: boolean; // If true, redirects to / when authenticated (for sign-in/sign-up pages)
};

export function ProtectedRoute({
  authRequired = false,
  guestOnly = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useSession();
  const location = useLocation();

  // Wait for auth check to complete
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  // Handle auth required routes
  if (authRequired && !isAuthenticated) {
    // Redirect to sign-in and remember where they were trying to go
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Handle guest-only routes
  if (guestOnly && isAuthenticated) {
    // Redirect to home if they're already logged in
    return <Navigate to="/" replace />;
  }

  // Allow the component to render
  return <Outlet />;
}
