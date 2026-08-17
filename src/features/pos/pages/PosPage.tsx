import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { useAuth } from "../../auth/hooks/useAuth";
import { isOwner } from "../../auth/utils/access";
import { useOutlet } from "../../outlets/hooks/useOutlet";
import { useRealtime } from "../../../lib/realtime/hooks";
import { getErrorMessage } from "../../../utils/errors";
import { getProducts } from "../../products/api/productsApi";
import type { ProductDto } from "../../products/types/product";
import { lookupCustomers, updateCustomer } from "../../customers/api/customersApi";
import type { CustomerListItemDto } from "../../customers/types/customer";
import { API_BASE_URL } from "../../../api/client/config";
import { useCashierSession } from "../hooks/useCashierSession";
import { checkoutTransaction, previewTransactionPricing } from "../../transactions/api/transactionsApi";
import type {
  CheckoutRequest,
  PaymentRequest,
} from "../../transactions/types/transaction";
import type { PricingBreakdownDto } from "../../pricing/types/pricing";

type CartItem = {
  productId: string;
  productVariantId?: string | null;
  productName: string;
  sku: string;
  unit: string;
  qty: number | "";
  unitPrice: number;
  discountAmount: number | "";
  availableStock: number;
  selectedModifiers?: string[] | null;
  selectedModifiersJson?: string | null;
};

type PaymentRow = {
  id: string;
  method: string;
  amount: string;
  referenceNumber: string;
};

const defaultPaymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "qris", label: "QRIS" },
  { value: "transfer", label: "Transfer" },
  { value: "edc", label: "EDC" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function createPaymentRow(): PaymentRow {
  return {
    id: crypto.randomUUID(),
    method: "cash",
    amount: "",
    referenceNumber: "",
  };
}



export default function PosPage() {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const { session } = useAuth();
  const { selectedOutletId } = useOutlet();
  const { currentSession, isLoading: isSessionLoading, refreshCurrentSession } = useCashierSession();
  const { onStockUpdate } = useRealtime();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([createPaymentRow()]);
  const [step, setStep] = useState<"catalog" | "checkout">("catalog");
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isPricingLoading, setIsPricingLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [pricing, setPricing] = useState<PricingBreakdownDto | null>(null);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerListItemDto[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListItemDto | null>(null);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  // States for Tempo (Kasbon) & Profile Completion
  const [isTempo, setIsTempo] = useState(false);
  const [tempoDays, setTempoDays] = useState(14);
  const [ktpInput, setKtpInput] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showProfileUpdateModal, setShowProfileUpdateModal] = useState(false);

  // States for Variant Selection Modal
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedVariantProduct, setSelectedVariantProduct] = useState<ProductDto | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);

  const ownerMode = isOwner(session?.role);
  const effectiveOutletId = ownerMode ? selectedOutletId : session?.outletId ?? null;

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isSessionLoading && !currentSession) {
      navigate("/cashier/session", { replace: true });
    }
  }, [currentSession, isSessionLoading, navigate]);

  async function loadProducts() {
    if (!effectiveOutletId || !currentSession) {
      setProducts([]);
      setIsLoadingProducts(false);
      return;
    }

    setIsLoadingProducts(true);
    setError(null);

    try {
      const result = await getProducts({ outletId: effectiveOutletId });
      setProducts(result);
      setCart((current) =>
        current.map((item) => {
          const matched = result.find((product) => product.id === item.productId);
          return matched
            ? {
                ...item,
                unitPrice: matched.basePrice,
                availableStock: matched.qtyOnHand,
              }
            : item;
        }),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat produk untuk POS."));
    } finally {
      setIsLoadingProducts(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, [effectiveOutletId, currentSession?.id]);

  useEffect(() => {
    const unsubscribe = onStockUpdate((event) => {
      if (event.outletId !== effectiveOutletId) {
        return;
      }

      void loadProducts();
    });

    return unsubscribe;
  }, [effectiveOutletId, onStockUpdate]);

  const filteredProducts = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      if (product.qtyOnHand <= 0) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      return (
        product.name.toLowerCase().includes(normalized) ||
        product.sku.toLowerCase().includes(normalized) ||
        (product.barcode ?? "").toLowerCase().includes(normalized)
      );
    });
  }, [products, searchTerm]);

  const fallbackSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * (Number(item.qty) || 0), 0),
    [cart],
  );
  const fallbackManualDiscountTotal = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.discountAmount) || 0), 0),
    [cart],
  );
  const subtotal = pricing?.subtotal ?? fallbackSubtotal;
  const manualDiscountTotal = pricing?.manualDiscountTotal ?? fallbackManualDiscountTotal;
  const promoDiscountTotal = pricing?.promoDiscountTotal ?? 0;
  const voucherDiscountTotal = pricing?.voucherDiscountTotal ?? 0;
  const discountTotal = manualDiscountTotal + promoDiscountTotal + voucherDiscountTotal;
  const serviceChargeTotal = pricing?.serviceChargeTotal ?? 0;
  const taxTotal = pricing?.taxTotal ?? 0;
  const grandTotal = pricing?.grandTotal ?? Math.max(0, fallbackSubtotal - fallbackManualDiscountTotal);
  const totalPayment = useMemo(
    () => payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0),
    [payments],
  );
  const hasCashPayment = useMemo(
    () => payments.some((p) => p.method === "cash"),
    [payments],
  );
  const paymentBalanced = useMemo(() => {
    if (grandTotal <= 0) return false;
    if (isTempo) {
      return selectedCustomer !== null && totalPayment < grandTotal;
    }
    if (hasCashPayment) {
      return totalPayment >= grandTotal;
    }
    return totalPayment === grandTotal;
  }, [totalPayment, grandTotal, hasCashPayment, isTempo, selectedCustomer]);

  const changeAmount = useMemo(() => {
    if (isTempo) return 0;
    if (totalPayment > grandTotal && hasCashPayment) {
      return totalPayment - grandTotal;
    }
    return 0;
  }, [totalPayment, grandTotal, hasCashPayment, isTempo]);

  const creditLimitExceeded = useMemo(() => {
    if (!isTempo || !selectedCustomer) return false;
    const dueAmount = grandTotal - totalPayment;
    const currentDebt = selectedCustomer.currentDebt || 0;
    const limit = selectedCustomer.creditLimit || 0;
    return currentDebt + dueAmount > limit;
  }, [isTempo, selectedCustomer, grandTotal, totalPayment]);

  const customerProfileIncomplete = useMemo(() => {
    if (!isTempo || !selectedCustomer) return false;
    return !selectedCustomer.ktpNumber?.trim() || !selectedCustomer.address?.trim();
  }, [isTempo, selectedCustomer]);

  const canCheckout = useMemo(() => {
    if (isSubmitting || isPricingLoading || cart.length === 0) return false;
    if (isTempo) {
      return selectedCustomer !== null &&
             totalPayment < grandTotal &&
             !creditLimitExceeded &&
             !customerProfileIncomplete;
    }
    return paymentBalanced;
  }, [isSubmitting, isPricingLoading, cart.length, isTempo, selectedCustomer, totalPayment, grandTotal, creditLimitExceeded, customerProfileIncomplete, paymentBalanced]);

  useEffect(() => {
    if (!effectiveOutletId || cart.length === 0) {
      setPricing(null);
      setPricingError(null);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsPricingLoading(true);
      setPricingError(null);

      try {
        const result = await previewTransactionPricing({
          outletId: effectiveOutletId,
          channel: "pos",
          voucherCode: voucherCode.trim() || null,
          items: cart.map((item) => ({
            productId: item.productId,
            qty: Number(item.qty) || 0,
            unitPrice: item.unitPrice,
            discountAmount: Number(item.discountAmount) || 0,
          })),
        });
        setPricing(result);
      } catch (requestError) {
        setPricing(null);
        setPricingError(getErrorMessage(requestError, "Gagal menghitung pricing checkout."));
      } finally {
        setIsPricingLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [cart, effectiveOutletId, voucherCode]);

  useEffect(() => {
    if (!customerQuery.trim() || selectedCustomer?.phone === customerQuery.trim()) {
      setCustomerResults([]);
      setIsLoadingCustomers(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsLoadingCustomers(true);

      try {
        setCustomerResults(await lookupCustomers(customerQuery.trim(), 8));
      } catch {
        setCustomerResults([]);
      } finally {
        setIsLoadingCustomers(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [customerQuery, selectedCustomer?.phone]);

  function addToCart(product: ProductDto) {
    if (product.hasVariants) {
      setSelectedVariantProduct(product);
      setSelectedVariantId(null);
      setSelectedModifiers([]);
      setShowVariantModal(true);
      return;
    }

    if (product.qtyOnHand <= 0) {
      return;
    }

    setWarning(null);
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id && !item.productVariantId);
      if (existing) {
        const nextQty = (Number(existing.qty) || 0) + 1;
        if (nextQty > product.qtyOnHand) {
          setWarning(`Stok ${product.name} tidak cukup untuk menambah qty lagi.`);
          return current;
        }

        return current.map((item) =>
          item.productId === product.id && !item.productVariantId ? { ...item, qty: nextQty, availableStock: product.qtyOnHand } : item,
        );
      }

      return [
        ...current,
        {
          productId: product.id,
          productVariantId: null,
          productName: product.name,
          sku: product.sku,
          unit: product.unit,
          qty: 1,
          unitPrice: product.basePrice,
          discountAmount: 0,
          availableStock: product.qtyOnHand,
        },
      ];
    });
  }

  function updateCartItem(productId: string, key: "qty" | "discountAmount", value: string) {
    setWarning(null);
    setCart((current) =>
      current.map((item) => {
        if (item.productId !== productId) {
          return item;
        }

        if (value === "") {
          return { ...item, [key]: "" };
        }

        const numericValue = Number(value);
        if (isNaN(numericValue) || !Number.isFinite(numericValue)) {
          return item;
        }

        if (key === "qty") {
          if (numericValue < 0) {
            return item;
          }
          if (numericValue > item.availableStock) {
            setWarning(`Qty ${item.productName} melebihi stok tersedia.`);
            return item;
          }

          return { ...item, qty: numericValue };
        }

        const lineSubtotal = item.unitPrice * (Number(item.qty) || 0);
        if (numericValue < 0 || numericValue > lineSubtotal) {
          setWarning(`Diskon ${item.productName} tidak valid.`);
          return item;
        }

        return { ...item, discountAmount: numericValue };
      }),
    );
  }

  function removeCartItem(productId: string) {
    setCart((current) => current.filter((item) => item.productId !== productId));
  }

  function updatePaymentRow(id: string, key: keyof PaymentRow, value: string) {
    setPayments((current) =>
      current.map((payment) => (payment.id === id ? { ...payment, [key]: value } : payment)),
    );
  }

  function addPaymentRow() {
    setPayments((current) => [...current, createPaymentRow()]);
  }

  function removePaymentRow(id: string) {
    setPayments((current) => (current.length === 1 ? current : current.filter((payment) => payment.id !== id)));
  }

  async function handleCheckout() {
    if (!effectiveOutletId || !currentSession) {
      navigate("/cashier/session", { replace: true });
      return;
    }

    if (cart.length === 0) {
      setError("Keranjang masih kosong.");
      return;
    }

    if (cart.some((item) => (Number(item.qty) || 0) <= 0)) {
      setError("Jumlah item (Qty) harus minimal 1.");
      return;
    }

    if (isTempo) {
      if (!selectedCustomer) {
        setError("Pelanggan harus dipilih untuk transaksi piutang.");
        return;
      }
      if (customerProfileIncomplete) {
        setError("Data KTP dan Alamat pelanggan harus lengkap untuk transaksi piutang.");
        return;
      }
      if (creditLimitExceeded) {
        setError("Batas limit kredit pelanggan terlampaui.");
        return;
      }
    } else {
      if (!paymentBalanced) {
        setError("Total pembayaran harus sama dengan grand total sebelum checkout.");
        return;
      }
    }

    const nonCashWithoutRef = payments.some(
      (p) => p.method !== "cash" && !p.referenceNumber.trim()
    );
    if (nonCashWithoutRef) {
      setError("Nomor referensi wajib diisi untuk pembayaran non-tunai (Debit, Kredit, QRIS).");
      return;
    }

    const payload: CheckoutRequest = {
      id: crypto.randomUUID(),
      outletId: effectiveOutletId,
      cashierSessionId: currentSession.id,
      channel: "pos",
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      items: cart.map((item) => ({
        productId: item.productId,
        qty: Number(item.qty) || 0,
        unitPrice: item.unitPrice,
        discountAmount: Number(item.discountAmount) || 0,
      })),
      payments: (() => {
        if (isTempo && totalPayment === 0) {
          return [];
        }
        
        const nonCashTotal = payments
          .filter((p) => p.method !== "cash")
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        if (isTempo) {
          return payments
            .map<PaymentRequest>((payment) => ({
              method: payment.method,
              amount: Number(payment.amount) || 0,
              referenceNumber: payment.referenceNumber || null,
            }))
            .filter((p) => p.amount > 0);
        }

        const requiredCash = Math.max(0, grandTotal - nonCashTotal);
        let cashApplied = false;

        return payments
          .map<PaymentRequest>((payment) => {
            if (payment.method !== "cash") {
              return {
                method: payment.method,
                amount: Number(payment.amount) || 0,
                referenceNumber: payment.referenceNumber || null,
              };
            } else {
              const amount = cashApplied ? 0 : requiredCash;
              cashApplied = true;
              return {
                method: payment.method,
                amount: amount,
                referenceNumber: payment.referenceNumber || null,
              };
            }
          })
          .filter((p) => p.amount > 0);
      })(),
      voucherCode: voucherCode.trim() || null,
      appliedPromoCode: pricing?.appliedPromo?.code ?? null,
      customerId: selectedCustomer?.id ?? null,
      customerPhone: selectedCustomer?.phone ?? null,
      paymentDueDate: isTempo 
        ? new Date(Date.now() + tempoDays * 24 * 60 * 60 * 1000).toISOString() 
        : null
    };

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await checkoutTransaction(payload);
      setCart([]);
      setPayments([createPaymentRow()]);
      setVoucherCode("");
      setPricing(null);
      setCustomerQuery("");
      setSelectedCustomer(null);
      setCustomerResults([]);
      setIsTempo(false);
      setTempoDays(14);
      setStep("catalog");
      await loadProducts();
      await refreshCurrentSession();
      navigate(`/transactions/${result.id}`);
    } catch (requestError) {
      const message = getErrorMessage(requestError, "Checkout gagal diproses.");
      setError(message);
      if (message.toLowerCase().includes("sesi kasir")) {
        navigate("/cashier/session", { replace: true });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateProfile() {
    if (!selectedCustomer) return;
    if (!ktpInput.trim() || !addressInput.trim()) {
      setError("NIK KTP dan Alamat harus diisi.");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const updated = await updateCustomer(selectedCustomer.id, {
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
        email: selectedCustomer.email,
        isActive: selectedCustomer.isActive,
        creditLimit: selectedCustomer.creditLimit || 0,
        ktpNumber: ktpInput.trim(),
        address: addressInput.trim()
      });

      setSelectedCustomer(updated);
      setShowProfileUpdateModal(false);
      setError(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memperbarui profil pelanggan."));
    } finally {
      setIsUpdatingProfile(false);
    }
  }

  if (isSessionLoading) {
    return <AppLoader label="Memeriksa sesi kasir..." fullScreen />;
  }

  if (!currentSession) {
    return <AppLoader label="Mengalihkan ke sesi kasir..." fullScreen />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-600">POS Kasir</p>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {currentSession.outletName}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Sesi aktif oleh {currentSession.userName} · Kas awal {formatCurrency(currentSession.openingCash)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/cashier/session"
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-800 dark:text-gray-200"
            >
              Kelola sesi
            </Link>
            <Link
              to="/transactions"
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-800 dark:text-gray-200"
            >
              Histori transaksi
            </Link>
          </div>
        </div>
      </section>

      <InlineAlert tone="error" message={error} />
      <InlineAlert tone="info" message={warning} />
      <InlineAlert tone="error" message={pricingError} />

      <section className="w-full space-y-6">
        {step === "catalog" ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 space-y-3">
              <input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari produk berdasarkan nama, SKU, atau barcode"
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-955 dark:text-white"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Produk habis tidak ditampilkan di katalog penjualan kasir.
              </p>
            </div>

          {isLoadingProducts ? (
            <AppLoader label="Memuat katalog produk..." />
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredProducts.map((product) => {
                const outOfStock = product.qtyOnHand <= 0;
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => addToCart(product)}
                    className="flex gap-4 items-center rounded-2xl border border-gray-200 p-3 text-left transition hover:border-brand-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-800 dark:hover:border-brand-500/40 bg-white dark:bg-gray-900"
                  >
                    {/* Product Image Thumbnail */}
                    {product.imageUrl ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-855 bg-gray-50 dark:bg-gray-950 flex-shrink-0">
                        <img
                          src={`${API_BASE_URL}${product.imageUrl}`}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-lg font-bold text-gray-400 dark:text-gray-600 flex-shrink-0">
                        {product.name.substring(0, 1).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1 gap-1">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base leading-snug break-words">{product.name}</h3>
                      </div>

                      <div className="flex items-baseline gap-1 mt-1 text-sm font-bold text-brand-600 dark:text-brand-400">
                        <span>{formatCurrency(product.basePrice)}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal uppercase">/{product.unit}</span>
                      </div>

                      <div className="mt-1">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            outOfStock
                              ? "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300"
                              : "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                          }`}
                        >
                          Stok {product.qtyOnHand}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {cart.length > 0 && (
            <div className="mt-6 flex items-center justify-between rounded-2xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-900/30 dark:bg-brand-950/20">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {cart.length} Produk terpilih
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Estimasi subtotal: <span className="font-semibold text-brand-600 dark:text-brand-400">{formatCurrency(fallbackSubtotal)}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep("checkout")}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
              >
                Checkout & Bayar
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setStep("catalog")}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-955 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-3.5 w-3.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Kembali ke Katalog Produk
            </button>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Left Column: Cart items review */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Detail Keranjang ({cart.length} item)</h2>
              
              {cart.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Belum ada item di keranjang.
                </p>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{item.productName}</h3>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {item.sku} · stok {item.availableStock}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCartItem(item.productId)}
                        className="text-xs font-semibold text-error-700 dark:text-error-300"
                      >
                        Hapus
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Qty</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.qty}
                          onChange={(event) => updateCartItem(item.productId, "qty", event.target.value)}
                          onBlur={() => {
                            if (!item.qty || Number(item.qty) < 1) {
                              updateCartItem(item.productId, "qty", "1");
                            }
                          }}
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-955 dark:text-white"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Diskon item</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discountAmount}
                          onChange={(event) =>
                            updateCartItem(item.productId, "discountAmount", event.target.value)
                          }
                          onBlur={() => {
                            if (item.discountAmount === "" || Number(item.discountAmount) < 0) {
                              updateCartItem(item.productId, "discountAmount", "0");
                            }
                          }}
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-955 dark:text-white"
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatCurrency(item.unitPrice)} × {item.qty}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.unitPrice * (Number(item.qty) || 0) - (Number(item.discountAmount) || 0))}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right Column: Checkout Info & Payments */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Detail Pembayaran</h2>
              
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Customer checkout</h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Pilih guest atau cari customer berdasarkan nomor HP / nama.
                    </p>
                  </div>
                  {selectedCustomer ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustomerQuery("");
                        setCustomerResults([]);
                      }}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                    >
                      Kembali ke guest
                    </button>
                  ) : null}
                </div>

                {selectedCustomer ? (
                  <div className="mt-4 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:bg-brand-500/10 dark:text-brand-200">
                    <p className="font-semibold">{selectedCustomer.name}</p>
                    <p className="mt-1">{selectedCustomer.phone} · {selectedCustomer.customerCode}</p>
                    <div className="mt-2 border-t border-brand-100 dark:border-brand-500/20 pt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Limit Kredit:</span>
                        <span className="font-semibold">{formatCurrency(selectedCustomer.creditLimit || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hutang Berjalan:</span>
                        <span className="font-semibold text-error-700 dark:text-error-400">{formatCurrency(selectedCustomer.currentDebt || 0)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Sisa Limit:</span>
                        <span className="font-bold text-success-700 dark:text-success-400">
                          {formatCurrency(Math.max(0, (selectedCustomer.creditLimit || 0) - (selectedCustomer.currentDebt || 0)))}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <input
                      value={customerQuery}
                      onChange={(event) => setCustomerQuery(event.target.value)}
                      placeholder="Cari customer by HP atau nama"
                      className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                    />
                    {isLoadingCustomers ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Mencari customer...</p>
                    ) : customerResults.length > 0 ? (
                      <div className="space-y-2">
                        {customerResults.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setCustomerQuery(customer.phone);
                              setCustomerResults([]);
                            }}
                            className="flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-left transition hover:border-brand-300 dark:border-gray-800 dark:hover:border-brand-500/40"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{customer.phone} · {customer.customerCode}</p>
                            </div>
                            <span className="text-xs font-semibold text-brand-600 dark:text-brand-300">Pilih</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Mode default saat ini: guest.</p>
                    )}
                  </div>
                )}

                {selectedCustomer && (
                  <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isTempo}
                        onChange={(e) => {
                          setIsTempo(e.target.checked);
                          if (e.target.checked) {
                            // If checking, clean payments except what was already entered
                            // but usually they pay nothing or partial.
                          }
                        }}
                        className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Bayar Nanti (Kasbon / Tempo)</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">Simpan transaksi sebagai piutang pelanggan</p>
                      </div>
                    </label>

                    {isTempo && (
                      <div className="space-y-3 pl-8">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Durasi Jatuh Tempo
                          </label>
                          <select
                            value={tempoDays}
                            onChange={(e) => setTempoDays(Number(e.target.value))}
                            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                          >
                            <option value={7}>7 Hari</option>
                            <option value={14}>14 Hari</option>
                            <option value={30}>30 Hari</option>
                            <option value={45}>45 Hari</option>
                            <option value={60}>60 Hari</option>
                          </select>
                        </div>

                        {creditLimitExceeded && (
                          <div className="rounded-xl bg-error-50 dark:bg-error-950/20 border border-error-200 dark:border-error-800/30 p-3 text-xs text-error-700 dark:text-error-400">
                            <strong>Peringatan:</strong> Batas limit kredit pelanggan terlampaui! Rencana belanja baru melebihi limit kredit.
                          </div>
                        )}

                        {customerProfileIncomplete && (
                          <div className="rounded-xl bg-warning-50 dark:bg-warning-950/20 border border-warning-200 dark:border-warning-800/30 p-3 text-xs text-warning-800 dark:text-warning-300 space-y-2">
                            <div>
                              <strong>Perhatian:</strong> Data NIK KTP dan Alamat pelanggan wajib diisi untuk transaksi kasbon.
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setKtpInput(selectedCustomer.ktpNumber || "");
                                setAddressInput(selectedCustomer.address || "");
                                setShowProfileUpdateModal(true);
                              }}
                              className="w-full inline-flex justify-center rounded-lg bg-warning-600 px-3 py-2 text-xs font-semibold text-white hover:bg-warning-700"
                            >
                              Lengkapi Profil
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3 border-t border-gray-200 pt-5 dark:border-gray-800">
                <label className="block">
                  <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Kode voucher</span>
                  <input
                    value={voucherCode}
                    onChange={(event) => setVoucherCode(event.target.value)}
                    placeholder="Masukkan voucher jika ada"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </label>
                {isPricingLoading ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Menghitung pricing terbaru...</p>
                ) : null}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Diskon item manual</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(manualDiscountTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Promo otomatis</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(promoDiscountTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Voucher</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(voucherDiscountTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Service charge</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(serviceChargeTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Pajak</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(taxTotal)}</span>
                </div>
                {pricing?.appliedPromo ? (
                  <div className="rounded-2xl bg-brand-50 px-4 py-3 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">
                    Promo aktif: {pricing.appliedPromo.name}
                  </div>
                ) : null}
                {pricing?.appliedVoucher ? (
                  <div className="rounded-2xl bg-success-50 px-4 py-3 text-xs text-success-700 dark:bg-success-500/10 dark:text-success-200">
                    Voucher terpakai: {pricing.appliedVoucher.code}
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-base font-semibold">
                  <span className="text-gray-900 dark:text-white">Grand Total</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Pembayaran</h3>
                  <button
                    type="button"
                    onClick={addPaymentRow}
                    className="text-sm font-semibold text-brand-600"
                  >
                    Tambah metode
                  </button>
                </div>

                {payments.map((payment) => (
                  <div key={payment.id} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="grid gap-3">
                      <select
                        value={payment.method}
                        onChange={(event) => updatePaymentRow(payment.id, "method", event.target.value)}
                        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      >
                        {defaultPaymentMethods.map((method) => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={payment.amount}
                        onChange={(event) => updatePaymentRow(payment.id, "amount", event.target.value)}
                        placeholder="Nominal pembayaran"
                        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-955 dark:text-white"
                      />
                      <input
                        value={payment.referenceNumber}
                        onChange={(event) =>
                          updatePaymentRow(payment.id, "referenceNumber", event.target.value)
                        }
                        placeholder={payment.method === "cash" ? "Nomor referensi (opsional)" : "Nomor referensi (wajib) *"}
                        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-955 dark:text-white"
                      />
                      {payment.method !== "cash" && !payment.referenceNumber.trim() && (
                        <p className="text-[11px] text-error-600 -mt-2">Nomor referensi wajib diisi untuk non-tunai.</p>
                      )}
                      {payments.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removePaymentRow(payment.id)}
                          className="text-left text-xs font-semibold text-error-700 dark:text-error-300"
                        >
                          Hapus metode ini
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 text-sm dark:bg-gray-950">
                  <span className="text-gray-500 dark:text-gray-400">Total pembayaran</span>
                  <span className={`font-semibold ${paymentBalanced ? "text-success-700 dark:text-success-300" : "text-error-700 dark:text-error-300"}`}>
                    {formatCurrency(totalPayment)}
                  </span>
                </div>

                {changeAmount > 0 ? (
                  <div className="flex items-center justify-between rounded-2xl bg-success-50 dark:bg-success-950/20 px-4 py-3 text-sm border border-success-200 dark:border-success-800/30">
                    <span className="text-success-700 dark:text-success-400 font-medium">Kembalian</span>
                    <span className="font-semibold text-success-700 dark:text-success-300">
                      {formatCurrency(changeAmount)}
                    </span>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => void handleCheckout()}
                  disabled={isSubmitting || isPricingLoading || !canCheckout || cart.length === 0}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-500 px-5 py-4 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Memproses checkout..." : "Checkout sekarang"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showVariantModal && selectedVariantProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-950 border border-gray-100 dark:border-gray-900 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pilih Varian & Tambahan</h3>
              <button
                onClick={() => {
                  setShowVariantModal(false);
                  setSelectedVariantProduct(null);
                  setSelectedVariantId(null);
                  setSelectedModifiers([]);
                }}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                {(() => {
                  const matchedVariant = selectedVariantProduct.variants?.find(
                    (v) => v.id === selectedVariantId || (selectedVariantId === "var-kecil" && v.sku === "ROTI-KECIL") || (selectedVariantId === "var-besar" && v.sku === "ROT-BESAR")
                  );
                  const activeImgUrl = matchedVariant?.imageUrl || selectedVariantProduct.imageUrl;

                  return activeImgUrl ? (
                    <img
                      src={`${API_BASE_URL}${activeImgUrl}`}
                      alt={selectedVariantProduct.name}
                      className="w-16 h-16 rounded-2xl object-cover transition-all duration-300"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-gray-400">
                      🍰
                    </div>
                  );
                })()}
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{selectedVariantProduct.name}</h4>
                  <p className="text-xs text-gray-400">Sesuaikan pesanan pelanggan</p>
                </div>
              </div>

              {/* Variant Options Selection */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pilihan Varian</span>
                <div className="grid gap-2 grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVariantId("var-kecil")}
                    className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${selectedVariantId === "var-kecil" ? "border-brand-500 bg-brand-50/20 dark:bg-brand-950/10" : "border-gray-200 dark:border-gray-800"}`}
                  >
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Kecil</span>
                    <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-1">Rp8.000</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVariantId("var-besar")}
                    className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${selectedVariantId === "var-besar" ? "border-brand-500 bg-brand-50/20 dark:bg-brand-950/10" : "border-gray-200 dark:border-gray-800"}`}
                  >
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Besar</span>
                    <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-1">Rp15.000</span>
                  </button>
                </div>
              </div>

              {/* Modifiers / Add-ons Selection */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Topping Tambahan</span>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-2xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedModifiers.includes("top-keju")}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedModifiers([...selectedModifiers, "top-keju"]);
                          else setSelectedModifiers(selectedModifiers.filter(m => m !== "top-keju"));
                        }}
                        className="h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Ekstra Keju</span>
                    </div>
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-400">+ Rp2.000</span>
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-2xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedModifiers.includes("top-meses")}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedModifiers([...selectedModifiers, "top-meses"]);
                          else setSelectedModifiers(selectedModifiers.filter(m => m !== "top-meses"));
                        }}
                        className="h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Ekstra Meses</span>
                    </div>
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-400">+ Rp1.000</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!selectedVariantId}
              onClick={() => {
                const isBesar = selectedVariantId === "var-besar";
                const basePrice = isBesar ? 15000 : 8000;
                let extraPrice = 0;
                if (selectedModifiers.includes("top-keju")) extraPrice += 2000;
                if (selectedModifiers.includes("top-meses")) extraPrice += 1000;

                setCart((current) => [
                  ...current,
                  {
                    productId: selectedVariantProduct.id,
                    productVariantId: selectedVariantId,
                    productName: `${selectedVariantProduct.name} (${isBesar ? "Besar" : "Kecil"})`,
                    sku: isBesar ? "ROT-BESAR" : "ROTI-KECIL",
                    unit: selectedVariantProduct.unit,
                    qty: 1,
                    unitPrice: basePrice + extraPrice,
                    discountAmount: 0,
                    availableStock: selectedVariantProduct.qtyOnHand,
                    selectedModifiers,
                    selectedModifiersJson: JSON.stringify(selectedModifiers),
                  }
                ]);

                setShowVariantModal(false);
                setSelectedVariantProduct(null);
                setSelectedVariantId(null);
                setSelectedModifiers([]);
              }}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3.5 rounded-2xl text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-brand-500/20"
            >
              Tambahkan ke Keranjang
            </button>
          </div>
        </div>
      )}

      {showProfileUpdateModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-950 border border-gray-100 dark:border-gray-900 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Lengkapi Profil Pelanggan</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-normal">
                NIK KTP dan Alamat lengkap wajib diisi untuk menggunakan metode pembayaran kasbon (piutang).
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Nomor NIK KTP
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={ktpInput}
                  onChange={(e) => setKtpInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Masukkan 16 digit NIK"
                  className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Alamat Lengkap
                </label>
                <textarea
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="Masukkan alamat tinggal lengkap"
                  rows={3}
                  className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowProfileUpdateModal(false);
                  setKtpInput("");
                  setAddressInput("");
                }}
                className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-800 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleUpdateProfile()}
                disabled={isUpdatingProfile || ktpInput.length < 16 || !addressInput.trim()}
                className="flex-1 rounded-2xl bg-brand-500 hover:bg-brand-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isUpdatingProfile ? "Menyimpan..." : "Simpan Profil"}
              </button>
            </div>
          </div>
        </div>
      )}
      </section>
    </div>
  );
}
