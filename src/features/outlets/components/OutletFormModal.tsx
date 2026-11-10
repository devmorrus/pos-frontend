import { useEffect, useState } from "react";
import { FieldErrorText } from "../../../components/forms";
import InlineAlert from "../../../components/ui/InlineAlert";
import { Modal } from "../../../components/ui/modal";
import { validateOutletForm, type OutletFieldErrors } from "../schemas/outletSchema";
import type { OutletDto, OutletFormValues } from "../types/outlet";
import { GridIcon, InfoIcon } from "../../../icons";

function generateNextOutletCode(existingCodes: string[]): string {
  const prefix = "OUT";
  const regex = /^OUT(\d+)$/i;
  let maxNum = 0;

  for (const code of existingCodes) {
    const match = code.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `${prefix}${nextNum.toString().padStart(3, "0")}`;
}

type OutletFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  outlet?: OutletDto | null;
  existingCodes: string[];
  isSubmitting: boolean;
  submitError?: string | null;
  onClose: () => void;
  onSubmit: (values: OutletFormValues) => Promise<void>;
};

const initialValues: OutletFormValues = {
  code: "",
  name: "",
  address: "",
  phone: "",
  isActive: true,
};

export default function OutletFormModal({
  open,
  mode,
  outlet,
  existingCodes,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}: OutletFormModalProps) {
  const [values, setValues] = useState<OutletFormValues>(initialValues);
  const [errors, setErrors] = useState<OutletFieldErrors>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(
      outlet
        ? {
            code: outlet.code,
            name: outlet.name,
            address: outlet.address ?? "",
            phone: outlet.phone ?? "",
            isActive: outlet.isActive,
          }
        : {
            ...initialValues,
            code: generateNextOutletCode(existingCodes),
          },
    );
    setErrors({});
  }, [open, outlet, existingCodes]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateOutletForm(values, existingCodes, outlet?.code);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit({
      ...values,
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      address: values.address.trim(),
      phone: values.phone.trim(),
    });
  }

  return (
    <Modal isOpen={open} onClose={onClose} className="m-4 max-h-[90dvh] max-w-2xl overflow-y-auto border border-gray-200 p-6 dark:border-[#293b58] sm:p-8">
      <div className="space-y-6">
        <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5 pr-12 dark:border-[#293b58] dark:from-[#172554] dark:to-[#111b2c]">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white"><GridIcon className="h-6 w-6" aria-hidden="true" /></div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">
            Informasi outlet
          </p>
          <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            {mode === "create" ? "Tambah cabang" : "Edit cabang"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
            Lengkapi identitas dan kontak cabang agar mudah dikenali oleh tim Anda.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <InlineAlert tone="error" message={submitError} />

          <div className="grid gap-5 md:grid-cols-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white md:col-span-2">Identitas cabang</h4>
            <div className="block">
              <label htmlFor="outlet-code" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Kode cabang <span className="text-error-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  id="outlet-code"
                  placeholder="Contoh: OUT004"
                  value={values.code}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                  }
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-4 pr-24 font-mono text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    setValues((current) => ({
                      ...current,
                      code: generateNextOutletCode(existingCodes),
                    }));
                  }}
                  className="absolute right-2 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25"
                >
                  Buat kode
                </button>
              </div>
              <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">Kode unik, 3–20 karakter. Dapat diisi manual atau dibuat otomatis.</p>
              <FieldErrorText message={errors.code} />
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Nama cabang <span className="text-error-500">*</span>
              </span>
              <input
                placeholder="Contoh: Cabang Bandung"
                value={values.name}
                onChange={(event) =>
                  setValues((current) => ({ ...current, name: event.target.value }))
                }
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white"
              />
              <FieldErrorText message={errors.name} />
            </label>

            <h4 className="border-t border-gray-200 pt-5 text-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white md:col-span-2">Lokasi & kontak</h4>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Alamat <span className="font-normal text-gray-400">(opsional)</span>
              </span>
              <textarea
                placeholder="Nama jalan, nomor bangunan, dan kota"
                value={values.address}
                onChange={(event) =>
                  setValues((current) => ({ ...current, address: event.target.value }))
                }
                rows={3}
                className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Telepon <span className="font-normal text-gray-400">(opsional)</span>
              </span>
              <input
                type="tel"
                placeholder="Contoh: 022-7654321"
                value={values.phone}
                onChange={(event) =>
                  setValues((current) => ({ ...current, phone: event.target.value }))
                }
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white"
              />
              <FieldErrorText message={errors.phone} />
            </label>

            {mode === "edit" ? (
              <label className="inline-flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-[#293b58] dark:bg-[#111b2c] md:col-span-2">
                <input
                  type="checkbox"
                  checked={values.isActive}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, isActive: event.target.checked }))
                  }
                  className="h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span><span className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Cabang aktif</span><span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">Nonaktifkan cabang tanpa menghapus histori bisnisnya.</span></span>
              </label>
            ) : null}
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 dark:bg-brand-500/10"><InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-500 dark:text-brand-300" aria-hidden="true" /><p className="text-xs leading-5 text-gray-600 dark:text-gray-300">Kolom bertanda <span className="text-error-500">*</span> wajib diisi. Pastikan kode dan nama sesuai dengan cabang yang Anda kelola.</p></div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? "Menyimpan..."
                : mode === "create"
                  ? "Simpan cabang"
                  : "Perbarui cabang"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
