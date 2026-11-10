import { useMemo } from "react";
import { Link } from "react-router";
import { FieldErrorText, FormCard } from "../../../components/forms";
import InlineAlert from "../../../components/ui/InlineAlert";
import { isOwner } from "../../auth";
import type { RoleLookupDto } from "../../auth/types/role";
import type { OutletLookupDto } from "../../outlets/types/outlet";
import { AngleLeftIcon, LockIcon, UserCircleIcon } from "../../../icons";
import type {
  CreateUserFormValues,
  UpdateUserFormValues,
} from "../types/user";

type SharedValues = CreateUserFormValues | UpdateUserFormValues;
type SharedErrors = Partial<
  Record<
    | keyof CreateUserFormValues
    | keyof UpdateUserFormValues,
    string
  >
>;
type SharedFieldValue = string | boolean;

type UserFormProps = {
  mode: "create" | "edit";
  values: SharedValues;
  errors: SharedErrors;
  roles: RoleLookupDto[];
  outlets: OutletLookupDto[];
  canAssignOwner: boolean;
  canChooseOutlet: boolean;
  isSubmitting: boolean;
  submitError?: string | null;
  onChange: (key: string, value: SharedFieldValue) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function UserForm({
  mode,
  values,
  errors,
  roles,
  outlets,
  canAssignOwner,
  canChooseOutlet,
  isSubmitting,
  submitError,
  onChange,
  onSubmit,
}: UserFormProps) {
  const selectableRoles = useMemo(
    () => roles.filter((role) => canAssignOwner || role.name !== "Owner"),
    [canAssignOwner, roles],
  );

  const selectableOutlets = useMemo(
    () =>
      outlets.filter((outlet) => outlet.isActive || outlet.id === values.outletId),
    [outlets, values.outletId],
  );

  const selectedRoleName =
    roles.find((role) => role.id === values.roleId)?.name ?? null;

  const selectedOutlet =
    outlets.find((outlet) => outlet.id === values.outletId) ?? null;
  const selectedOutletInactive = Boolean(selectedOutlet && !selectedOutlet.isActive);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
    <FormCard
      title={mode === "create" ? "Tambah pengguna" : "Edit pengguna"}
      description="Lengkapi identitas akun, lalu tentukan peran dan outlet pengguna."
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <InlineAlert tone="error" message={submitError} />

        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-800 md:col-span-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"><UserCircleIcon className="h-5 w-5" aria-hidden="true" /></div>
            <div><h4 className="text-sm font-semibold text-gray-900 dark:text-white">Identitas pengguna</h4><p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Informasi dasar untuk mengenali akun staf.</p></div>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Nama <span className="text-error-500">*</span>
            </span>
            <input
              autoComplete="name"
              placeholder="Nama lengkap staf"
              value={values.name}
              onChange={(event) => onChange("name", event.target.value)}
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-400">Minimal 3 karakter. Hanya huruf, spasi, titik (.), atau petik tunggal (').</p>
            <FieldErrorText message={errors.name} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Email <span className="text-error-500">*</span>
            </span>
            <input
              type="email"
              autoComplete="email"
              placeholder="nama@domain.com"
              value={values.email}
              onChange={(event) => onChange("email", event.target.value)}
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-400">Contoh: nama@domain.com</p>
            <FieldErrorText message={errors.email} />
          </label>

          <div className="mt-2 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-800 md:col-span-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"><LockIcon className="h-5 w-5" aria-hidden="true" /></div>
            <div><h4 className="text-sm font-semibold text-gray-900 dark:text-white">Peran & akses outlet</h4><p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Sesuaikan akses dengan tanggung jawab pengguna.</p></div>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Peran <span className="text-error-500">*</span>
            </span>
            <select
              value={values.roleId}
              onChange={(event) => onChange("roleId", event.target.value)}
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white"
            >
              <option value="">Pilih peran</option>
              {selectableRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <FieldErrorText message={errors.roleId} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Outlet {!isOwner(selectedRoleName) && <span className="text-error-500">*</span>}
            </span>
            <select
              value={values.outletId}
              disabled={!canChooseOutlet || isOwner(selectedRoleName)}
              onChange={(event) => onChange("outletId", event.target.value)}
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white dark:disabled:bg-gray-900"
            >
              <option value="">
                {isOwner(selectedRoleName) ? "Tidak perlu outlet untuk Owner" : "Pilih outlet"}
              </option>
              {selectableOutlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                  {!outlet.isActive ? " (nonaktif)" : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">Wajib diisi untuk selain peran Owner.</p>
            <FieldErrorText message={errors.outletId} />
            {selectedOutletInactive ? (
              <p className="mt-2 text-xs text-warning-700 dark:text-warning-300">
                Outlet yang sedang terpasang sudah nonaktif. Pilih outlet aktif sebelum menyimpan.
              </p>
            ) : null}
          </label>

          {"password" in values ? (
            <label className="mt-2 block border-t border-gray-200 pt-5 dark:border-gray-800 md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Password <span className="text-error-500">*</span>
              </span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Buat password yang kuat"
                value={values.password}
                onChange={(event) => onChange("password", event.target.value)}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white"
              />
              <FieldErrorText message={errors.password} />
              <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">Minimal 8 karakter dengan huruf besar, huruf kecil, angka, dan simbol.</p>
              
              {values.password && (
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs dark:border-[#293b58] dark:bg-[#0b1422]">
                  <div className="flex items-center gap-1.5">
                    <span className={values.password.length >= 8 ? "text-success-600 font-bold" : "text-error-500"}>
                      {values.password.length >= 8 ? "✓" : "✗"}
                    </span>
                    <span className={values.password.length >= 8 ? "text-gray-900 dark:text-gray-100" : "text-gray-500"}>Min. 8 karakter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={/[A-Z]/.test(values.password) ? "text-success-600 font-bold" : "text-error-500"}>
                      {/[A-Z]/.test(values.password) ? "✓" : "✗"}
                    </span>
                    <span className={/[A-Z]/.test(values.password) ? "text-gray-900 dark:text-gray-100" : "text-gray-500"}>Huruf besar (A-Z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={/[a-z]/.test(values.password) ? "text-success-600 font-bold" : "text-error-500"}>
                      {/[a-z]/.test(values.password) ? "✓" : "✗"}
                    </span>
                    <span className={/[a-z]/.test(values.password) ? "text-gray-900 dark:text-gray-100" : "text-gray-500"}>Huruf kecil (a-z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={/[0-9]/.test(values.password) ? "text-success-600 font-bold" : "text-error-500"}>
                      {/[0-9]/.test(values.password) ? "✓" : "✗"}
                    </span>
                    <span className={/[0-9]/.test(values.password) ? "text-gray-900 dark:text-gray-100" : "text-gray-500"}>Angka (0-9)</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <span className={/[^A-Za-z0-9]/.test(values.password) ? "text-success-600 font-bold" : "text-error-500"}>
                      {/[^A-Za-z0-9]/.test(values.password) ? "✓" : "✗"}
                    </span>
                    <span className={/[^A-Za-z0-9]/.test(values.password) ? "text-gray-900 dark:text-gray-100" : "text-gray-500"}>Simbol khusus (mis. @, $, !, %, dll)</span>
                  </div>
                </div>
              )}
            </label>
          ) : null}

          {"isActive" in values ? (
            <label className="inline-flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-[#293b58] dark:bg-[#111b2c] md:col-span-2">
              <input
                type="checkbox"
                checked={values.isActive}
                onChange={(event) => onChange("isActive", event.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Pengguna aktif
              </span>
            </label>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/users" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"><AngleLeftIcon className="h-4 w-4" aria-hidden="true" />Kembali ke daftar</Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting
              ? "Memproses..."
              : mode === "create"
                ? "Simpan pengguna"
                : "Perbarui pengguna"}
          </button>
        </div>
      </form>
    </FormCard>
      <aside className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 dark:border-[#293b58] dark:from-[#172554] dark:via-[#1e1b4b] dark:to-[#111b2c]">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white"><LockIcon className="h-6 w-6" aria-hidden="true" /></div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">Panduan akun</p>
        <h3 className="mt-2 text-lg font-bold text-gray-900 dark:text-white">Akses tepat untuk setiap anggota tim</h3>
        <div className="mt-5 space-y-5 text-sm">
          <div><h4 className="font-semibold text-gray-900 dark:text-white">Identitas yang mudah dikenali</h4><p className="mt-1 leading-6 text-gray-600 dark:text-gray-300">Gunakan nama staf dan alamat email yang benar untuk akun ini.</p></div>
          <div><h4 className="font-semibold text-gray-900 dark:text-white">Peran menentukan hak akses</h4><p className="mt-1 leading-6 text-gray-600 dark:text-gray-300">Pilih peran sesuai tugas pengguna. Hanya Owner yang dapat menetapkan peran Owner.</p></div>
          <div><h4 className="font-semibold text-gray-900 dark:text-white">Penugasan outlet</h4><p className="mt-1 leading-6 text-gray-600 dark:text-gray-300">Owner memiliki akses lintas outlet. Peran lainnya wajib terhubung dengan outlet yang ditentukan.</p></div>
        </div>
        <p className="mt-6 border-t border-brand-100 pt-4 text-xs leading-5 text-gray-500 dark:border-white/10 dark:text-gray-400">Kolom bertanda <span className="text-error-500">*</span> wajib diisi. Periksa kembali peran dan outlet sebelum menyimpan.</p>
      </aside>
    </div>
  );
}
