"use client"

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  username: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on mount
    const authToken = localStorage.getItem("auth-token");
    const authUser = localStorage.getItem("auth-user");

    if (authToken && authUser) {
      try {
        const userData = JSON.parse(authUser);
        setUser(userData);
      } catch (error) {
        console.error("Failed to parse auth user:", error);
        // Clear invalid auth data
        localStorage.removeItem("auth-token");
        localStorage.removeItem("auth-user");
      }
    }

    setIsLoading(false);
  }, []);

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem("auth-token");
    localStorage.removeItem("auth-user");
    localStorage.removeItem("remember-me");

    // Clear cookie
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";

    // Reset state
    setUser(null);

    // Redirect to login
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}