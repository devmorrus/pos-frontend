import { useEffect, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { formatDateTime } from "../../transactions/utils/formatters";
import { useOutlet } from "../../outlets/hooks/useOutlet";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  connectGoBizDirect,
  disconnectGoBizDirect,
  getGoBizDirectStatus,
  getGoBizExternalCatalog,
  getGoBizLogs,
  getGoBizOrders,
  previewGoBizCatalog,
  syncGoBizCatalog,
  testGoBizDirectToken,
} from "../../accounting-integrations/api/gobizDirectApi";
import {
  getGoBizConfig,
  getGoBizConfigDebug,
  saveGoBizConfig,
} from "../../accounting-integrations/api/gobizConfigApi";
import type {
  GoBizCatalogPreviewDto,
  GoBizCatalogSyncResultDto,
  GoBizClientConfigDto,
  GoBizConfigDebugDto,
  GoBizDirectStatusDto,
  GoBizDirectTokenStatusDto,
  GoBizExternalCatalogDto,
  GoBizIntegrationLogDto,
  GoBizOrderInboxDto,
} from "../../accounting-integrations/types/gobiz";

const DEFAULT_URLS = {
  Sandbox: {
    authorizationUrl: "https://integration-goauth.gojekapi.com/oauth2/auth",
    tokenUrl: "https://integration-goauth.gojekapi.com/oauth2/token",
    apiBaseUrl: "https://api.partner-sandbox.gobiz.co.id",
  },
  Production: {
    authorizationUrl: "https://integration-goauth.gojekapi.com/oauth2/auth",
    tokenUrl: "https://integration-goauth.gojekapi.com/oauth2/token",
    apiBaseUrl: "https://api.gobiz.co.id",
  },
};

export default function GoBizIntegrationPage() {
  const { selectedOutletId } = useOutlet();
  const { session } = useAuth();
  const businessId = session?.businessId ?? null;
  const canManageConfig = session?.role === "Owner" || session?.role === "Admin";

  const [status, setStatus] = useState<GoBizDirectStatusDto | null>(null);
  const [externalCatalog, setExternalCatalog] = useState<GoBizExternalCatalogDto | null>(null);
  const [preview, setPreview] = useState<GoBizCatalogPreviewDto | null>(null);
  const [syncResult, setSyncResult] = useState<GoBizCatalogSyncResultDto | null>(null);
  const [logs, setLogs] = useState<GoBizIntegrationLogDto[]>([]);
  const [orders, setOrders] = useState<GoBizOrderInboxDto[]>([]);
  const [tokenStatus, setTokenStatus] = useState<GoBizDirectTokenStatusDto | null>(null);
  const [goBizOutletId, setGoBizOutletId] = useState("");
  const [partnerIdOverride, setPartnerIdOverride] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  // Opsi B: kredensial per-Business
  const [config, setConfig] = useState<GoBizClientConfigDto | null>(null);
  const [debug, setDebug] = useState<GoBizConfigDebugDto | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const [form, setForm] = useState({
    environment: "Sandbox",
    clientId: "",
    clientSecret: "",
    partnerId: "",
    authorizationUrl: DEFAULT_URLS.Sandbox.authorizationUrl,
    tokenUrl: DEFAULT_URLS.Sandbox.tokenUrl,
    apiBaseUrl: DEFAULT_URLS.Sandbox.apiBaseUrl,
    redirectUri: "",
    scope: "gofood:catalog:write gofood:catalog:read gofood:order:write gofood:order:read gofood:outlet:write promo:food_promo:read promo:food_promo:write",
    webhookSecret: "",
    isActive: true,
  });

  function setField(key: keyof typeof form, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "environment" && typeof value === "string") {
        const preset = DEFAULT_URLS[value as keyof typeof DEFAULT_URLS];
        if (preset) {
          next.authorizationUrl = preset.authorizationUrl;
          next.tokenUrl = preset.tokenUrl;
          next.apiBaseUrl = preset.apiBaseUrl;
        }
      }
      return next;
    });
  }

  useEffect(() => {
    async function loadConfig() {
      if (!businessId || !canManageConfig) return;
      setIsConfigLoading(true);
      try {
        const [cfg, dbg] = await Promise.all([
          getGoBizConfig(businessId).catch(() => null),
          getGoBizConfigDebug({ businessId }).catch(() => null),
        ]);
        if (cfg) {
          setConfig(cfg);
          setForm((prev) => ({
            ...prev,
            environment: cfg.environment || "Sandbox",
            clientId: cfg.clientId || "",
            clientSecret: "",
            partnerId: cfg.partnerId || "",
            authorizationUrl: cfg.authorizationUrl || prev.authorizationUrl,
            tokenUrl: cfg.tokenUrl || prev.tokenUrl,
            apiBaseUrl: cfg.apiBaseUrl || prev.apiBaseUrl,
            redirectUri: cfg.redirectUri || "",
            scope: cfg.scope || prev.scope,
            webhookSecret: "",
            isActive: cfg.isActive,
          }));
          if (!partnerIdOverride && cfg.partnerId) setPartnerIdOverride(cfg.partnerId);
        }
        if (dbg) setDebug(dbg);
      } catch {
        // abaikan, status outlet tetap dimuat
      } finally {
        setIsConfigLoading(false);
      }
    }
    void loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  useEffect(() => {
    async function loadStatus() {
      if (!selectedOutletId) {
        setStatus(null);
        setExternalCatalog(null);
        setPreview(null);
        setLogs([]);
        setOrders([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const [statusResult, logsResult, ordersResult] = await Promise.all([
          getGoBizDirectStatus(selectedOutletId),
          getGoBizLogs(selectedOutletId).catch(() => []),
          getGoBizOrders(selectedOutletId).catch(() => []),
        ]);
        setStatus(statusResult);
        setGoBizOutletId(statusResult.goBizOutletId ?? "");
        setLogs(logsResult);
        setOrders(ordersResult);
      } catch (requestError) {
        setStatus(null);
        setError(getErrorMessage(requestError, "Gagal memuat status GoBiz direct."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadStatus();
  }, [selectedOutletId]);

  async function refreshAll() {
    if (!selectedOutletId) return;

    const [statusResult, logsResult, ordersResult] = await Promise.all([
      getGoBizDirectStatus(selectedOutletId),
      getGoBizLogs(selectedOutletId).catch(() => []),
      getGoBizOrders(selectedOutletId).catch(() => []),
    ]);
    setStatus(statusResult);
    setLogs(logsResult);
    setOrders(ordersResult);
  }

  async function handleSaveConfig() {
    if (!businessId) {
      setError("Business tidak terdeteksi dari sesi login.");
      return;
    }
    if (!form.clientId.trim() || !form.partnerId.trim()) {
      setError("Client ID dan Partner ID wajib diisi.");
      return;
    }
    if (!config && !form.clientSecret.trim()) {
      setError("Client Secret wajib diisi untuk config baru.");
      return;
    }
    setIsConfigSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await saveGoBizConfig({
        businessId,
        environment: form.environment,
        clientId: form.clientId.trim(),
        clientSecret: form.clientSecret.trim() ? form.clientSecret.trim() : null,
        partnerId: form.partnerId.trim(),
        authorizationUrl: form.authorizationUrl.trim(),
        tokenUrl: form.tokenUrl.trim(),
        apiBaseUrl: form.apiBaseUrl.trim(),
        redirectUri: form.redirectUri.trim(),
        scope: form.scope.trim(),
        userType: "merchant",
        prompt: "login",
        webhookSecret: form.webhookSecret.trim() ? form.webhookSecret.trim() : null,
        isActive: form.isActive,
      });
      setConfig(result);
      setForm((prev) => ({ ...prev, clientSecret: "", webhookSecret: "" }));
      const dbg = await getGoBizConfigDebug({ businessId }).catch(() => null);
      if (dbg) setDebug(dbg);
      setSuccessMessage(`Kredensial tersimpan (sumber: ${result.source}). Client baru tinggal isi form ini.`);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal menyimpan kredensial GoBiz."));
    } finally {
      setIsConfigSaving(false);
    }
  }

  async function handleConnect() {
    if (!selectedOutletId) {
      setError("Pilih outlet terlebih dahulu sebelum menghubungkan GoBiz.");
      return;
    }

    if (!goBizOutletId.trim()) {
      setError("GoBiz Outlet ID wajib diisi.");
      return;
    }

    setIsConnecting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await connectGoBizDirect({
        outletId: selectedOutletId,
        goBizOutletId: goBizOutletId.trim(),
        partnerId: partnerIdOverride.trim() ? partnerIdOverride.trim() : null,
      });
      setStatus(result);
      const env = result.environment || form.environment || "Sandbox";
      setSuccessMessage(`Outlet berhasil dihubungkan ke GoBiz direct integration (${env}).`);
      await refreshAll();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal menghubungkan GoBiz direct."));
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!selectedOutletId) {
      setError("Pilih outlet terlebih dahulu sebelum memutuskan koneksi GoBiz.");
      return;
    }

    setIsBusy(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await disconnectGoBizDirect(selectedOutletId);
      const nextStatus = await getGoBizDirectStatus(selectedOutletId);
      setStatus(nextStatus);
      setSuccessMessage("Koneksi GoBiz direct berhasil dinonaktifkan untuk outlet ini.");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memutuskan koneksi GoBiz."));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleTestToken() {
    if (!selectedOutletId) {
      setError("Pilih outlet terlebih dahulu untuk test token.");
      return;
    }
    setIsBusy(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await testGoBizDirectToken(selectedOutletId);
      setTokenStatus(result);
      setSuccessMessage(`Token GoBiz direct valid hingga ${formatDateTime(result.expiresAtUtc)}.`);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal mengambil token GoBiz direct."));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleExternalCatalog() {
    if (!selectedOutletId) return;
    setIsBusy(true);
    setError(null);
    try {
      setExternalCatalog(await getGoBizExternalCatalog(selectedOutletId));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat katalog GoBiz eksternal."));
    } finally {
      setIsBusy(false);
    }
  }

  async function handlePreviewCatalog() {
    if (!selectedOutletId) return;
    setIsBusy(true);
    setError(null);
    try {
      setPreview(await previewGoBizCatalog(selectedOutletId));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal membuat preview katalog GoBiz."));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSyncCatalog() {
    if (!selectedOutletId) return;
    setIsSyncing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await syncGoBizCatalog(selectedOutletId);
      setSyncResult(result);
      setSuccessMessage(result.message);
      await refreshAll();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal sinkronisasi katalog GoBiz."));
    } finally {
      setIsSyncing(false);
    }
  }

  const envLabel = status?.environment ?? form.environment ?? "Sandbox";
  const inputCls =
    "mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 transition focus:border-emerald-400 dark:border-gray-700 dark:bg-gray-950 dark:text-white";

  return (
    <ProtectedPageShell
      title="Integrasi GoBiz Direct"
      description={`Kelola direct integration GoFood per-client: kredensial, token, outlet mapping, preview catalog, sync, logs, dan inbox order. Sumber config aktif: ${debug?.source ?? config?.source ?? "-"}.`}
    >
      <div className="space-y-6">
        <InlineAlert tone="success" message={successMessage} />
        <InlineAlert tone="error" message={error} />

        {canManageConfig && businessId ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">Opsi B — Kredensial per Client</p>
                <h3 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">Kredensial GoBiz Client</h3>
                <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  Client baru tinggal isi form ini + Save. Tanpa edit appsettings, tanpa redeploy.
                  Kosongkan Client Secret / Webhook Secret jika tidak ingin mengubahnya.
                </p>
              </div>
              <div className="rounded-full bg-gray-100 px-4 py-1.5 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {isConfigLoading ? "Loading" : `Source: ${debug?.source ?? config?.source ?? "Belum ada"}`}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-200">Environment</span>
                <select value={form.environment} onChange={(e) => setField("environment", e.target.value)} className={inputCls}>
                  <option value="Sandbox">Sandbox</option>
                  <option value="Production">Production</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-200">Aktif</span>
                <select
                  value={form.isActive ? "true" : "false"}
                  onChange={(e) => setField("isActive", e.target.value === "true")}
                  className={inputCls}
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-200">Client ID *</span>
                <input value={form.clientId} onChange={(e) => setField("clientId", e.target.value)} placeholder="cth: fBaVFfEhr4bTWg5G" className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  Client Secret {config ? "(kosongkan = tidak diubah)" : "*"}
                </span>
                <input type="password" value={form.clientSecret} onChange={(e) => setField("clientSecret", e.target.value)} placeholder={config?.hasClientSecret ? "•••••••• (tersimpan)" : "isi client secret"} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-200">Partner ID *</span>
                <input value={form.partnerId} onChange={(e) => setField("partnerId", e.target.value)} placeholder="cth: 0fff2ff8-..." className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-200">Webhook Secret (opsional)</span>
                <input type="password" value={form.webhookSecret} onChange={(e) => setField("webhookSecret", e.target.value)} placeholder={config?.hasWebhookSecret ? "•••••••• (tersimpan)" : "untuk verifikasi webhook"} className={inputCls} />
              </label>
              <label className="block text-sm md:col-span-2">
                <span className="font-medium text-gray-700 dark:text-gray-200">Redirect URI *</span>
                <input value={form.redirectUri} onChange={(e) => setField("redirectUri", e.target.value)} placeholder="https://domain-client/api/gobiz/callback" className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-200">Authorization URL</span>
                <input value={form.authorizationUrl} onChange={(e) => setField("authorizationUrl", e.target.value)} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-200">Token URL</span>
                <input value={form.tokenUrl} onChange={(e) => setField("tokenUrl", e.target.value)} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-200">API Base URL</span>
                <input value={form.apiBaseUrl} onChange={(e) => setField("apiBaseUrl", e.target.value)} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-200">Scope</span>
                <input value={form.scope} onChange={(e) => setField("scope", e.target.value)} className={inputCls} />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleSaveConfig()}
                disabled={isConfigSaving}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConfigSaving ? "Menyimpan..." : "Simpan Kredensial"}
              </button>
              {debug ? (
                <span className="self-center text-xs text-gray-500">
                  Debug: ClientID {debug.clientIdConfigured ? "✓" : "✗"} · Secret {debug.clientSecretConfigured ? "✓" : "✗"} · Partner {debug.partnerIdConfigured ? "✓" : "✗"} · Webhook {debug.webhookSecretConfigured ? "✓" : "✗"}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">GoBiz Developer</p>
                <h3 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">Direct Integration ({envLabel})</h3>
                <p className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                  Gunakan client credentials per-Business untuk sinkronisasi katalog GoFood, baca status outlet, dan pantau webhook order.
                </p>
              </div>
              <div className={`rounded-full px-4 py-1.5 text-xs font-bold ${
                status?.isConnected && status.isActive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
              }`}>
                {isLoading ? "Loading" : status?.isConnected && status.isActive ? "Connected" : "Not Connected"}
              </div>
            </div>

            {!selectedOutletId ? (
              <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-700/40 dark:bg-amber-950/20 dark:text-amber-200">
                Pilih outlet aktif terlebih dahulu.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-950/30">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Outlet Id</p>
                    <p className="mt-2 break-all text-sm font-medium text-gray-900 dark:text-white">{selectedOutletId}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-950/30">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">GoBiz Outlet ID</p>
                    <input
                      value={goBizOutletId}
                      onChange={(event) => setGoBizOutletId(event.target.value)}
                      placeholder={envLabel === "Production" ? "ID outlet GoFood production" : "cth: G405270505 (sandbox)"}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 transition focus:border-emerald-400 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                    />
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-950/30">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Partner ID (opsional, default dari kredensial)</p>
                    <input
                      value={partnerIdOverride}
                      onChange={(event) => setPartnerIdOverride(event.target.value)}
                      placeholder={form.partnerId || "default dari kredensial client"}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 transition focus:border-emerald-400 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                    />
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-950/30">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Environment</p>
                    <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{status?.environment ?? envLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-950/30 sm:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Last Sync</p>
                    <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      {status?.lastCatalogSyncedAtUtc ? formatDateTime(status.lastCatalogSyncedAtUtc) : "Belum pernah sync"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => void handleConnect()} disabled={!selectedOutletId || isConnecting || isBusy} className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-60">
                    {isConnecting ? "Menghubungkan..." : "Connect Direct"}
                  </button>
                  <button type="button" onClick={() => void handleDisconnect()} disabled={!selectedOutletId || !status?.isConnected || isBusy} className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800/40 dark:bg-rose-950/20 dark:text-rose-300">
                    Disconnect
                  </button>
                  <button type="button" onClick={() => void handleTestToken()} disabled={isBusy || !selectedOutletId} className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-sky-800/40 dark:bg-sky-950/20 dark:text-sky-300">
                    Test Token
                  </button>
                  <button type="button" onClick={() => void handleExternalCatalog()} disabled={isBusy} className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                    Get Catalog
                  </button>
                  <button type="button" onClick={() => void handlePreviewCatalog()} disabled={isBusy} className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-violet-800/40 dark:bg-violet-950/20 dark:text-violet-300">
                    Preview Sync
                  </button>
                  <button type="button" onClick={() => void handleSyncCatalog()} disabled={isSyncing || isBusy} className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300">
                    {isSyncing ? "Syncing..." : "Sync Catalog"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white">Status Operasional</h3>
            <div className="mt-4 space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Token</p>
                <p className="mt-2">{tokenStatus ? `Valid sampai ${formatDateTime(tokenStatus.expiresAtUtc)}` : "Belum dites"}</p>
                <p className="mt-1 text-xs text-gray-500">Scope: {tokenStatus?.scope ?? status?.lastCatalogSyncStatus ?? "-"}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Webhook</p>
                <p className="mt-2">{status?.lastWebhookAtUtc ? `Terakhir diterima ${formatDateTime(status.lastWebhookAtUtc)}` : "Belum ada webhook masuk"}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Sync Result</p>
                <p className="mt-2">{syncResult ? syncResult.message : "Belum ada hasil sinkronisasi"}</p>
                <p className="mt-1 text-xs text-gray-500">Category: {syncResult?.categoryCount ?? 0} | Item: {syncResult?.itemCount ?? 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">External Catalog</h3>
            <pre className="mt-4 max-h-96 overflow-auto rounded-2xl bg-gray-950 p-4 text-xs text-gray-100">
              {externalCatalog ? JSON.stringify(externalCatalog.catalog, null, 2) : "Belum dimuat"}
            </pre>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Preview Sync</h3>
            <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <p>Kategori: {preview?.categoryCount ?? 0}</p>
              <p>Item: {preview?.itemCount ?? 0}</p>
              <p>Validation:</p>
              <ul className="list-disc pl-5">
                {(preview?.validationErrors ?? []).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <pre className="mt-4 max-h-80 overflow-auto rounded-2xl bg-gray-950 p-4 text-xs text-gray-100">
              {preview ? JSON.stringify(preview.payload, null, 2) : "Belum ada preview"}
            </pre>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Webhook Orders</h3>
            <div className="mt-4 space-y-3">
              {orders.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada order webhook.</p>
              ) : orders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-gray-200 p-4 text-sm dark:border-gray-700">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-900 dark:text-white">{order.goBizOrderId}</p>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">{order.status}</span>
                  </div>
                  <p className="mt-2 text-gray-500">Event: {order.eventType}</p>
                  <p className="text-gray-500">Received: {formatDateTime(order.receivedAtUtc)}</p>
                  {order.errorMessage ? <p className="mt-2 text-rose-600">{order.errorMessage}</p> : null}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Integration Logs</h3>
            <div className="mt-4 space-y-3">
              {logs.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada log integrasi.</p>
              ) : logs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-gray-200 p-4 text-sm dark:border-gray-700">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-900 dark:text-white">{log.serviceName}</p>
                    <span className={`rounded-full px-3 py-1 text-xs ${log.isSuccess ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"}`}>
                      {log.isSuccess ? "Success" : "Failed"}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-500">Status: {log.statusCode ?? "-"}</p>
                  <p className="text-gray-500">{formatDateTime(log.createdAt)}</p>
                  {log.errorMessage ? <p className="mt-2 text-rose-600">{log.errorMessage}</p> : null}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </ProtectedPageShell>
  );
}
