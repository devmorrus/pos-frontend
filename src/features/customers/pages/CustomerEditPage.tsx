import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader } from "../../../components/ui";
import CustomerForm from "../components/CustomerForm";
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
        <CustomerForm values={values} onChange={handleChange} onSubmit={handleSubmit} isSubmitting={isSubmitting} submitError={submitError} title="Perbarui profil pelanggan" />
      )}
    </ProtectedPageShell>
  );
}
