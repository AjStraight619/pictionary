import { Outlet } from "react-router";
import { Toaster } from "@/components/ui/sonner";

const Layout = () => {
  return (
    <main className="sketchbook min-h-screen">
      <Outlet />
      <Toaster />
    </main>
  );
};

export default Layout;
