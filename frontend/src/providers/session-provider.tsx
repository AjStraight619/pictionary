import { ReactNode, createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/utils/config";

export type User = {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  gamesPlayed?: number;
  gamesWon?: number;
  totalScore?: number;
  highestScore?: number;
};

type SessionContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: unknown;
  refresh: () => Promise<unknown>;
  logout: () => void;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Fetch user profile
  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/auth/profile`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) return null;
        throw new Error("Failed to fetch user profile");
      }

      return response.json() as Promise<User>;
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to logout");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["user"], null);
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const isLoading = userQuery.isPending || logoutMutation.isPending;

  const value: SessionContextType = {
    user: userQuery.data || null,
    isAuthenticated: !!userQuery.data,
    isLoading,
    error: userQuery.error || logoutMutation.error,
    refresh: userQuery.refetch,
    logout: () => logoutMutation.mutate(),
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);

  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  return context;
}
