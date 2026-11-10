import { Link } from "react-router";
import { InlineAlert } from "../../../components/ui";
import { CheckCircleIcon, UserCircleIcon } from "../../../icons";
import type { CustomerFormValues } from "../types/customer";

export default function CustomerForm({ values, onChange, onSubmit, isSubmitting, submitError, title }: {
  values: CustomerFormValues;
  onChange: (key: keyof CustomerFormValues, value: string | boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  title: string;
}) {
  const inputClass = "mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white";

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-4 border-b border-gray-200 bg-brand-50/60 p-6 dark:border-gray-800 dark:bg-[#172554]/40">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white"><UserCircleIcon className="h-6 w-6" aria-hidden="true" /></div>
        <div><h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Lengkapi profil agar pelanggan mudah ditemukan saat transaksi.</p></div>
      </div>
      <div className="grid gap-8 p-6 lg:grid-cols-[1fr_260px] sm:p-8">
        <div className="space-y-6">
          <InlineAlert tone="error" message={submitError} />
          <div><h4 className="font-semibold text-gray-900 dark:text-white">Informasi pelanggan</h4><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Identitas dan kontak utama pelanggan Anda.</p></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Nama customer<input value={values.name} onChange={(event) => onChange("name", event.target.value)} placeholder="Nama lengkap pelanggan" autoComplete="name" className={inputClass} /></label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Nomor HP<input value={values.phone} onChange={(event) => onChange("phone", event.target.value)} placeholder="Contoh: 081234567890" autoComplete="tel" inputMode="tel" className={inputClass} /></label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Email <span className="font-normal text-gray-400">(opsional)</span><input value={values.email} onChange={(event) => onChange("email", event.target.value)} placeholder="nama@email.com" autoComplete="email" inputMode="email" className={inputClass} /></label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Jenis kelamin <span className="font-normal text-gray-400">(opsional)</span><input value={values.gender} onChange={(event) => onChange("gender", event.target.value)} placeholder="Jenis kelamin pelanggan" className={inputClass} /></label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Tanggal lahir <span className="font-normal text-gray-400">(opsional)</span><input value={values.birthDate} onChange={(event) => onChange("birthDate", event.target.value)} type="date" className={inputClass} /></label>
          </div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Catatan <span className="font-normal text-gray-400">(opsional)</span><textarea value={values.notes} onChange={(event) => onChange("notes", event.target.value)} placeholder="Tambahkan informasi yang membantu pelayanan pelanggan" rows={4} className={`${inputClass} h-auto py-3`} /></label>
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-[#293b58] dark:bg-[#111b2c]">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Status pelanggan</h4>
            <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-200"><input type="checkbox" checked={values.isActive} onChange={(event) => onChange("isActive", event.target.checked)} className="h-4 w-4 rounded accent-brand-500" />Customer aktif</label>
            <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-gray-400">Gunakan status ini untuk mengelola ketersediaan profil pelanggan.</p>
          </div>
          <p className="px-1 text-xs leading-5 text-gray-500 dark:text-gray-400">Pastikan nomor HP sudah benar agar kasir dapat menemukan pelanggan dengan mudah.</p>
        </aside>
      </div>
      <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 px-6 py-5 dark:border-gray-800">
        <Link to="/customers" className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Kembali ke daftar</Link>
        <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"><CheckCircleIcon className="h-4 w-4" aria-hidden="true" />{isSubmitting ? "Menyimpan..." : "Simpan customer"}</button>
      </div>
    </form>
  );
}
