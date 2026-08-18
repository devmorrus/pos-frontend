import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import AppLoader from "../../../components/ui/AppLoader";
import { isOwner } from "../../auth";
import { getRoles } from "../../auth/api/rolesApi";
import type { RoleLookupDto } from "../../auth/types/role";
import { getOutlets } from "../../outlets/api/outletsApi";
import type { OutletLookupDto } from "../../outlets/types/outlet";
import { useAuth } from "../../auth/hooks/useAuth";
import { getErrorMessage } from "../../../utils/errors";
import UserForm from "../components/UserForm";
import { createUser } from "../api/usersApi";
import { validateCreateUserForm } from "../schemas/userSchema";
import type { CreateUserFormValues } from "../types/user";

const initialValues: CreateUserFormValues = {
  outletId: "",
  roleId: "",
  name: "",
  email: "",
  password: "",
};

export default function UserCreatePage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [values, setValues] = useState<CreateUserFormValues>(initialValues);
  const [roles, setRoles] = useState<RoleLookupDto[]>([]);
  const [outlets, setOutlets] = useState<OutletLookupDto[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserFormValues, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canAssignOwner = isOwner(session?.role);
  const canChooseOutlet = isOwner(session?.role);

  useEffect(() => {
    async function loadLookups() {
      setIsLoading(true);

      try {
        const [rolesResult, outletsResult] = await Promise.all([getRoles(), getOutlets()]);
        setRoles(rolesResult);
        setOutlets(outletsResult.filter((outlet) => outlet.isActive));

        if (!canChooseOutlet && session?.outletId) {
          setValues((prev) => ({ ...prev, outletId: session.outletId ?? "" }));
        }
      } catch (requestError) {
        setSubmitError(getErrorMessage(requestError, "Gagal memuat lookup role dan outlet."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadLookups();
  }, [canChooseOutlet, session?.outletId]);

  const selectedRoleName = useMemo(
    () => roles.find((role) => role.id === values.roleId)?.name ?? null,
    [roles, values.roleId],
  );

  function handleChange(key: string, value: string | boolean) {
    setValues((prev) => {
      const nextValues = {
        ...prev,
        [key]: value,
      } as CreateUserFormValues;

      if (key === "roleId") {
        const nextRoleName = roles.find((role) => role.id === value)?.name ?? null;
        if (isOwner(nextRoleName)) {
          nextValues.outletId = "";
        } else if (!canChooseOutlet && session?.outletId) {
          nextValues.outletId = session.outletId;
        }
      }

      return nextValues;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateCreateUserForm(values, selectedRoleName);
    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createUser({
        ...values,
        outletId: values.outletId || null,
      });
      navigate("/users", {
        replace: true,
        state: { successMessage: `Pengguna ${values.name} berhasil dibuat.` },
      });
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal membuat pengguna."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Tambah Pengguna"
      description="Buat akun staf baru dan tentukan hak akses peran serta penugasan outletnya."
    >
      {isLoading ? (
        <AppLoader label="Memuat form pengguna..." />
      ) : (
        <UserForm
          mode="create"
          values={values}
          errors={errors}
          roles={roles}
          outlets={outlets}
          canAssignOwner={canAssignOwner}
          canChooseOutlet={canChooseOutlet}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      )}
    </ProtectedPageShell>
  );
}
