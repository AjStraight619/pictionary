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
  const { isAuthenticated, isLoading, error, refresh } = useSession();
  const location = useLocation();

  // Wait for auth check to complete
  if (isLoading) {
    return (
      <div role="status" className="flex justify-center items-center min-h-screen">
        <div aria-hidden="true" className="animate-spin motion-reduce:animate-none rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="sr-only">Loading your session…</span>
      </div>
    );
  }

  if (error && !isAuthenticated) {
    return (
      <div role="alert" className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold">Couldn’t load your session</h1>
        <p className="text-muted-foreground">Check your connection and try again.</p>
        <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={() => void refresh().catch(() => undefined)}>
          Try again
        </button>
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
