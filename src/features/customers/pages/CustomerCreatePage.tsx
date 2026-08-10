import { useState } from "react";
import { useNavigate } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { createCustomer } from "../api/customersApi";
import type { CustomerFormValues } from "../types/customer";

const initialValues: CustomerFormValues = {
  name: "",
  phone: "",
  email: "",
  gender: "",
  birthDate: "",
  notes: "",
  isActive: true,
};

function CustomerForm({
  values,
  onChange,
  onSubmit,
  isSubmitting,
  submitError,
  title,
}: {
  values: CustomerFormValues;
  onChange: (key: keyof CustomerFormValues, value: string | boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  title: string;
}) {
  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <InlineAlert tone="error" message={submitError} />
      <div className="grid gap-4 md:grid-cols-2">
        <input value={values.name} onChange={(event) => onChange("name", event.target.value)} placeholder="Nama customer" className="h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
        <input value={values.phone} onChange={(event) => onChange("phone", event.target.value)} placeholder="Nomor HP" className="h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
        <input value={values.email} onChange={(event) => onChange("email", event.target.value)} placeholder="Email (opsional)" className="h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
        <input value={values.gender} onChange={(event) => onChange("gender", event.target.value)} placeholder="Gender (opsional)" className="h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
        <input value={values.birthDate} onChange={(event) => onChange("birthDate", event.target.value)} type="date" className="h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
        <label className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
          <input type="checkbox" checked={values.isActive} onChange={(event) => onChange("isActive", event.target.checked)} />
          Customer aktif
        </label>
      </div>
      <textarea value={values.notes} onChange={(event) => onChange("notes", event.target.value)} placeholder="Catatan (opsional)" rows={4} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
      <button type="submit" disabled={isSubmitting} className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {isSubmitting ? "Menyimpan..." : "Simpan customer"}
      </button>
    </form>
  );
}

export default function CustomerCreatePage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<CustomerFormValues>(initialValues);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(key: keyof CustomerFormValues, value: string | boolean) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const created = await createCustomer({
        name: values.name,
        phone: values.phone,
        email: values.email || null,
        gender: values.gender || null,
        birthDate: values.birthDate || null,
        notes: values.notes || null,
        isActive: values.isActive,
      });
      navigate(`/customers/${created.id}`);
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal membuat customer."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Tambah Customer"
      description="Buat customer/member dasar yang nanti bisa dipilih oleh kasir saat checkout POS."
    >
      <CustomerForm
        values={values}
        onChange={handleChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
        title="Form customer"
      />
    </ProtectedPageShell>
  );
}
