import { useState, type FormEvent } from "react";
import ProtectedPageShell from "../../components/layout/ProtectedPageShell";
import { InlineAlert } from "../../components/ui";
import { getErrorMessage } from "../../utils/errors";
import {
  clearPosDeviceBinding,
  getInstallationId,
  getPosDeviceBinding,
  savePosDeviceBinding,
} from "../../lib/posDevice";
import { pairPosDevice } from "./api";
import { CheckCircleIcon, LockIcon, PlugInIcon } from "../../icons";

function browserPlatform() {
  const agent = navigator.userAgent.toLowerCase();
  if (agent.includes("android")) return "android";
  if (agent.includes("iphone") || agent.includes("ipad")) return "ios";
  if (agent.includes("windows")) return "windows";
  if (agent.includes("mac")) return "macos";
  if (agent.includes("linux")) return "linux";
  return "web";
}

export default function DeviceActivationPage() {
  const [binding, setBinding] = useState(getPosDeviceBinding());
  const [code, setCode] = useState("");
  const [name, setName] = useState(navigator.platform || "Web POS");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function activate(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const paired = await pairPosDevice({
        code: code.trim().toUpperCase(),
        installationId: getInstallationId(),
        name: name.trim(),
        platform: browserPlatform(),
        appVersion: null,
      });
      const next = {
        deviceId: paired.deviceId,
        token: paired.token,
        registerId: paired.registerId,
        outletId: paired.outletId,
        stockLocationId: paired.stockLocationId,
      };
      savePosDeviceBinding(next);
      setBinding(next);
      setCode("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Aktivasi perangkat gagal."));
    } finally {
      setIsSubmitting(false);
    }
  }

  function clearBinding() {
    clearPosDeviceBinding();
    setBinding(null);
  }

  return (
    <ProtectedPageShell
      title="Aktivasi Perangkat POS"
      description="Hubungkan browser ini dengan register kasir menggunakan kode aktivasi dari Owner atau Admin."
    >
      <InlineAlert tone="error" message={error} />

      <section className="relative overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 shadow-theme-xs dark:border-[#293b58] dark:from-[#172554] dark:via-[#1e1b4b] dark:to-[#111b2c] sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20"><PlugInIcon className="h-7 w-7" aria-hidden="true" /></div>
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Perangkat kasir</p><h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Satu perangkat, satu register</h2><p className="mt-2 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-300">Pastikan perangkat terhubung ke register yang tepat untuk operasional kasir Anda.</p></div>
          </div>
          <span className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${binding ? "border-success-200 bg-success-50 text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-300" : "border-gray-200 bg-white/70 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"}`}><span className={`h-2 w-2 rounded-full ${binding ? "bg-success-500" : "bg-gray-400"}`} />{binding ? "Perangkat terhubung" : "Belum diaktifkan"}</span>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      {binding ? (
        <div className="rounded-3xl border border-success-200 bg-white p-6 shadow-theme-sm dark:border-success-500/30 dark:bg-gray-900 sm:p-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-300"><CheckCircleIcon className="h-6 w-6" aria-hidden="true" /></div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Perangkat berhasil terhubung</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Browser ini sudah dipasangkan dengan register berikut.</p>
          <dl className="mt-6 grid gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-900 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-gray-200 sm:grid-cols-2">
            <div><dt className="mb-1 text-xs text-gray-500 dark:text-gray-400">ID perangkat</dt><dd className="break-all font-mono">{binding.deviceId}</dd></div>
            <div><dt className="mb-1 text-xs text-gray-500 dark:text-gray-400">ID register</dt><dd className="break-all font-mono">{binding.registerId}</dd></div>
            <div><dt className="mb-1 text-xs text-gray-500 dark:text-gray-400">ID outlet</dt><dd className="break-all font-mono">{binding.outletId}</dd></div>
          </dl>
          <button
            type="button"
            onClick={clearBinding}
            className="mt-6 rounded-xl border border-error-200 px-4 py-3 text-sm font-semibold text-error-700 transition hover:bg-error-50 dark:border-error-500/30 dark:text-error-300 dark:hover:bg-error-500/10"
          >
            Lepaskan dari browser ini
          </button>
          <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-gray-400">Tindakan ini hanya menghapus koneksi yang tersimpan di browser. Pencabutan akses perangkat tetap dilakukan oleh Owner atau Admin melalui menu Lokasi & Register.</p>
        </div>
      ) : (
        <form onSubmit={activate} className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <div><h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hubungkan perangkat</h2><p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">Masukkan kode pairing dan beri nama agar perangkat mudah dikenali.</p></div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Kode pairing
            <input
              required
              maxLength={8}
              placeholder="Kode dari Owner/Admin"
              autoComplete="off"
              spellCheck={false}
              aria-describedby="pairing-help"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              className="mt-2 h-14 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 font-mono text-lg tracking-[0.2em] text-gray-900 outline-none transition placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white"
            />
          </label>
          <p id="pairing-help" className="!mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">Gunakan kode pairing yang masih berlaku dari menu Lokasi & Register.</p>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Nama perangkat
            <input
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: Kasir Depan"
              className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/15 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlugInIcon className="h-5 w-5" aria-hidden="true" />{isSubmitting ? "Mengaktifkan..." : "Aktifkan perangkat"}
          </button>
        </form>
      )}
        <aside className="rounded-3xl border border-gray-200 bg-gray-50 p-6 dark:border-[#293b58] dark:bg-[#111b2c] sm:p-8">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Cara mengaktifkan perangkat</h2>
          <ol className="mt-5 space-y-5 text-sm">
            <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">1</span><div><p className="font-medium text-gray-900 dark:text-white">Dapatkan kode pairing</p><p className="mt-1 leading-6 text-gray-500 dark:text-gray-400">Minta Owner atau Admin membuat kode untuk register yang akan digunakan.</p></div></li>
            <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">2</span><div><p className="font-medium text-gray-900 dark:text-white">Beri nama perangkat</p><p className="mt-1 leading-6 text-gray-500 dark:text-gray-400">Gunakan nama yang mudah dikenali, seperti Kasir Depan atau Kasir 02.</p></div></li>
            <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">3</span><div><p className="font-medium text-gray-900 dark:text-white">Aktifkan dan periksa status</p><p className="mt-1 leading-6 text-gray-500 dark:text-gray-400">Setelah berhasil, informasi register dan outlet akan ditampilkan di halaman ini.</p></div></li>
          </ol>
          <div className="mt-6 flex gap-3 border-t border-gray-200 pt-5 dark:border-[#293b58]"><LockIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-500 dark:text-brand-300" aria-hidden="true" /><p className="text-xs leading-5 text-gray-500 dark:text-gray-400">Aktivasi tersimpan pada browser ini. Gunakan browser yang sama saat mengoperasikan POS.</p></div>
        </aside>
      </div>
    </ProtectedPageShell>
  );
}
