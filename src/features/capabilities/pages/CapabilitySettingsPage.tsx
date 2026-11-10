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
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { GridIcon, InfoIcon, LockIcon, TimeIcon } from "../../../icons";

const inputClassName = "h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white dark:disabled:bg-gray-800";

function stateLabel(value: boolean | null) {
  return value === null ? "Ikuti bawaan" : value ? "Aktif" : "Nonaktif";
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
  const [pendingProfile, setPendingProfile] = useState<IndustryProfile | null>(null);
  const canEdit = session?.role === "Owner";
  const selectedProfile = profiles.find((profile) => profile.code === snapshot?.industryProfile.code);

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
      const conflict = (err as { status?: number })?.status === 409;
      await load(outletId);
      setError(conflict
        ? "Konfigurasi telah diubah oleh pengguna lain. Data terbaru sudah dimuat; silakan ulangi perubahan."
        : (err as { message?: string })?.message ?? "Gagal menyimpan capability.");
    } finally {
      setSavingCode(null);
    }
  }

  async function changeProfile(profileCode: string) {
    if (!snapshot || !canEdit || profileCode === snapshot.industryProfile.code) return;
    setSavingCode("profile");
    setError(null);
    try {
      const next = await updateIndustryProfile(profileCode, snapshot.revision, reason);
      setSnapshot(next);
      setHistory(await getCapabilityHistory(30));
      await reloadCapabilities();
    } catch (err) {
      const conflict = (err as { status?: number })?.status === 409;
      await load(outletId);
      setError(conflict
        ? "Konfigurasi telah diubah oleh pengguna lain. Data terbaru sudah dimuat; silakan ulangi perubahan profil."
        : (err as { message?: string })?.message ?? "Gagal mengubah industry profile.");
    } finally {
      setSavingCode(null);
      setPendingProfile(null);
    }
  }

  return (
    <ProtectedPageShell title="Profil Industri & Fitur" description="Sesuaikan profil bisnis dan fitur yang digunakan, untuk seluruh bisnis maupun outlet tertentu tanpa menghapus data.">
      <section className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 dark:border-[#293b58] dark:from-[#172554] dark:via-[#1e1b4b] dark:to-[#111b2c] sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20"><GridIcon className="h-7 w-7" aria-hidden="true" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Personalisasi bisnis</p><h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Fitur yang sesuai dengan cara Anda bekerja</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">Pilih profil industri sebagai pengaturan dasar, lalu sesuaikan fitur dengan kebutuhan operasional bisnis dan setiap outlet.</p></div>
        </div>
      </section>

      <InlineAlert tone="error" message={error} />
      {!canEdit && <InlineAlert tone="info" message="Anda dapat melihat konfigurasi fitur. Perubahan profil dan pengaturan fitur hanya dapat dilakukan oleh Owner." />}

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
        <div className="mb-6"><h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pengaturan profil & cakupan</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tentukan bagian bisnis yang ingin Anda atur sebelum mengubah fitur.</p></div>
        <div className="grid gap-5 lg:grid-cols-3">
        <label className="text-sm text-gray-700 dark:text-gray-200">
          <span className="mb-2 block font-medium">Profil industri</span>
          <select
            value={pendingProfile?.code ?? snapshot?.industryProfile.code ?? ""}
            disabled={!canEdit || savingCode === "profile" || Boolean(outletId)}
            onChange={(event) => {
              const next = profiles.find((profile) => profile.code === event.target.value);
              if (next && next.code !== snapshot?.industryProfile.code) setPendingProfile(next);
            }}
            className={inputClassName}
          >
            {profiles.map((profile) => <option key={profile.code} value={profile.code}>{profile.name}</option>)}
          </select>
          {selectedProfile?.description ? (
            <span className="mt-2 block text-xs leading-5 text-gray-500 dark:text-gray-400">{selectedProfile.description}</span>
          ) : null}
        </label>
        <label className="text-sm text-gray-700 dark:text-gray-200">
          <span className="mb-2 block font-medium">Cakupan pengaturan</span>
          <select
            value={outletId}
            onChange={(event) => { setOutletId(event.target.value); void load(event.target.value); }}
            className={inputClassName}
          >
            <option value="">Seluruh bisnis</option>
            {outlets.map((outlet) => <option key={outlet.id} value={outlet.id}>{outlet.code} — {outlet.name}</option>)}
          </select>
          <span className="mt-2 block text-xs leading-5 text-gray-500 dark:text-gray-400">Pilih outlet untuk mengatur fitur khusus cabang tersebut. Profil industri diubah pada cakupan seluruh bisnis.</span>
        </label>
        <label className="text-sm text-gray-700 dark:text-gray-200">
          <span className="mb-2 block font-medium">Alasan perubahan</span>
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Contoh: Fitur belum digunakan"
            className={inputClassName}
          />
          <span className="mt-2 block text-xs leading-5 text-gray-500 dark:text-gray-400">Wajib diisi sebelum menonaktifkan fitur dan akan tercatat dalam riwayat perubahan.</span>
        </label>
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 p-4 dark:border-[#293b58] dark:bg-[#111b2c]"><InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-500 dark:text-brand-300" aria-hidden="true" /><p className="text-xs leading-6 text-gray-600 dark:text-gray-300">Perubahan status fitur langsung disimpan. <strong>Ikuti bawaan</strong> menggunakan pengaturan profil industri untuk bisnis, atau pengaturan bisnis untuk outlet. Status yang berlaku ditampilkan pada setiap fitur.</p></div>
      </section>

      {loading ? <AppLoader label="Memuat pengaturan fitur..." /> : null}
      {!loading && snapshot ? grouped.map(([module, capabilities]) => (
        <section key={module} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <div className="mb-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"><GridIcon className="h-5 w-5" aria-hidden="true" /></div><h2 className="text-lg font-semibold text-gray-900 dark:text-white">{module}</h2><span className="ml-auto rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">{capabilities.length} fitur</span></div>
          <div className="space-y-3">
            {capabilities.map((capability) => {
              const override = outletId ? capability.outletOverride : capability.businessOverride;
              const editable = canEdit && capability.canOverride && (!outletId || capability.scope === "Outlet");
              return (
                <div key={capability.code} className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50/50 p-5 dark:border-[#293b58] dark:bg-[#111b2c] lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white">{capability.name}</div>
                    <div className="mt-2 break-words text-xs leading-5 text-gray-500 dark:text-gray-400"><span className="font-mono">{capability.code}</span> · {capability.scope === "Business" ? "Bisnis" : "Outlet"} · Sumber: {capability.source}</div>
                    <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${capability.enabled ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />Berlaku: {capability.enabled ? "Aktif" : "Nonaktif"}
                    </div>
                    {!editable && <p className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><LockIcon className="h-3.5 w-3.5" aria-hidden="true" />Pengaturan ini tidak dapat diubah pada akses atau cakupan saat ini.</p>}
                  </div>
                  <div role="group" aria-label={`Status fitur ${capability.name}`} className="flex w-fit shrink-0 flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-[#293b58] dark:bg-[#0b1422]">
                    {([null, true, false] as const).map((state) => (
                      <button
                        key={String(state)}
                        type="button"
                        aria-pressed={override === state}
                        disabled={!editable || savingCode === capability.code}
                        onClick={() => void changeCapability(capability, state)}
                        className={`min-h-10 rounded-lg px-3 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 ${override === state ? "bg-brand-500 text-white shadow-theme-xs" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}
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
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white"><TimeIcon className="h-5 w-5 text-brand-500 dark:text-brand-300" aria-hidden="true" />Riwayat perubahan</h2>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">Catatan perubahan profil dan fitur terbaru, termasuk pengguna dan alasannya.</p>
        <div className="space-y-2 text-sm">
          {history.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-[#293b58] dark:bg-[#111b2c]">
              <div className="font-semibold text-gray-900 dark:text-white">{item.capabilityName ?? item.changeType}</div>
              <div className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{item.changedByUserName} · {new Date(item.createdAt).toLocaleString("id-ID")}</div>
              <p className="mt-2 break-words text-sm text-gray-600 dark:text-gray-300">{item.reason ?? "Tanpa alasan"}</p>
            </div>
          ))}
          {!history.length ? <p className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">Belum ada perubahan yang tercatat.</p> : null}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(pendingProfile)}
        title={`Ganti profil ke ${pendingProfile?.name ?? ""}?`}
        description="Menu dan fitur yang tersedia dapat langsung berubah mengikuti profil baru. Data bisnis tidak dihapus, dan pengaturan khusus bisnis maupun outlet yang sudah ada tetap berlaku."
        confirmLabel="Ya, ganti profil"
        isBusy={savingCode === "profile"}
        onCancel={() => setPendingProfile(null)}
        onConfirm={() => {
          if (pendingProfile) void changeProfile(pendingProfile.code);
        }}
      />
    </ProtectedPageShell>
  );
}
