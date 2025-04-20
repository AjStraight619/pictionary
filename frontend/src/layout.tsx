import { Outlet } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { useSession } from "@/providers/session-provider";
import { LogoutButton } from "./components/auth/logout-button";
import { Pencil } from "lucide-react";

const Layout = () => {
  const { isAuthenticated, user } = useSession();

  return (
    <main>
      {isAuthenticated && (
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-purple-400" />
              <span className="font-semibold">Pictionary Pals</span>
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm text-muted-foreground">
                  Hi, {user.username}
                </span>
              )}
              <LogoutButton />
            </div>
          </div>
        </header>
      )}
      <Outlet />
      <Toaster />
    </main>
  );
};

export default Layout;
