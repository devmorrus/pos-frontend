import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { getOutlets } from "../../outlets/api/outletsApi";
import type { OutletDto } from "../../outlets/types/outlet";
import {
  getCapabilityConfiguration,
  getCapabilityHistory,
  getIndustryProfiles,
  updateBusinessCapability,
  updateIndustryProfile,
  updateOutletCapability,
} from "../api/capabilityApi";
import { useCapabilities } from "../hooks/useCapabilities";
import type {
  CapabilityChangeLog,
  CapabilitySnapshot,
  EffectiveCapability,
  IndustryProfile,
} from "../types/capability";
import { useSearchParams } from "react-router";

function stateLabel(value: boolean | null) {
  return value === null ? "Inherit" : value ? "Aktif" : "Nonaktif";
}

export default function CapabilitySettingsPage() {
  const { session } = useAuth();
  const { reloadCapabilities } = useCapabilities();
  const [searchParams] = useSearchParams();
  const [snapshot, setSnapshot] = useState<CapabilitySnapshot | null>(null);
  const [profiles, setProfiles] = useState<IndustryProfile[]>([]);
  const [outlets, setOutlets] = useState<OutletDto[]>([]);
  const [history, setHistory] = useState<CapabilityChangeLog[]>([]);
  const [outletId, setOutletId] = useState<string>(() => searchParams.get("outletId") ?? "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const canEdit = session?.role === "Owner";

  async function load(targetOutletId = outletId) {
    setLoading(true);
    setError(null);
    try {
      const [configuration, nextProfiles, nextOutlets, nextHistory] = await Promise.all([
        getCapabilityConfiguration(targetOutletId || null),
        getIndustryProfiles(),
        getOutlets(),
        getCapabilityHistory(30),
      ]);
      setSnapshot(configuration);
      setProfiles(nextProfiles);
      setOutlets(nextOutlets.filter((x) => x.isActive));
      setHistory(nextHistory);
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Gagal memuat konfigurasi capability.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(searchParams.get("outletId") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const groups = new Map<string, EffectiveCapability[]>();
    for (const capability of snapshot?.capabilities ?? []) {
      const list = groups.get(capability.module) ?? [];
      list.push(capability);
      groups.set(capability.module, list);
    }
    return [...groups.entries()];
  }, [snapshot]);

  async function changeCapability(capability: EffectiveCapability, enabled: boolean | null) {
    if (!snapshot || !canEdit) return;
    if (enabled === false && !reason.trim()) {
      setError("Alasan wajib diisi saat menonaktifkan capability.");
      return;
    }
    setSavingCode(capability.code);
    setError(null);
    try {
      const next = outletId
        ? await updateOutletCapability(outletId, snapshot.revision, reason, [{ code: capability.code, enabled }])
        : await updateBusinessCapability(snapshot.revision, reason, [{ code: capability.code, enabled }]);
      setSnapshot(next);
      setHistory(await getCapabilityHistory(30));
      await reloadCapabilities();
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Gagal menyimpan capability.");
      await load(outletId);
    } finally {
      setSavingCode(null);
    }
  }

  async function changeProfile(profileCode: string) {
    if (!snapshot || !canEdit || profileCode === snapshot.industryProfile.code) return;
    setSavingCode("profile");
    try {
      const next = await updateIndustryProfile(profileCode, snapshot.revision, reason);
      setSnapshot(next);
      setHistory(await getCapabilityHistory(30));
      await reloadCapabilities();
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Gagal mengubah industry profile.");
      await load(outletId);
    } finally {
      setSavingCode(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profil Industri & Fitur</h1>
        <p className="mt-1 text-sm text-gray-500">Atur capability Business dan override per Outlet tanpa menghapus data.</p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-2 block font-medium">Industry Profile</span>
          <select
            value={snapshot?.industryProfile.code ?? ""}
            disabled={!canEdit || savingCode === "profile" || Boolean(outletId)}
            onChange={(event) => void changeProfile(event.target.value)}
            className="h-11 w-full rounded-xl border border-gray-200 bg-transparent px-3 dark:border-gray-700"
          >
            {profiles.map((profile) => <option key={profile.code} value={profile.code}>{profile.name}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-2 block font-medium">Scope konfigurasi</span>
          <select
            value={outletId}
            onChange={(event) => { setOutletId(event.target.value); void load(event.target.value); }}
            className="h-11 w-full rounded-xl border border-gray-200 bg-transparent px-3 dark:border-gray-700"
          >
            <option value="">Business</option>
            {outlets.map((outlet) => <option key={outlet.id} value={outlet.id}>{outlet.code} — {outlet.name}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-2 block font-medium">Alasan perubahan</span>
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Wajib saat menonaktifkan"
            className="h-11 w-full rounded-xl border border-gray-200 bg-transparent px-3 dark:border-gray-700"
          />
        </label>
      </div>

      {loading ? <div className="py-12 text-center text-sm text-gray-500">Memuat capability...</div> : null}
      {!loading && snapshot ? grouped.map(([module, capabilities]) => (
        <section key={module} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">{module}</h2>
          <div className="space-y-3">
            {capabilities.map((capability) => {
              const override = outletId ? capability.outletOverride : capability.businessOverride;
              const editable = canEdit && capability.canOverride && (!outletId || capability.scope === "Outlet");
              return (
                <div key={capability.code} className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{capability.name}</div>
                    <div className="mt-1 text-xs text-gray-500">{capability.code} · {capability.scope} · sumber: {capability.source}</div>
                    <div className={`mt-1 text-xs font-semibold ${capability.enabled ? "text-emerald-600" : "text-red-500"}`}>
                      Effective: {capability.enabled ? "Aktif" : "Nonaktif"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {([null, true, false] as const).map((state) => (
                      <button
                        key={String(state)}
                        type="button"
                        disabled={!editable || savingCode === capability.code}
                        onClick={() => void changeCapability(capability, state)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-40 ${override === state ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"}`}
                      >
                        {stateLabel(state)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )) : null}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 font-semibold">Riwayat perubahan</h2>
        <div className="space-y-2 text-sm">
          {history.map((item) => (
            <div key={item.id} className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
              <div className="font-medium">{item.capabilityName ?? item.changeType}</div>
              <div className="text-xs text-gray-500">{item.changedByUserName} · {new Date(item.createdAt).toLocaleString("id-ID")} · {item.reason ?? "Tanpa alasan"}</div>
            </div>
          ))}
          {!history.length ? <p className="text-gray-500">Belum ada perubahan.</p> : null}
        </div>
      </section>
    </div>
  );
}
