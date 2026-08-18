import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { FieldErrorText, FormCard } from "../../../components/forms";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { useAuth } from "../../auth/hooks/useAuth";
import { isOwner } from "../../auth/utils/access";
import { getOutlets } from "../../outlets/api/outletsApi";
import { useOutlet } from "../../outlets/hooks/useOutlet";
import type { OutletLookupDto } from "../../outlets/types/outlet";
import { getErrorMessage } from "../../../utils/errors";
import { useCashierSession } from "../hooks/useCashierSession";
import {
  recordPettyCash,
  getPettyCashExpenses,
} from "../api/cashierSessionsApi";
import type { PettyCashExpenseDto } from "../types/cashier";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("id-ID");
}

export default function CashierSessionPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { selectedOutletId, setSelectedOutletId } = useOutlet();
  const { currentSession, isLoading, openSession, closeSession, refreshCurrentSession } = useCashierSession();
  const [outlets, setOutlets] = useState<OutletLookupDto[]>([]);
  const [openingCash, setOpeningCash] = useState("0");
  const [actualCash, setActualCash] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Petty cash states
  const [pettyExpenses, setPettyExpenses] = useState<PettyCashExpenseDto[]>([]);
  const [pettyAmount, setPettyAmount] = useState("");
  const [pettyDesc, setPettyDesc] = useState("");
  const [pettyCategory, setPettyCategory] = useState("Lain-lain");
  const [isRecordingPetty, setIsRecordingPetty] = useState(false);
  const [pettyError, setPettyError] = useState<string | null>(null);

  const ownerMode = isOwner(session?.role);
  const activeOutlets = useMemo(
    () => outlets.filter((outlet) => outlet.isActive),
    [outlets],
  );

  useEffect(() => {
    async function loadOutlets() {
      if (!ownerMode) {
        return;
      }

      try {
        setOutlets(await getOutlets());
      } catch {
        // handled by submit and session errors
      }
    }

    void loadOutlets();
  }, [ownerMode]);

  useEffect(() => {
    async function loadPettyExpenses() {
      if (!currentSession) return;
      try {
        const list = await getPettyCashExpenses(currentSession.id);
        setPettyExpenses(list);
      } catch (err) {
        console.error("Gagal memuat pengeluaran kas kecil", err);
      }
    }
    void loadPettyExpenses();
  }, [currentSession]);

  async function handleOpenSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);

    if (ownerMode && !selectedOutletId) {
      setSubmitError("Owner harus memilih outlet kerja sebelum membuka sesi.");
      return;
    }

    const parsedOpeningCash = Number(openingCash);
    if (!Number.isFinite(parsedOpeningCash) || parsedOpeningCash < 0) {
      setSubmitError("Kas awal harus berupa angka 0 atau lebih.");
      return;
    }

    setIsSubmitting(true);

    try {
      const nextSession = await openSession(parsedOpeningCash);
      setSuccessMessage(`Sesi kasir untuk ${nextSession.outletName} berhasil dibuka.`);
      navigate("/pos");
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal membuka sesi kasir."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRecordPettyCash(event: React.FormEvent) {
    event.preventDefault();
    if (!currentSession) return;

    const amount = Number(pettyAmount);
    if (isNaN(amount) || amount <= 0) {
      setPettyError("Nominal pengeluaran harus lebih dari 0.");
      return;
    }
    if (!pettyDesc.trim()) {
      setPettyError("Deskripsi pengeluaran wajib diisi.");
      return;
    }

    setIsRecordingPetty(true);
    setPettyError(null);

    try {
      const newExpense = await recordPettyCash(currentSession.id, {
        amount,
        description: pettyDesc.trim(),
        category: pettyCategory
      });
      setPettyExpenses((prev) => [newExpense, ...prev]);
      setPettyAmount("");
      setPettyDesc("");
      setPettyCategory("Lain-lain");
      
      // Refresh session expected cash
      await refreshCurrentSession();
    } catch (requestError) {
      setPettyError(getErrorMessage(requestError, "Gagal mencatat pengeluaran kas kecil."));
    } finally {
      setIsRecordingPetty(false);
    }
  }

  async function handleCloseSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);

    const parsedActualCash = Number(actualCash);
    if (!Number.isFinite(parsedActualCash) || parsedActualCash < 0) {
      setSubmitError("Kas aktual harus berupa angka 0 atau lebih.");
      return;
    }

    setIsSubmitting(true);

    try {
      const closedSession = await closeSession(parsedActualCash);
      setSuccessMessage(`Sesi kasir ${closedSession.outletName} berhasil ditutup.`);
      setActualCash("");
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal menutup sesi kasir."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const expectedCash = currentSession?.expectedCash ?? 0;
  const nonCashSummary = useMemo(() => {
    if (!currentSession?.paymentsSummary) return [];
    return Object.entries(currentSession.paymentsSummary)
      .filter(([method]) => method !== "cash")
      .map(([method, amount]) => ({
        method,
        amount
      }));
  }, [currentSession]);

  const computedVariance = useMemo(() => {
    if (!actualCash) return 0;
    const actual = Number(actualCash);
    return isNaN(actual) ? 0 : actual - expectedCash;
  }, [actualCash, expectedCash]);

  return (
    <ProtectedPageShell
      title="Sesi Kasir"
      description="Buka dan tutup shift kasir berdasarkan outlet operasional aktif sebelum masuk ke layar POS."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={submitError} />

      {isLoading ? (
        <AppLoader label="Memuat sesi kasir..." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          {!currentSession ? (
            <>
              <FormCard
                title="Outlet kerja"
                description="Owner dapat memilih outlet operasional. Admin dan Kasir memakai outlet yang terikat pada akun."
              >
                {ownerMode ? (
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Outlet aktif
                    </span>
                    <select
                      value={selectedOutletId ?? ""}
                      onChange={(event) => setSelectedOutletId(event.target.value || null)}
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-955 dark:text-white"
                    >
                      <option value="">Pilih outlet</option>
                      {activeOutlets.map((outlet) => (
                        <option key={outlet.id} value={outlet.id}>
                          {outlet.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-normal">
                    Outlet kerja mengikuti akun login: <span className="font-semibold">{session?.outletId ?? "-"}</span>
                  </p>
                )}
              </FormCard>

              <FormCard
                title="Buka sesi baru"
                description="Satu user hanya boleh memiliki satu sesi kasir aktif pada outlet yang sama."
              >
                <form className="space-y-4" onSubmit={handleOpenSession}>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Kas awal <span className="text-error-500">*</span>
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={openingCash}
                      onChange={(event) => setOpeningCash(event.target.value)}
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-955 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-400">Harus berupa angka 0 atau lebih.</p>
                  </label>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? "Membuka sesi..." : "Buka sesi kasir"}
                  </button>
                </form>
              </FormCard>
            </>
          ) : (
            <>
              <div className="space-y-6">
                <FormCard
                  title="Sesi Aktif & Rekonsiliasi Kas"
                  description="Informasi sesi kasir berjalan serta laporan penerimaan laci kas secara detail."
                >
                  <div className="space-y-5">
                    <dl className="grid gap-4 md:grid-cols-2 text-sm">
                      <div>
                        <dt className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">Outlet / Kasir</dt>
                        <dd className="mt-1 font-semibold text-gray-950 dark:text-white">
                          {currentSession.outletName} · {currentSession.userName}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">Waktu Buka</dt>
                        <dd className="mt-1 font-semibold text-gray-950 dark:text-white">
                          {formatDateTime(currentSession.openingTime)}
                        </dd>
                      </div>
                    </dl>

                    <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-2">
                      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                        <span>Modal Awal (Kas Awal):</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(currentSession.openingCash)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                        <span>Penerimaan Tunai (Sales + Pelunasan):</span>
                        <span className="font-semibold text-success-700 dark:text-success-400">+{formatCurrency(currentSession.totalCashReceived)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                        <span>Pengeluaran Kas Kecil (Petty Cash):</span>
                        <span className="font-semibold text-error-700 dark:text-error-400">-{formatCurrency(currentSession.totalPettyCashExpenses)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-dashed border-gray-200 dark:border-gray-800 pt-2 text-sm font-semibold text-gray-900 dark:text-white">
                        <span>Estimasi Kas di Laci (Expected Cash):</span>
                        <span className="text-base font-bold">{formatCurrency(expectedCash)}</span>
                      </div>
                    </div>

                    {nonCashSummary.length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                        <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Ringkasan Non-Tunai (EDC/QRIS)</h5>
                        <div className="grid gap-2 grid-cols-2">
                          {nonCashSummary.map((sum) => (
                            <div key={sum.method} className="rounded-xl border border-gray-100 dark:border-gray-900 p-2 text-xs bg-gray-50/50 dark:bg-gray-950/20">
                              <span className="text-gray-400 uppercase">{sum.method}</span>
                              <p className="font-bold text-gray-900 dark:text-white mt-0.5">{formatCurrency(sum.amount)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => navigate("/pos")}
                        className="w-full justify-center inline-flex items-center rounded-xl bg-brand-500 hover:bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition shadow-lg hover:shadow-brand-500/20"
                      >
                        Buka POS
                      </button>
                    </div>

                    <form className="space-y-4 border-t border-gray-200 pt-5 dark:border-gray-800" onSubmit={handleCloseSession}>
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                          Kas aktual saat tutup sesi <span className="text-error-500">*</span>
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={actualCash}
                          onChange={(event) => setActualCash(event.target.value)}
                          placeholder="Hitung koin/kertas di laci kas"
                          className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-955 dark:text-white"
                        />
                        <FieldErrorText message={!actualCash ? "Kas aktual wajib diisi untuk tutup sesi." : undefined} />
                      </label>

                      {actualCash && (
                        <div className={`rounded-2xl p-4 text-sm border ${
                          computedVariance === 0 
                            ? "bg-success-50 dark:bg-success-950/20 border-success-200 dark:border-success-800/30 text-success-800 dark:text-success-300"
                            : computedVariance > 0
                            ? "bg-brand-50 dark:bg-brand-950/20 border-brand-200 dark:border-brand-800/30 text-brand-800 dark:text-brand-300"
                            : "bg-error-50 dark:bg-error-950/20 border-error-200 dark:border-error-800/30 text-error-800 dark:text-error-300"
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Selisih Kas:</span>
                            <span className="font-bold text-base">
                              {computedVariance === 0 
                                ? "Cocok (Pas)" 
                                : (computedVariance > 0 ? "+" : "") + formatCurrency(computedVariance)}
                            </span>
                          </div>
                          <p className="text-xs mt-1 font-normal opacity-85">
                            {computedVariance === 0 
                              ? "Uang laci cocok dengan pencatatan sistem." 
                              : computedVariance > 0 
                              ? "Uang laci lebih besar dibanding perkiraan sistem." 
                              : "Uang laci kurang dibanding perkiraan sistem."}
                          </p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting || !actualCash}
                        className="inline-flex w-full justify-center items-center rounded-2xl bg-error-600 hover:bg-error-700 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSubmitting ? "Memproses penutupan shift..." : "Tutup Sesi & Shift"}
                      </button>
                    </form>
                  </div>
                </FormCard>
              </div>

              <FormCard
                title="Kas Kecil / Pengeluaran Toko"
                description="Catat pengeluaran operasional harian yang diambil langsung dari uang kas di laci POS."
              >
                <form onSubmit={handleRecordPettyCash} className="space-y-4">
                  {pettyError && <InlineAlert tone="error" message={pettyError} />}
                  
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Nominal Pengeluaran
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={pettyAmount}
                        onChange={(e) => setPettyAmount(e.target.value)}
                        placeholder="Contoh: 15000"
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-955 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Kategori
                      </label>
                      <select
                        value={pettyCategory}
                        onChange={(e) => setPettyCategory(e.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-955 dark:text-white"
                      >
                        <option value="ATK">ATK</option>
                        <option value="Konsumsi">Konsumsi</option>
                        <option value="Transportasi">Transportasi</option>
                        <option value="Kemasan">Kemasan</option>
                        <option value="Operasional">Operasional</option>
                        <option value="Lain-lain">Lain-lain</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Deskripsi / Keperluan
                    </label>
                    <input
                      type="text"
                      value={pettyDesc}
                      onChange={(e) => setPettyDesc(e.target.value)}
                      placeholder="Contoh: Beli kantong plastik ukuran jumbo"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-955 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isRecordingPetty || !pettyAmount || !pettyDesc}
                    className="w-full h-11 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm flex items-center justify-center transition-all shadow-lg"
                  >
                    {isRecordingPetty ? "Mencatat..." : "Catat Kas Keluar"}
                  </button>
                </form>

                <div className="border-t border-gray-200 pt-5 mt-5 dark:border-gray-800">
                  <h5 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Histori Pengeluaran Sesi Ini</h5>
                  
                  {pettyExpenses.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">Belum ada pengeluaran kas kecil pada sesi ini.</p>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {pettyExpenses.map((exp) => (
                        <div key={exp.id} className="flex justify-between items-start rounded-xl border border-gray-100 dark:border-gray-900 p-3 text-xs bg-gray-50/50 dark:bg-gray-950/20">
                          <div>
                            <span className="inline-block px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 font-semibold mb-1">
                              {exp.category}
                            </span>
                            <p className="font-semibold text-gray-900 dark:text-white">{exp.description}</p>
                            <p className="text-gray-400 mt-1 font-normal">Dicatat oleh {exp.processedByName} · {new Date(exp.createdAt).toLocaleTimeString("id-ID")}</p>
                          </div>
                          <span className="font-bold text-error-600 dark:text-error-400">-{formatCurrency(exp.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FormCard>
            </>
          )}
        </div>
      )}
    </ProtectedPageShell>
  );
}
