import axios from "axios";

import { apiClient, getRefreshToken } from "./client";
import type {
  AuthResponse,
  LoginRequest,
  RefreshResponse,
  RegisterRequest,
  User,
} from "@/types/api";

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>("/auth/login", { email, password } satisfies LoginRequest);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to log in"));
  }
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>("/auth/register", payload);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to register"));
  }
}

export async function refreshToken(): Promise<RefreshResponse> {
  try {
    const refreshTokenValue = getRefreshToken();
    if (!refreshTokenValue) {
      throw new Error("Missing refresh token");
    }

    const response = await apiClient.post<RefreshResponse>("/auth/refresh", {
      refresh_token: refreshTokenValue,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to refresh session"));
  }
}

export async function getMe(): Promise<User> {
  try {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to load profile"));
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to log out"));
  }
}
