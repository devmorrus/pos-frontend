import { publicClient } from "../../../api/client";
import type {
  AuthSession,
  LoginRequest,
  RefreshTokenRequest,
  RevokeTokenRequest,
} from "../types/auth";

export function loginRequest(payload: LoginRequest) {
  return publicClient.post<AuthSession>("/api/auth/login", payload);
}

export function refreshTokenRequest(payload: RefreshTokenRequest) {
  return publicClient.post<AuthSession>("/api/auth/refresh", payload);
}

export async function revokeTokenRequest(payload: RevokeTokenRequest) {
  await publicClient.post<void>("/api/auth/revoke", payload);
}

export function registerOwnerRequest(payload: any) {
  return publicClient.post<AuthSession>("/api/auth/register-owner", payload);
}
