export type AppApiError = {
  status: number;
  message: string;
  details?: unknown;
};

export type RequestOptions = Omit<RequestInit, "body" | "method"> & {
  auth?: boolean;
  body?: unknown;
  headers?: HeadersInit;
  responseType?: "json" | "text" | "blob";
};

export type SessionBridge = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  refreshSession: () => Promise<string | null>;
  handleUnauthorized: () => void;
};
