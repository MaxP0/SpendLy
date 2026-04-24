export type UserRole = "self_employed_vat" | "self_employed_no_vat" | "paye_side_income";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  business_name: string | null;
}

export interface User extends AuthUser {
  business_address: string | null;
  gdpr_consent_at: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
  business_name?: string | null;
  business_address?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  user: AuthUser;
}

export interface RefreshResponse {
  access_token: string;
  token_type: "bearer";
}
