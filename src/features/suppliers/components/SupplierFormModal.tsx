import { useEffect, useMemo, useState } from "react";
import { FieldErrorText } from "../../../components/forms";
import { InlineAlert } from "../../../components/ui";
import { Modal } from "../../../components/ui/modal";
import { BoxIcon, CheckLineIcon, EnvelopeIcon, GroupIcon, UserIcon } from "../../../icons";
import type { SupplierDto, SupplierFormValues } from "../types/supplier";

type SupplierFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  supplier: SupplierDto | null;
  isSubmitting: boolean;
  submitError: string | null;
  onClose: () => void;
  onSubmit: (values: SupplierFormValues) => Promise<void>;
};

const initialValues: SupplierFormValues = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  isActive: true,
};

export default function SupplierFormModal({
  open,
  mode,
  supplier,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}: SupplierFormModalProps) {
  const [values, setValues] = useState<SupplierFormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof SupplierFormValues, string>>>({});

  const title = useMemo(() => (mode === "create" ? "Tambah supplier" : "Edit supplier"), [mode]);

  useEffect(() => {
    if (!open) {
      setValues(initialValues);
      setErrors({});
      return;
    }

    if (mode === "edit" && supplier) {
      setValues({
        name: supplier.name,
        contactPerson: supplier.contactPerson ?? "",
        phone: supplier.phone ?? "",
        email: supplier.email ?? "",
        address: supplier.address ?? "",
        isActive: supplier.isActive,
      });
      setErrors({});
      return;
    }

    setValues(initialValues);
    setErrors({});
  }, [mode, open, supplier]);

  function handleChange(key: keyof SupplierFormValues, value: string | boolean) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    const nextErrors: Partial<Record<keyof SupplierFormValues, string>> = {};

    if (!values.name.trim()) {
      nextErrors.name = "Nama supplier wajib diisi.";
    } else if (values.name.trim().length < 2) {
      nextErrors.name = "Nama supplier minimal 2 karakter.";
    } else if (values.name.trim().length > 100) {
      nextErrors.name = "Nama supplier maksimal 100 karakter.";
    } else if (!/^[a-zA-Z0-9\s.,&()'/^-]+$/.test(values.name.trim())) {
      nextErrors.name = "Nama hanya boleh mengandung huruf, angka, spasi, titik, koma, strip, ampersand, tanda kurung, petik satu, dan garis miring.";
    }

    if (values.contactPerson.trim() && values.contactPerson.trim().length > 100) {
      nextErrors.contactPerson = "Nama kontak maksimal 100 karakter.";
    }

    if (values.phone.trim()) {
      const phoneRegex = /^\+?[0-9\s-]{8,20}$/;
      if (!phoneRegex.test(values.phone.trim())) {
        nextErrors.phone = "Format telepon tidak valid. Gunakan 8–20 digit, boleh mengandung spasi, strip, atau diawali +.";
      }
    }

    if (values.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(values.email.trim())) {
        nextErrors.email = "Format email tidak valid.";
      } else if (values.email.trim().length > 100) {
        nextErrors.email = "Email maksimal 100 karakter.";
      }
    }

    if (values.address.trim() && values.address.trim().length > 500) {
      nextErrors.address = "Alamat maksimal 500 karakter.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit(values);
  }

  const inputClass =
    "mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white";

  return (
    <Modal isOpen={open} onClose={onClose} className="mx-4 max-w-2xl overflow-hidden shadow-2xl">
      <form className="flex max-h-[90vh] flex-col" onSubmit={(event) => void handleSubmit(event)}>
        <div className="relative shrink-0 overflow-hidden border-b border-gray-100 bg-gradient-to-br from-brand-50 via-white to-white px-6 py-6 pr-20 dark:border-gray-800 dark:from-brand-500/10 dark:via-gray-900 dark:to-gray-900 sm:px-8 sm:py-7">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-brand-500/15 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25">
              <GroupIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Procurement</p>
              <h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Kelola kontak supplier untuk purchase order dan pembayaran utang.</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6 sm:px-8">
          <InlineAlert tone="error" message={submitError} />

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Nama <span className="text-error-500">*</span></span>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input value={values.name} onChange={(event) => handleChange("name", event.target.value)} className={`${inputClass} pl-10`} />
              </div>
              <p className="mt-1 text-xs text-gray-400">2–100 karakter. Hanya huruf, angka, spasi, dan simbol dasar.</p>
              <FieldErrorText message={errors.name} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Kontak</span>
              <input value={values.contactPerson} onChange={(event) => handleChange("contactPerson", event.target.value)} className={inputClass} />
              <p className="mt-1 text-xs text-gray-400">Opsional. Maks 100 karakter.</p>
              <FieldErrorText message={errors.contactPerson} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Telepon</span>
              <input value={values.phone} onChange={(event) => handleChange("phone", event.target.value)} className={inputClass} />
              <p className="mt-1 text-xs text-gray-400">Opsional. Format: 8–15 digit, boleh diawali +.</p>
              <FieldErrorText message={errors.phone} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Email</span>
              <div className="relative">
                <EnvelopeIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input value={values.email} onChange={(event) => handleChange("email", event.target.value)} className={`${inputClass} pl-10`} />
              </div>
              <p className="mt-1 text-xs text-gray-400">Opsional. Format email standard (contoh: supplier@email.com).</p>
              <FieldErrorText message={errors.email} />
            </label>
          </div>

          <label className="block">
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
              <BoxIcon className="h-4 w-4 text-brand-500" /> Alamat
            </span>
            <textarea value={values.address} onChange={(event) => handleChange("address", event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
            <p className="mt-1 text-xs text-gray-400">Opsional. Maks 500 karakter.</p>
            <FieldErrorText message={errors.address} />
          </label>

          {mode === "edit" ? (
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-gray-200 p-4 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
              <span>
                <span className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Supplier aktif</span>
                <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">Supplier aktif dapat dipilih pada purchase order baru.</span>
              </span>
              <span className="relative shrink-0">
                <input type="checkbox" checked={values.isActive} onChange={(event) => handleChange("isActive", event.target.checked)} className="peer sr-only" />
                <span className="block h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-brand-500 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/20 dark:bg-gray-700" />
                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
              </span>
            </label>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-100 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:justify-end sm:px-8">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800">Batal</button>
          <button type="submit" disabled={isSubmitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70">
            <CheckLineIcon className="h-4 w-4" />
            {isSubmitting ? "Menyimpan..." : mode === "create" ? "Simpan supplier" : "Perbarui supplier"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
