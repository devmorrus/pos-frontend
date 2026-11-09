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
      description="Pasangkan browser ini ke satu register menggunakan kode dari Owner/Admin."
    >
      <InlineAlert tone="error" message={error} />

      {binding ? (
        <div className="max-w-2xl rounded-2xl border border-success-200 bg-success-50 p-6 dark:border-success-500/30 dark:bg-success-500/10">
          <h2 className="text-lg font-semibold text-success-800 dark:text-success-200">Perangkat aktif</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-gray-500">Device ID</dt><dd className="break-all font-mono">{binding.deviceId}</dd></div>
            <div><dt className="text-gray-500">Register ID</dt><dd className="break-all font-mono">{binding.registerId}</dd></div>
            <div><dt className="text-gray-500">Outlet ID</dt><dd className="break-all font-mono">{binding.outletId}</dd></div>
          </dl>
          <button
            type="button"
            onClick={clearBinding}
            className="mt-6 rounded-xl border border-error-300 px-4 py-2 text-sm font-semibold text-error-700 dark:text-error-300"
          >
            Hapus binding lokal
          </button>
          <p className="mt-2 text-xs text-gray-500">Mencabut perangkat secara resmi tetap dilakukan Owner/Admin dari menu Lokasi & Register.</p>
        </div>
      ) : (
        <form onSubmit={activate} className="max-w-xl space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <label className="block text-sm font-medium">
            Kode pairing
            <input
              required
              maxLength={8}
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 font-mono text-lg tracking-[0.3em] dark:border-gray-700"
            />
          </label>
          <label className="block text-sm font-medium">
            Nama perangkat
            <input
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 dark:border-gray-700"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? "Mengaktifkan..." : "Aktifkan perangkat"}
          </button>
        </form>
      )}
    </ProtectedPageShell>
  );
}
