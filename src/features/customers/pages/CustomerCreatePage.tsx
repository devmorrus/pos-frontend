import { useState } from "react";
import { useNavigate } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import CustomerForm from "../components/CustomerForm";
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
      description="Tambahkan profil pelanggan untuk pelayanan yang lebih personal dan pencatatan transaksi yang rapi."
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
