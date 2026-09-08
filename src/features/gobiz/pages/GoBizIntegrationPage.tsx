import { useEffect, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { formatDateTime } from "../../transactions/utils/formatters";
import { useOutlet } from "../../outlets/hooks/useOutlet";
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
import type {
  GoBizCatalogPreviewDto,
  GoBizCatalogSyncResultDto,
  GoBizDirectStatusDto,
  GoBizDirectTokenStatusDto,
  GoBizExternalCatalogDto,
  GoBizIntegrationLogDto,
  GoBizOrderInboxDto,
} from "../../accounting-integrations/types/gobiz";

export default function GoBizIntegrationPage() {
  const { selectedOutletId } = useOutlet();
  const [status, setStatus] = useState<GoBizDirectStatusDto | null>(null);
  const [externalCatalog, setExternalCatalog] = useState<GoBizExternalCatalogDto | null>(null);
  const [preview, setPreview] = useState<GoBizCatalogPreviewDto | null>(null);
  const [syncResult, setSyncResult] = useState<GoBizCatalogSyncResultDto | null>(null);
  const [logs, setLogs] = useState<GoBizIntegrationLogDto[]>([]);
  const [orders, setOrders] = useState<GoBizOrderInboxDto[]>([]);
  const [tokenStatus, setTokenStatus] = useState<GoBizDirectTokenStatusDto | null>(null);
  const [goBizOutletId, setGoBizOutletId] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

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
      const result = await connectGoBizDirect({ outletId: selectedOutletId, goBizOutletId: goBizOutletId.trim() });
      setStatus(result);
      setSuccessMessage("Outlet berhasil dihubungkan ke GoBiz direct integration sandbox.");
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
    setIsBusy(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await testGoBizDirectToken();
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

  return (
    <ProtectedPageShell
      title="Integrasi GoBiz Direct"
      description="Kelola direct integration sandbox GoFood: token, outlet mapping, preview catalog, sync, logs, dan inbox order."
    >
      <div className="space-y-6">
        <InlineAlert tone="success" message={successMessage} />
        <InlineAlert tone="error" message={error} />

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">GoBiz Developer</p>
                <h3 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">Direct Integration Sandbox</h3>
                <p className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                  Gunakan client credentials untuk sinkronisasi katalog GoFood, baca status outlet, dan pantau webhook order.
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
                      placeholder="G405270505"
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 transition focus:border-emerald-400 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                    />
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-950/30">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Environment</p>
                    <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{status?.environment ?? "Sandbox"}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-950/30">
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
                  <button type="button" onClick={() => void handleTestToken()} disabled={isBusy} className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-sky-800/40 dark:bg-sky-950/20 dark:text-sky-300">
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
