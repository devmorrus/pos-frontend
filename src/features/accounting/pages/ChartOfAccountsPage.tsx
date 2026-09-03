import { useEffect, useMemo, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, ConfirmDialog, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getOutlets } from "../../outlets/api/outletsApi";
import type { OutletDto } from "../../outlets/types/outlet";
import {
  createChartOfAccount,
  getChartOfAccounts,
  updateChartOfAccount,
  updateChartOfAccountStatus,
} from "../api/chartOfAccountsApi";
import ChartOfAccountFormModal from "../components/ChartOfAccountFormModal";
import type {
  ChartOfAccountDto,
  ChartOfAccountFormValues,
  ChartOfAccountScope,
  ChartOfAccountType,
} from "../types/chartOfAccount";

function formatDate(value: string) {
  return new Date(value).toLocaleString("id-ID");
}

function getAccountTypeLabel(type: ChartOfAccountType) {
  switch (type) {
    case "asset":
      return "Asset";
    case "liability":
      return "Liability";
    case "equity":
      return "Equity";
    case "revenue":
      return "Revenue";
    case "cogs":
      return "COGS";
    case "expense":
      return "Expense";
    default:
      return type;
  }
}

type ModalState =
  | { open: false; mode: "create"; account: null }
  | { open: true; mode: "create"; account: null }
  | { open: true; mode: "edit"; account: ChartOfAccountDto };

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<ChartOfAccountDto[]>([]);
  const [outlets, setOutlets] = useState<OutletDto[]>([]);
  const [modalState, setModalState] = useState<ModalState>({
    open: false,
    mode: "create",
    account: null,
  });
  const [statusTarget, setStatusTarget] = useState<ChartOfAccountDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState<ChartOfAccountType | "all">("all");
  const [scopeFilter, setScopeFilter] = useState<ChartOfAccountScope | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const [accountsResult, outletsResult] = await Promise.all([getChartOfAccounts(), getOutlets()]);
      setAccounts(accountsResult);
      setOutlets(outletsResult);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat data chart of accounts."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredAccounts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return [...accounts]
      .filter((account) => {
        if (!normalizedKeyword) {
          return true;
        }

        return (
          account.accountCode.toLowerCase().includes(normalizedKeyword)
          || account.accountName.toLowerCase().includes(normalizedKeyword)
        );
      })
      .filter((account) => (typeFilter === "all" ? true : account.accountType === typeFilter))
      .filter((account) => {
        if (scopeFilter === "all") {
          return true;
        }

        return scopeFilter === "business" ? !account.outletId : Boolean(account.outletId);
      })
      .filter((account) => {
        if (statusFilter === "all") {
          return true;
        }

        return statusFilter === "active" ? account.isActive : !account.isActive;
      })
      .sort((left, right) => left.accountCode.localeCompare(right.accountCode, "id-ID"));
  }, [accounts, keyword, scopeFilter, statusFilter, typeFilter]);

  function openCreateModal() {
    setSubmitError(null);
    setModalState({
      open: true,
      mode: "create",
      account: null,
    });
  }

  function openEditModal(account: ChartOfAccountDto) {
    setSubmitError(null);
    setModalState({
      open: true,
      mode: "edit",
      account,
    });
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    setModalState({
      open: false,
      mode: "create",
      account: null,
    });
    setSubmitError(null);
  }

  async function handleSubmit(values: ChartOfAccountFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      accountCode: values.accountCode.trim(),
      accountName: values.accountName.trim(),
      accountType: values.accountType as ChartOfAccountType,
      isCashBank: values.accountType === "asset" ? values.isCashBank : false,
      outletId: values.scope === "outlet" ? values.outletId || null : null,
      parentAccountId: values.parentAccountId || null,
    };

    try {
      if (modalState.mode === "create") {
        await createChartOfAccount(payload);
        setSuccessMessage(`Akun ${payload.accountCode} berhasil dibuat.`);
      } else {
        await updateChartOfAccount(modalState.account.id, {
          ...payload,
          isActive: values.isActive,
        });
        setSuccessMessage(`Akun ${payload.accountCode} berhasil diperbarui.`);
      }

      closeModal();
      await loadData();
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal menyimpan akun."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusConfirm() {
    if (!statusTarget) {
      return;
    }

    setIsUpdatingStatus(true);
    setError(null);

    try {
      await updateChartOfAccountStatus(statusTarget.id, { isActive: !statusTarget.isActive });
      setSuccessMessage(
        statusTarget.isActive
          ? `Akun ${statusTarget.accountCode} berhasil dinonaktifkan.`
          : `Akun ${statusTarget.accountCode} berhasil diaktifkan kembali.`,
      );
      setStatusTarget(null);
      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memperbarui status akun."));
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Chart of Accounts"
      description="Kelola master akun untuk pemasukan, pengeluaran, dan laporan keuangan MorrusPOS."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <AppTableShell
        title="Daftar akun"
        description="Akun global business dan akun khusus outlet dikelola dalam satu pusat keuangan."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              Panduan COA
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Tambah akun
            </button>
          </div>
        }
      >
        <div className="grid gap-3 border-b border-gray-200 p-4 dark:border-gray-800 md:grid-cols-4">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Cari kode atau nama akun"
            className="h-11 rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
          />

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as ChartOfAccountType | "all")}
            className="h-11 rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
          >
            <option value="all">Semua tipe</option>
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
            <option value="equity">Equity</option>
            <option value="revenue">Revenue</option>
            <option value="cogs">COGS</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={scopeFilter}
            onChange={(event) => setScopeFilter(event.target.value as ChartOfAccountScope | "all")}
            className="h-11 rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
          >
            <option value="all">Semua scope</option>
            <option value="business">Business</option>
            <option value="outlet">Outlet</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}
            className="h-11 rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
          >
            <option value="active">Akun aktif</option>
            <option value="inactive">Akun nonaktif</option>
            <option value="all">Semua status</option>
          </select>
        </div>

        {isLoading ? (
          <AppLoader label="Memuat chart of accounts..." />
        ) : filteredAccounts.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada akun"
              description="Tambahkan akun pertama untuk memulai master keuangan MorrusPOS."
              status="Empty"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["Kode Akun", "Nama Akun", "Tipe", "Scope", "Parent", "Cash/Bank", "Status", "Diupdate", "Aksi"].map((column) => (
                  <th
                    key={column}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="align-top">
                  <td className="px-6 py-4 font-mono text-sm font-semibold text-gray-900 dark:text-white">
                    {account.accountCode}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{account.accountName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      {getAccountTypeLabel(account.accountType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {account.outletName ? `Outlet: ${account.outletName}` : "Business"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {account.parentAccountName ?? "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        account.isCashBank
                          ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {account.isCashBank ? "Kas/Bank" : "Bukan Kas/Bank"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        account.isActive
                          ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                          : "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300"
                      }`}
                    >
                      {account.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(account.updatedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(account)}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusTarget(account)}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                          account.isActive
                            ? "border-warning-200 text-warning-700 dark:border-warning-500/20 dark:text-warning-300"
                            : "border-success-200 text-success-700 dark:border-success-500/20 dark:text-success-300"
                        }`}
                      >
                        {account.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AppTableShell>

      <ChartOfAccountFormModal
        open={modalState.open}
        mode={modalState.mode}
        account={modalState.account}
        accounts={accounts}
        outlets={outlets}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(statusTarget)}
        title={statusTarget?.isActive ? "Nonaktifkan akun" : "Aktifkan akun"}
        description={
          statusTarget?.isActive
            ? `Akun ${statusTarget?.accountCode ?? ""} akan dinonaktifkan dan tidak bisa dipakai untuk transaksi baru.`
            : `Akun ${statusTarget?.accountCode ?? ""} akan diaktifkan kembali dan bisa dipakai lagi.`
        }
        confirmLabel={statusTarget?.isActive ? "Nonaktifkan akun" : "Aktifkan akun"}
        isBusy={isUpdatingStatus}
        onCancel={() => setStatusTarget(null)}
        onConfirm={() => void handleStatusConfirm()}
      />

      {isGuideOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:p-6"
          onClick={() => setIsGuideOpen(false)}
        >
          <div
            className="my-8 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Panduan Chart of Accounts (COA)</h3>
                <p className="text-xs text-gray-500">Referensi informatif — tidak mengubah konfigurasi akun Anda</p>
              </div>
              <button
                type="button"
                onClick={() => setIsGuideOpen(false)}
                className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto p-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              <section>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">1. Tujuan COA</h4>
                <p className="mt-1">COA adalah daftar terstruktur semua akun keuangan bisnis Anda. COA yang rapi membantu pencatatan transaksi, arus kas, laba rugi, dan buku besar menjadi konsisten dan mudah diaudit.</p>
              </section>
              <section>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">2. Kode & Nama Akun</h4>
                <p className="mt-1"><span className="font-semibold">Kode akun</span> adalah identitas unik (mis. 1001, 4001) yang memudahkan pencarian dan pengurutan. <span className="font-semibold">Nama akun</span> menjelaskan fungsi akun (mis. Kas Tunai Outlet). Gunakan kode yang singkat, konsisten, dan berkelanjutan.</p>
              </section>
              <section>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">3. Lima Jenis Akun</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li><span className="font-semibold">Asset (Aset)</span> — harta: Kas/Bank, Piutang, Persediaan.</li>
                  <li><span className="font-semibold">Liability (Kewajiban)</span> — utang: Hutang Supplier, Hutang Bank.</li>
                  <li><span className="font-semibold">Equity (Modal)</span> — modal pemilik & laba ditahan.</li>
                  <li><span className="font-semibold">Revenue (Pendapatan)</span> — Penjualan.</li>
                  <li><span className="font-semibold">COGS / Expense (Beban)</span> — Harga Pokok Penjualan dan Beban Operasional.</li>
                </ul>
                <p className="mt-2 text-xs text-gray-500">Pemilihan jenis menentukan posisi di laporan laba rugi & neraca.</p>
              </section>
              <section>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">4. Akun Induk & Subakun</h4>
                <p className="mt-1">Induk akun (mis. 1000 Kas & Bank) dapat memiliki subakun (1001 Kas Tunai, 1002 Bank BCA). Induk membantu ringkasan, subakun memberi detail. Pilih induk saat membuat akun agar struktur bertingkat.</p>
              </section>
              <section>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">5. Akun Kas/Bank</h4>
                <p className="mt-1">Tandai akun <span className="font-semibold">Asset</span> yang mewakili uang tunai/rekening sebagai <span className="font-semibold">Kas/Bank</span>. Hanya akun ini yang muncul di laporan arus kas dan pilihan pembayaran kas.</p>
              </section>
              <section>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">6. Aktif & Nonaktif</h4>
                <p className="mt-1">Akun <span className="font-semibold">Aktif</span> dapat dipakai transaksi baru. <span className="font-semibold">Nonaktif</span> disembunyikan dari pilihan tetapi tetap menyimpan histori jurnal. Nonaktifkan akun usang daripada menghapus.</p>
              </section>
              <section>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">7. Dampak pada Laporan</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Arus Kas hanya membaca akun Asset bertanda Kas/Bank.</li>
                  <li>Laba Rugi membaca Revenue, COGS, Expense (Revenue - COGS = Laba Kotor).</li>
                  <li>Buku Besar menampilkan semua mutasi per akun secara kronologis.</li>
                </ul>
              </section>
              <section className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/50">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">8. Contoh Struktur POS Sesuai Aplikasi</h4>
                <div className="mt-2 grid gap-3 text-xs font-mono sm:grid-cols-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Asset</p>
                    <p>1000 Kas & Bank</p>
                    <p className="pl-3">1001 Kas Tunai Outlet</p>
                    <p className="pl-3">1002 Bank BCA</p>
                    <p>1100 Piutang Usaha</p>
                    <p>1200 Persediaan Barang</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Liability</p>
                    <p>2000 Hutang Supplier</p>
                    <p className="font-semibold text-gray-900 dark:text-white">Equity</p>
                    <p>3000 Modal Pemilik</p>
                    <p className="font-semibold text-gray-900 dark:text-white">Revenue</p>
                    <p>4000 Penjualan</p>
                    <p className="font-semibold text-gray-900 dark:text-white">COGS</p>
                    <p>5000 HPP</p>
                    <p className="font-semibold text-gray-900 dark:text-white">Expense</p>
                    <p>6000 Beban Operasional (Gaji, Sewa, Listrik)</p>
                    <p>7000 Pendapatan/Beban Lainnya</p>
                  </div>
                </div>
              </section>
              <section>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">9. Tindakan Praktis</h4>
                <ol className="mt-2 list-decimal space-y-2 pl-5">
                  <li><span className="font-semibold">Membuat akun baru:</span> Klik “Tambah akun” → isi Kode & Nama → pilih Jenis → pilih Scope (Business untuk global, Outlet untuk khusus cabang) → simpan.</li>
                  <li><span className="font-semibold">Memilih induk akun:</span> Pada “Induk Akun”, pilih akun parent sejenis (mis. Kas Tunai di bawah Kas & Bank). Kosongkan jika akun tertinggi.</li>
                  <li><span className="font-semibold">Menandai Kas/Bank:</span> Hanya untuk jenis Asset. Aktifkan toggle Kas/Bank jika akun memang menyimpan uang.</li>
                  <li><span className="font-semibold">Kapan dinonaktifkan:</span> Jika akun salah buat, duplikat, atau sudah tidak dipakai (mis. outlet tutup, bank tidak dipakai). Nonaktif lebih aman daripada hapus agar histori tetap valid.</li>
                </ol>
              </section>
              <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                Panduan ini bersifat informatif dan tidak membuat template akun atau mengubah konfigurasi COA. Semua perubahan tetap melalui tombol “Tambah akun” / “Edit”.
              </p>
            </div>
            <div className="flex shrink-0 justify-end border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <button type="button" onClick={() => setIsGuideOpen(false)} className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white">
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedPageShell>
  );
}
