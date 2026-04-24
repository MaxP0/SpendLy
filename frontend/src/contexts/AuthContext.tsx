import { createContext, useContext, useEffect, useState } from "react";

import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setAuthTokens,
} from "@/api/client";
import { getMe, login as loginRequest, logout as logoutRequest, register as registerRequest, refreshToken } from "@/api/auth";
import type { AuthResponse, RegisterRequest, User } from "@/types/api";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (payload: RegisterRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(getAccessToken());
  const [isLoading, setIsLoading] = useState(true);

  const applyAuthResponse = async (response: AuthResponse) => {
    setAuthTokens(response.access_token, response.refresh_token);
    setAccessTokenState(response.access_token);
    const currentUser = await getMe();
    setUser(currentUser);
    return response;
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const storedAccessToken = getAccessToken();
        const storedRefreshToken = getRefreshToken();

        if (!storedAccessToken && !storedRefreshToken) {
          return;
        }

        if (!storedAccessToken && storedRefreshToken) {
          const refreshed = await refreshToken();
          setAccessToken(refreshed.access_token);
          setAccessTokenState(refreshed.access_token);
        }

        const currentUser = await getMe();
        if (!cancelled) {
          setUser(currentUser);
          setAccessTokenState(getAccessToken());
        }
      } catch {
        clearAuthTokens();
        if (!cancelled) {
          setUser(null);
          setAccessTokenState(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    return applyAuthResponse(response);
  };

  const register = async (payload: RegisterRequest) => {
    const response = await registerRequest(payload);
    return applyAuthResponse(response);
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      clearAuthTokens();
      setAccessTokenState(null);
      setUser(null);
    }
  };

  const value: AuthContextValue = {
    user,
    accessToken,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
