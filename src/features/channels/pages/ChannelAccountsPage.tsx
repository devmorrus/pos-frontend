import { useEffect, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import ProcurementOutletSelector from "../../procurement/components/ProcurementOutletSelector";
import { useProcurementOutletScope } from "../../procurement/hooks/useProcurementOutletScope";
import { getErrorMessage } from "../../../utils/errors";
import { createChannelAccount, getChannelAccounts, updateChannelAccount } from "../api/channelsApi";
import type { ChannelAccountDto } from "../types/channel";
import { getChannelAccountStatusClasses } from "../utils/formatters";

export default function ChannelAccountsPage() {
  const { ownerMode, activeOutlets, effectiveOutletId, selectedOutletId, setSelectedOutletId } =
    useProcurementOutletScope();
  const [accounts, setAccounts] = useState<ChannelAccountDto[]>([]);
  const [editing, setEditing] = useState<ChannelAccountDto | null>(null);
  const [name, setName] = useState("");
  const [channelName, setChannelName] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [defaultCommissionRate, setDefaultCommissionRate] = useState("20");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadAccounts() {
    if (!effectiveOutletId) {
      setAccounts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      setAccounts(await getChannelAccounts(effectiveOutletId));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat channel accounts."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAccounts();
  }, [effectiveOutletId]);

  function resetForm() {
    setEditing(null);
    setName("");
    setChannelName("");
    setMerchantId("");
    setDefaultCommissionRate("20");
    setIsActive(true);
  }

  function startEdit(account: ChannelAccountDto) {
    setEditing(account);
    setName(account.name);
    setChannelName(account.channelName);
    setMerchantId(account.merchantId);
    setDefaultCommissionRate(String(account.defaultCommissionRate));
    setIsActive(account.isActive);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!effectiveOutletId) {
      setError("Pilih outlet terlebih dahulu.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        outletId: effectiveOutletId,
        name,
        channelName,
        merchantId: merchantId.trim() || null,
        defaultCommissionRate: Number(defaultCommissionRate || 0),
        isActive,
      };

      if (editing) {
        await updateChannelAccount(editing.id, payload);
      } else {
        await createChannelAccount(payload);
      }

      resetForm();
      await loadAccounts();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal menyimpan channel account."));
    } finally {
      setIsSaving(false);
    }
  }

  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId;

  return (
    <ProtectedPageShell
      title="Channel Accounts"
      description="Kelola akun marketplace atau channel penjualan digital yang menjadi sumber settlement finansial."
    >
      <InlineAlert tone="error" message={error} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AppTableShell
          title="Daftar channel accounts"
          description={`${accounts.length} akun channel`}
          actions={
            <ProcurementOutletSelector
              ownerMode={ownerMode}
              value={selectedOutletId}
              onChange={setSelectedOutletId}
              outlets={activeOutlets}
            />
          }
        >
          {isLoading ? (
            <AppLoader label="Memuat channel accounts..." />
          ) : shouldShowOutletPrompt ? (
            <div className="p-6">
              <PagePlaceholder
                title="Pilih outlet terlebih dahulu"
                description="Owner perlu memilih outlet aktif untuk mengelola akun channel per cabang."
                status="Outlet required"
              />
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-6">
              <PagePlaceholder
                title="Belum ada channel account"
                description="Tambahkan akun channel pertama untuk mulai membuat settlement marketplace."
                status="Empty"
              />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  {["Nama", "Platform", "Merchant ID", "Komisi", "Status", "Aksi"].map((column) => (
                    <th
                      key={column}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{account.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{account.channelName}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{account.merchantId}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{account.defaultCommissionRate}%</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getChannelAccountStatusClasses(account.isActive)}`}>
                        {account.isActive ? "active" : "inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => startEdit(account)}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AppTableShell>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editing ? "Edit channel account" : "Tambah channel account"}
          </h3>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Nama akun</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Platform/channel</span>
              <input
                value={channelName}
                onChange={(event) => setChannelName(event.target.value)}
                placeholder="gofood / grabfood / shopeefood"
                className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Merchant ID</span>
              <input
                value={merchantId}
                onChange={(event) => setMerchantId(event.target.value)}
                className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Komisi default (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={defaultCommissionRate}
                onChange={(event) => setDefaultCommissionRate(event.target.value)}
                className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Akun channel aktif
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            {editing ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
              >
                Batal edit
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
            >
              {isSaving ? "Menyimpan..." : editing ? "Simpan perubahan" : "Tambah account"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedPageShell>
  );
}
