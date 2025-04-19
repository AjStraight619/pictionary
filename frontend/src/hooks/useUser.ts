import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/utils/config";

export type User = {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  gamesPlayed?: number;
  gamesWon?: number;
};

type ProfileUpdatePayload = {
  username?: string;
  profilePicture?: string;
};

type PasswordChangePayload = {
  currentPassword: string;
  newPassword: string;
};

export const useUser = () => {
  const queryClient = useQueryClient();

  // Get user query
  const query = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileUpdatePayload) => updateUserProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordChangePayload) => updateUserPassword(data),
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["user"] });
    },
  });

  return {
    // User data and query states
    user: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,

    // Profile update with its own states
    updateProfile: {
      mutate: updateProfileMutation.mutate,
      isLoading: updateProfileMutation.isPending,
      isError: updateProfileMutation.isError,
      error: updateProfileMutation.error,
    },

    // Password change with its own states
    changePassword: {
      mutate: changePasswordMutation.mutate,
      isLoading: changePasswordMutation.isPending,
      isError: changePasswordMutation.isError,
      error: changePasswordMutation.error,
    },

    // Logout with its own states
    logout: {
      mutate: logoutMutation.mutate,
      isLoading: logoutMutation.isPending,
      isError: logoutMutation.isError,
      error: logoutMutation.error,
    },
  };
};

// API Functions
const fetchUser = async (): Promise<User> => {
  const response = await fetch(`${API_URL}/auth/profile`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  return response.json();
};

const updateUserProfile = async (data: ProfileUpdatePayload): Promise<User> => {
  const response = await fetch(`${API_URL}/users/profile`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update profile");
  }

  return response.json();
};

const updateUserPassword = async (
  data: PasswordChangePayload
): Promise<void> => {
  const response = await fetch(`${API_URL}/users/password`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to change password");
  }
};

const logoutUser = async (): Promise<void> => {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to logout");
  }
};
