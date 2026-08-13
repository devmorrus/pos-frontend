import { API_BASE_URL } from "./config";
import type { AppApiError, RequestOptions, SessionBridge } from "./types";

const jsonHeaders = {
  "Content-Type": "application/json",
};

let sessionBridge: SessionBridge = {
  getAccessToken: () => null,
  getRefreshToken: () => null,
  refreshSession: async () => null,
  handleUnauthorized: () => undefined,
};

function normalizeError(status: number, payload: unknown): AppApiError {
  if (payload && typeof payload === "object") {
    const maybePayload = payload as Record<string, unknown>;
    const message =
      typeof maybePayload.message === "string"
        ? maybePayload.message
        : typeof maybePayload.error === "string"
          ? maybePayload.error
        : typeof maybePayload.title === "string"
          ? maybePayload.title
          : "Terjadi kesalahan saat memproses permintaan.";

    return {
      status,
      message,
      details: maybePayload,
    };
  }

  return {
    status,
    message: "Terjadi kesalahan saat memproses permintaan.",
    details: payload,
  };
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  if (contentType.includes("text/")) {
    return response.text();
  }

  return null;
}

function buildUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function executeRequest<T>(
  path: string,
  method: string,
  options: RequestOptions = {},
  hasRetried = false
): Promise<T> {
  const { auth = true, body, headers, ...rest } = options;
  const mergedHeaders = new Headers(headers ?? {});

  const isFormData = body instanceof FormData;

  if (body !== undefined && !mergedHeaders.has("Content-Type") && !isFormData) {
    Object.entries(jsonHeaders).forEach(([key, value]) => mergedHeaders.set(key, value));
  }

  if (auth) {
    const accessToken = sessionBridge.getAccessToken();
    if (accessToken) {
      mergedHeaders.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(buildUrl(path), {
    ...rest,
    method,
    headers: mergedHeaders,
    body:
      body !== undefined
        ? isFormData
          ? body
          : JSON.stringify(body)
        : undefined,
  });

  if (response.status === 401 && auth && !hasRetried && sessionBridge.getRefreshToken()) {
    const refreshedAccessToken = await sessionBridge.refreshSession();

    if (refreshedAccessToken) {
      return executeRequest<T>(path, method, options, true);
    }

    sessionBridge.handleUnauthorized();
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw normalizeError(response.status, payload);
  }

  return payload as T;
}

export function configureSessionBridge(bridge: SessionBridge) {
  sessionBridge = bridge;
}

export const publicClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, "auth">) =>
    executeRequest<T>(path, "GET", { ...options, auth: false }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "auth" | "body">) =>
    executeRequest<T>(path, "POST", { ...options, auth: false, body }),
};

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => executeRequest<T>(path, "GET", options),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    executeRequest<T>(path, "POST", { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    executeRequest<T>(path, "PUT", { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    executeRequest<T>(path, "PATCH", { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    executeRequest<T>(path, "DELETE", options),
};
