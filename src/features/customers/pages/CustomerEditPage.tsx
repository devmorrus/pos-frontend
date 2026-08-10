import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getCustomerById, updateCustomer } from "../api/customersApi";
import type { CustomerDto, CustomerFormValues } from "../types/customer";

const initialValues: CustomerFormValues = {
  name: "",
  phone: "",
  email: "",
  gender: "",
  birthDate: "",
  notes: "",
  isActive: true,
};

export default function CustomerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [values, setValues] = useState<CustomerFormValues>(initialValues);
  const [customer, setCustomer] = useState<CustomerDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomer() {
      if (!id) {
        setSubmitError("ID customer tidak valid.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const result = await getCustomerById(id);
        setCustomer(result);
        setValues({
          name: result.name,
          phone: result.phone,
          email: result.email ?? "",
          gender: result.gender ?? "",
          birthDate: result.birthDate ? result.birthDate.slice(0, 10) : "",
          notes: result.notes ?? "",
          isActive: result.isActive,
        });
      } catch (requestError) {
        setSubmitError(getErrorMessage(requestError, "Gagal memuat detail customer."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadCustomer();
  }, [id]);

  function handleChange(key: keyof CustomerFormValues, value: string | boolean) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await updateCustomer(id, {
        name: values.name,
        phone: values.phone,
        email: values.email || null,
        gender: values.gender || null,
        birthDate: values.birthDate || null,
        notes: values.notes || null,
        isActive: values.isActive,
      });
      navigate(`/customers/${id}`);
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal memperbarui customer."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Edit Customer"
      description={`Perbarui profil customer ${customer?.name ?? ""} dan status aktifnya.`}
    >
      {isLoading ? (
        <AppLoader label="Memuat detail customer..." />
      ) : (
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Form customer</h3>
          <InlineAlert tone="error" message={submitError} />
          <div className="grid gap-4 md:grid-cols-2">
            <input value={values.name} onChange={(event) => handleChange("name", event.target.value)} placeholder="Nama customer" className="h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
            <input value={values.phone} onChange={(event) => handleChange("phone", event.target.value)} placeholder="Nomor HP" className="h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
            <input value={values.email} onChange={(event) => handleChange("email", event.target.value)} placeholder="Email (opsional)" className="h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
            <input value={values.gender} onChange={(event) => handleChange("gender", event.target.value)} placeholder="Gender (opsional)" className="h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
            <input value={values.birthDate} onChange={(event) => handleChange("birthDate", event.target.value)} type="date" className="h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
            <label className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
              <input type="checkbox" checked={values.isActive} onChange={(event) => handleChange("isActive", event.target.checked)} />
              Customer aktif
            </label>
          </div>
          <textarea value={values.notes} onChange={(event) => handleChange("notes", event.target.value)} placeholder="Catatan (opsional)" rows={4} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
          <button type="submit" disabled={isSubmitting} className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {isSubmitting ? "Menyimpan..." : "Simpan perubahan"}
          </button>
        </form>
      )}
    </ProtectedPageShell>
  );
}
