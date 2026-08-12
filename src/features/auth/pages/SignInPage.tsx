import { useState } from "react";
import { Navigate } from "react-router";
import { EyeCloseIcon, EyeIcon, LockIcon, MailIcon } from "../../../icons";
import { useAuth } from "../hooks/useAuth";
import type { LoginFormValues } from "../types/auth";
import { validateLoginForm } from "../schemas/loginSchema";

const initialValues: LoginFormValues = {
  email: "",
  password: "",
};

export default function SignInPage() {
  const { isAuthenticated, login } = useAuth();
  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateLoginForm(values);
    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(values);
    } catch (error) {
      const message =
        typeof error === "object" &&
        error &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Login gagal. Silakan periksa kembali email dan password.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-[0_30px_90px_-42px_rgba(16,24,40,0.28)] sm:p-8 dark:border-gray-800 dark:bg-gray-900">
      <div className="space-y-3">
        <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          Login aman
        </span>
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-gray-900 dark:text-white sm:text-[2rem]">
          Masuk ke akun Anda
        </h2>
        <p className="max-w-sm text-sm leading-6 text-gray-600 dark:text-gray-300">
          Login dengan akun operasional MorrusPOS untuk mengelola penjualan, stok,
          dan aktivitas outlet dari satu dashboard.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Email
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <MailIcon />
            </span>
            <input
              type="email"
              value={values.email}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="owner@morruspos.com"
              className="h-14 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            />
          </div>
          {errors.email ? (
            <span className="mt-2 block text-xs text-error-600">{errors.email}</span>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Password
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <LockIcon />
            </span>
            <input
              type={isPasswordVisible ? "text" : "password"}
              value={values.password}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, password: event.target.value }))
              }
              placeholder="Masukkan password"
              className="h-14 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Toggle password visibility"
            >
              {isPasswordVisible ? <EyeCloseIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.password ? (
            <span className="mt-2 block text-xs text-error-600">{errors.password}</span>
          ) : null}
        </label>

        {submitError ? (
          <div className="rounded-2xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-300">
            {submitError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-brand-500 via-brand-600 to-blue-light-600 px-5 text-sm font-semibold text-white shadow-[0_18px_40px_-20px_rgba(54,65,245,0.9)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Memproses login..." : "Masuk ke MorrusPOS"}
        </button>
      </form>
    </div>
  );
}
