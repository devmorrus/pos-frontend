import { useEffect, useState } from "react";
import { FieldErrorText } from "../../../components/forms";
import InlineAlert from "../../../components/ui/InlineAlert";
import { Modal } from "../../../components/ui/modal";
import { validateOutletForm, type OutletFieldErrors } from "../schemas/outletSchema";
import type { OutletDto, OutletFormValues } from "../types/outlet";

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
    <Modal isOpen={open} onClose={onClose} className="max-w-2xl p-6 sm:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-600">
            MorrusPOS
          </p>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === "create" ? "Tambah cabang" : "Edit cabang"}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Owner dapat menambah cabang baru dan mengatur status aktifnya tanpa menghapus histori bisnis.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <InlineAlert tone="error" message={submitError} />

          <div className="grid gap-5 md:grid-cols-2">
            <div className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Kode cabang
              </span>
              <div className="relative flex items-center">
                <input
                  value={values.code}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                  }
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-4 pr-24 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    setValues((current) => ({
                      ...current,
                      code: generateNextOutletCode(existingCodes),
                    }));
                  }}
                  className="absolute right-2 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Generate
                </button>
              </div>
              <FieldErrorText message={errors.code} />
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Nama cabang
              </span>
              <input
                value={values.name}
                onChange={(event) =>
                  setValues((current) => ({ ...current, name: event.target.value }))
                }
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <FieldErrorText message={errors.name} />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Alamat
              </span>
              <textarea
                value={values.address}
                onChange={(event) =>
                  setValues((current) => ({ ...current, address: event.target.value }))
                }
                rows={3}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Telepon
              </span>
              <input
                value={values.phone}
                onChange={(event) =>
                  setValues((current) => ({ ...current, phone: event.target.value }))
                }
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <FieldErrorText message={errors.phone} />
            </label>

            {mode === "edit" ? (
              <label className="inline-flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={values.isActive}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, isActive: event.target.checked }))
                  }
                  className="h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Cabang aktif
                </span>
              </label>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-800 dark:text-gray-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
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
