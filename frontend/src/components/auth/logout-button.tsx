import { Button } from "@/components/ui/button";
import { useSession } from "@/providers/session-provider";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

type LogoutButtonProps = {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
};

export function LogoutButton({
  variant = "ghost",
  size = "default",
  showIcon = true,
}: LogoutButtonProps) {
  const { logout } = useSession();

  const handleLogout = () => {
    try {
      logout();
    } catch {
      toast.error("Failed to logout");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      className="gap-2"
    >
      {showIcon && <LogOut className="h-4 w-4" />}
      Logout
    </Button>
  );
}
