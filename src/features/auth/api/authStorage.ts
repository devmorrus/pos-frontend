import type { AuthSession } from "../types/auth";

const STORAGE_KEY = "morruspos.auth";

export function getStoredAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;

    if (
      typeof parsed.accessToken !== "string" ||
      typeof parsed.refreshToken !== "string" ||
      typeof parsed.userId !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.role !== "string"
    ) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      userId: parsed.userId,
      name: parsed.name,
      role: parsed.role,
      outletId: parsed.outletId ?? null,
      permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
      businessId: parsed.businessId ?? null,
      subscriptionStatus: parsed.subscriptionStatus ?? null,
      trialEndDate: parsed.trialEndDate ?? null,
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function setStoredAuthSession(session: AuthSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAuthSession() {
  localStorage.removeItem(STORAGE_KEY);
}
