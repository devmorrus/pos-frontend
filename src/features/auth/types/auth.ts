export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  userId: string;
  name: string;
  role: string;
  outletId: string | null;
  permissions: string[];
  businessId: string | null;
  subscriptionStatus: string | null;
  trialEndDate: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type RevokeTokenRequest = {
  refreshToken: string;
};

export type LoginFormValues = LoginRequest;

export type AuthContextValue = {
  session: AuthSession | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (values: LoginFormValues) => Promise<AuthSession>;
  logout: () => Promise<void>;
  setSession: (session: AuthSession | null) => void;
  clearSession: () => void;
  refreshSession: () => Promise<string | null>;
};
