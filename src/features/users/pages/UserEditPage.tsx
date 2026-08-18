import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
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
import { getUserById, updateUser } from "../api/usersApi";
import { validateUpdateUserForm } from "../schemas/userSchema";
import type { UpdateUserFormValues, UserDto } from "../types/user";

const initialValues: UpdateUserFormValues = {
  outletId: "",
  roleId: "",
  name: "",
  email: "",
  isActive: true,
};

export default function UserEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const [values, setValues] = useState<UpdateUserFormValues>(initialValues);
  const [roles, setRoles] = useState<RoleLookupDto[]>([]);
  const [outlets, setOutlets] = useState<OutletLookupDto[]>([]);
  const [user, setUser] = useState<UserDto | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof UpdateUserFormValues, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canAssignOwner = isOwner(session?.role);
  const canChooseOutlet = isOwner(session?.role);

  useEffect(() => {
    async function loadPage() {
      if (!id) {
        setSubmitError("ID pengguna tidak valid.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const [rolesResult, outletsResult, userResult] = await Promise.all([
          getRoles(),
          getOutlets(),
          getUserById(id),
        ]);

        setRoles(rolesResult);
        setOutlets(
          outletsResult.filter(
            (outlet) => outlet.isActive || outlet.id === userResult.outletId,
          ),
        );
        setUser(userResult);
        setValues({
          name: userResult.name,
          email: userResult.email,
          roleId: userResult.roleId,
          outletId: userResult.outletId ?? "",
          isActive: userResult.isActive,
        });
      } catch (requestError) {
        setSubmitError(getErrorMessage(requestError, "Gagal memuat detail pengguna."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadPage();
  }, [id]);

  const selectedRoleName = useMemo(
    () => roles.find((role) => role.id === values.roleId)?.name ?? null,
    [roles, values.roleId],
  );

  function handleChange(key: string, value: string | boolean) {
    setValues((prev) => {
      const nextValues = {
        ...prev,
        [key]: value,
      } as UpdateUserFormValues;

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

    if (!id) {
      return;
    }

    const nextErrors = validateUpdateUserForm(values, selectedRoleName);
    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateUser(id, {
        ...values,
        outletId: values.outletId || null,
      });
      navigate("/users", {
        replace: true,
        state: { successMessage: `Pengguna ${values.name} berhasil diperbarui.` },
      });
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal memperbarui pengguna."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Edit Pengguna"
      description={`Perbarui profil, hak akses peran (role), dan penugasan outlet untuk ${user?.name ?? "staf"}.`}
    >
      {isLoading ? (
        <AppLoader label="Memuat detail pengguna..." />
      ) : (
        <UserForm
          mode="edit"
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
