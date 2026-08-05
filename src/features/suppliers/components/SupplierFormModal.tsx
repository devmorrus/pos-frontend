import { useEffect, useMemo, useState } from "react";
import { FieldErrorText } from "../../../components/forms";
import { InlineAlert } from "../../../components/ui";
import { Modal } from "../../../components/ui/modal";
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
    } else if (!/^[a-zA-Z0-9\s.,\-&()'/]+$/.test(values.name.trim())) {
      nextErrors.name = "Nama hanya boleh mengandung huruf, angka, spasi, titik, koma, strip, ampersand, tanda kurung, petik satu, dan garis miring.";
    }

    if (values.contactPerson.trim() && values.contactPerson.trim().length > 100) {
      nextErrors.contactPerson = "Nama kontak maksimal 100 karakter.";
    }

    if (values.phone.trim()) {
      const phoneRegex = /^\+?[0-9\s\-]{8,20}$/;
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

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-2xl p-6 sm:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Kelola master supplier untuk kebutuhan purchase order dan pembayaran utang supplier.
          </p>
        </div>

        <InlineAlert tone="error" message={submitError} />

        <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Nama <span className="text-error-500">*</span></span>
              <input
                value={values.name}
                onChange={(event) => handleChange("name", event.target.value)}
                className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-400">2–100 karakter. Hanya huruf, angka, spasi, dan simbol dasar.</p>
              <FieldErrorText message={errors.name} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Kontak</span>
              <input
                value={values.contactPerson}
                onChange={(event) => handleChange("contactPerson", event.target.value)}
                className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-400">Opsional. Maks 100 karakter.</p>
              <FieldErrorText message={errors.contactPerson} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Telepon</span>
              <input
                value={values.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
                className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-400">Opsional. Format: 8–15 digit, boleh diawali +.</p>
              <FieldErrorText message={errors.phone} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Email</span>
              <input
                value={values.email}
                onChange={(event) => handleChange("email", event.target.value)}
                className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-400">Opsional. Format email standard (contoh: supplier@email.com).</p>
              <FieldErrorText message={errors.email} />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Alamat</span>
            <textarea
              value={values.address}
              onChange={(event) => handleChange("address", event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-400">Opsional. Maks 500 karakter.</p>
            <FieldErrorText message={errors.address} />
          </label>

          {mode === "edit" ? (
            <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={values.isActive}
                onChange={(event) => handleChange("isActive", event.target.checked)}
              />
              Supplier aktif
            </label>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
            >
              {isSubmitting ? "Menyimpan..." : mode === "create" ? "Simpan supplier" : "Perbarui supplier"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
