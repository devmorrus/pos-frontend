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

  function clearCart() {
    setCart([]);
    setVoucherCode("");
    setPricing(null);
  }

  const totalCartItems = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

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
    <div className="space-y-5">
      {/* ── Premium Header ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 p-5 shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12)_0%,_transparent_60%)] pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white text-2xl shadow-inner flex-shrink-0">
              🏪
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">POS Kasir</p>
              <h1 className="text-xl font-bold text-white leading-tight">
                {currentSession.outletName}
              </h1>
              <p className="mt-0.5 text-xs text-white/80">
                Kasir: <span className="font-semibold">{currentSession.userName}</span> · Kas awal {formatCurrency(currentSession.openingCash)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/cashier/session"
              className="rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-all"
            >
              Kelola Sesi
            </Link>
            <Link
              to="/transactions"
              className="rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-all"
            >
              Histori
            </Link>
          </div>
        </div>
      </section>

      <InlineAlert tone="error" message={error} />
      <InlineAlert tone="info" message={warning} />
      <InlineAlert tone="error" message={pricingError} />

      <section className="w-full">
        {step === "catalog" ? (
          <div className="rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            {/* Search bar */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Cari nama produk, SKU, atau scan barcode..."
                  className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-32 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl bg-brand-50 dark:bg-brand-950/40 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
                  {filteredProducts.length} produk
                </span>
              </div>
            </div>

            {/* Product Grid */}
            <div className="p-5">
              {isLoadingProducts ? (
                <AppLoader label="Memuat katalog produk..." />
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-5xl mb-3">📦</div>
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Tidak ada produk ditemukan</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Coba kata kunci lain atau cek stok produk</p>
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {filteredProducts.map((product) => {
                    const outOfStock = product.qtyOnHand <= 0;
                    const cartItem = cart.find((item) => item.productId === product.id && !item.productVariantId);
                    const cartQty = cartItem ? Number(cartItem.qty) : 0;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        disabled={outOfStock}
                        onClick={() => addToCart(product)}
                        className={`group relative flex flex-col rounded-2xl border text-left transition-all duration-200 overflow-hidden active:scale-95 ${
                          outOfStock
                            ? "border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed grayscale"
                            : cartQty > 0
                            ? "border-brand-400 dark:border-brand-500 shadow-md shadow-brand-500/10"
                            : "border-gray-200 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-md"
                        }`}
                      >
                        {/* Quantity Badge */}
                        {cartQty > 0 && (
                          <div className="absolute top-2 left-2 z-20 min-w-[28px] h-7 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center px-2 shadow-lg shadow-brand-500/40 border-2 border-white dark:border-gray-900">
                            {cartQty}×
                          </div>
                        )}

                        {/* Added-to-cart indicator ring */}
                        {cartQty > 0 && (
                          <div className="absolute inset-0 rounded-2xl ring-2 ring-brand-400 dark:ring-brand-500 pointer-events-none z-10" />
                        )}

                        {/* Product Image */}
                        <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-950 flex-shrink-0">
                          {product.imageUrl ? (
                            <img
                              src={`${API_BASE_URL}${product.imageUrl}`}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.style.display = "none";
                                const fallback = document.createElement("div");
                                fallback.className = "w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400 bg-gray-100 dark:bg-gray-950 absolute inset-0";
                                fallback.innerText = product.name.substring(0, 1).toUpperCase();
                                e.currentTarget.parentElement?.appendChild(fallback);
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-300 dark:text-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
                              {product.name.substring(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex flex-col gap-1 p-3 flex-1 bg-white dark:bg-gray-900">
                          <h3 className="text-xs font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 min-h-[32px]">{product.name}</h3>
                          <p className="text-sm font-bold text-brand-600 dark:text-brand-400">{formatCurrency(product.basePrice)}</p>
                          <div className="flex items-center justify-between mt-0.5">
                            <span
                              className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                outOfStock
                                  ? "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300"
                                  : "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                              }`}
                            >
                              Stok {product.qtyOnHand}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal uppercase">{product.unit}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Floating Cart Summary Bar */}
            {cart.length > 0 && (
              <div className="sticky bottom-0 z-10 border-t border-brand-200 dark:border-brand-900/40 bg-gradient-to-r from-brand-50 to-brand-100/60 dark:from-brand-950/30 dark:to-brand-900/20 backdrop-blur-sm p-4">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Kosongkan keranjang?")) clearCart();
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-error-200 dark:border-error-800/50 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-semibold text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/20 transition-all flex-shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Kosongkan
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {totalCartItems} item · {cart.length} jenis produk
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Subtotal: <span className="font-semibold text-brand-600 dark:text-brand-400">{formatCurrency(fallbackSubtotal)}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("checkout")}
                    className="flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition-all flex-shrink-0"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Checkout & Bayar
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Checkout Step ── */
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("catalog")}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-theme-xs transition hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Kembali ke Katalog
              </button>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Checkout</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{cart.length} jenis produk · {totalCartItems} item</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              {/* Left Column: Cart Items */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Keranjang</h3>
                {cart.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400 text-center">
                    Belum ada item di keranjang.
                  </p>
                ) : (
                  cart.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-gray-900">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/50 flex items-center justify-center text-lg font-bold text-brand-500 flex-shrink-0">
                        {item.productName.substring(0, 1).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.productName}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{item.sku} · stok {item.availableStock}</p>
                        {Number(item.discountAmount) > 0 && (
                          <p className="text-xs text-success-600 dark:text-success-400 font-medium">Diskon −{formatCurrency(Number(item.discountAmount))}</p>
                        )}
                      </div>

                      {/* Qty stepper */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const current = Number(item.qty) || 0;
                            if (current <= 1) {
                              removeCartItem(item.productId);
                            } else {
                              updateCartItem(item.productId, "qty", String(current - 1));
                            }
                          }}
                          className="w-8 h-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-error-300 hover:text-error-500 transition-all active:scale-90"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
                        </button>
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
                          className="w-12 h-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-center text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-brand-400"
                        />
                        <button
                          type="button"
                          onClick={() => updateCartItem(item.productId, "qty", String((Number(item.qty) || 0) + 1))}
                          className="w-8 h-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-all active:scale-90"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>

                      {/* Line total */}
                      <div className="text-right flex-shrink-0 min-w-[72px]">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatCurrency(item.unitPrice * (Number(item.qty) || 0) - (Number(item.discountAmount) || 0))}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{formatCurrency(item.unitPrice)} /{item.unit}</p>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeCartItem(item.productId)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-950/20 transition-all flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))
                )}

                {/* Per-item discount (compact, collapsible hint) */}
                {cart.length > 0 && (
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-medium text-brand-500 dark:text-brand-400 list-none flex items-center gap-1 select-none">
                      <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      Atur diskon per item
                    </summary>
                    <div className="mt-2 space-y-2">
                      {cart.map((item) => (
                        <div key={item.productId} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                          <p className="flex-1 text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{item.productName}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">Diskon Rp</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.discountAmount}
                              onChange={(event) => updateCartItem(item.productId, "discountAmount", event.target.value)}
                              onBlur={() => {
                                if (item.discountAmount === "" || Number(item.discountAmount) < 0) {
                                  updateCartItem(item.productId, "discountAmount", "0");
                                }
                              }}
                              className="h-8 w-24 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-2 text-xs text-right text-gray-900 dark:text-white outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>

              {/* Right Column: Payment */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Pembayaran</h3>

                {/* Customer */}
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Pelanggan</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Guest atau cari berdasarkan nomor HP</p>
                    </div>
                    {selectedCustomer && (
                      <button
                        type="button"
                        onClick={() => { setSelectedCustomer(null); setCustomerQuery(""); setCustomerResults([]); }}
                        className="rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900"
                      >
                        Ganti
                      </button>
                    )}
                  </div>
                  {selectedCustomer ? (
                    <div className="rounded-2xl bg-brand-50 dark:bg-brand-950/30 px-4 py-3">
                      <p className="text-sm font-bold text-brand-800 dark:text-brand-200">{selectedCustomer.name}</p>
                      <p className="text-xs text-brand-600 dark:text-brand-400 mt-0.5">{selectedCustomer.phone} · {selectedCustomer.customerCode}</p>
                      <div className="mt-2 border-t border-brand-100 dark:border-brand-800/40 pt-2 grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <p className="text-gray-400 dark:text-gray-500">Limit</p>
                          <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(selectedCustomer.creditLimit || 0)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 dark:text-gray-500">Hutang</p>
                          <p className="font-bold text-error-600 dark:text-error-400">{formatCurrency(selectedCustomer.currentDebt || 0)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 dark:text-gray-500">Sisa</p>
                          <p className="font-bold text-success-600 dark:text-success-400">{formatCurrency(Math.max(0, (selectedCustomer.creditLimit || 0) - (selectedCustomer.currentDebt || 0)))}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        value={customerQuery}
                        onChange={(event) => setCustomerQuery(event.target.value)}
                        placeholder="Cari customer by HP atau nama"
                        className="h-11 w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                      />
                      {isLoadingCustomers ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500">Mencari...</p>
                      ) : customerResults.length > 0 ? (
                        <div className="space-y-1.5">
                          {customerResults.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => { setSelectedCustomer(customer); setCustomerQuery(customer.phone); setCustomerResults([]); }}
                              className="flex w-full items-center justify-between rounded-2xl border border-gray-200 dark:border-gray-800 px-4 py-3 text-left hover:border-brand-300 dark:hover:border-brand-600 transition-all"
                            >
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{customer.name}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{customer.phone} · {customer.customerCode}</p>
                              </div>
                              <span className="text-xs font-bold text-brand-500">Pilih →</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500">Mode default: Guest (tanpa akun)</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Voucher */}
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Kode Voucher</p>
                  <input
                    value={voucherCode}
                    onChange={(event) => setVoucherCode(event.target.value)}
                    placeholder="Masukkan kode voucher (opsional)"
                    className="h-11 w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  />
                  {isPricingLoading && <p className="text-xs text-brand-500 animate-pulse">Menghitung harga...</p>}
                </div>

                {/* Price Summary */}
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-2.5">
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ringkasan Harga</p>
                  {[
                    { label: "Subtotal", value: subtotal },
                    { label: "Diskon item", value: -manualDiscountTotal, hide: manualDiscountTotal === 0 },
                    { label: "Promo otomatis", value: -promoDiscountTotal, hide: promoDiscountTotal === 0 },
                    { label: "Voucher", value: -voucherDiscountTotal, hide: voucherDiscountTotal === 0 },
                    { label: "Service charge", value: serviceChargeTotal, hide: serviceChargeTotal === 0 },
                    { label: "Pajak", value: taxTotal, hide: taxTotal === 0 },
                  ].filter(r => !r.hide).map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{label}</span>
                      <span className={`font-medium ${ value < 0 ? "text-success-600 dark:text-success-400" : "text-gray-900 dark:text-white"}`}>
                        {value < 0 ? `−${formatCurrency(Math.abs(value))}` : formatCurrency(value)}
                      </span>
                    </div>
                  ))}
                  {pricing?.appliedPromo && (
                    <div className="rounded-xl bg-brand-50 dark:bg-brand-950/30 px-3 py-2 text-xs text-brand-700 dark:text-brand-300">
                      🎉 Promo aktif: {pricing.appliedPromo.name}
                    </div>
                  )}
                  {pricing?.appliedVoucher && (
                    <div className="rounded-xl bg-success-50 dark:bg-success-950/20 px-3 py-2 text-xs text-success-700 dark:text-success-300">
                      🎟 Voucher: {pricing.appliedVoucher.code}
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2.5 flex items-center justify-between">
                    <span className="text-base font-bold text-gray-900 dark:text-white">Grand Total</span>
                    <span className="text-xl font-extrabold text-brand-600 dark:text-brand-400">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Metode Pembayaran</p>
                    <button type="button" onClick={addPaymentRow} className="text-xs font-bold text-brand-500 hover:text-brand-600 transition-colors">
                      + Tambah
                    </button>
                  </div>

                  {payments.map((payment) => (
                    <div key={payment.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-3 space-y-3">
                      {/* Method Selector Buttons */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {defaultPaymentMethods.map((method) => (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() => updatePaymentRow(payment.id, "method", method.value)}
                            className={`rounded-xl py-2 text-xs font-bold border transition-all ${
                              payment.method === method.value
                                ? "border-brand-500 bg-brand-500 text-white shadow-md shadow-brand-500/30"
                                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300"
                            }`}
                          >
                            {method.value === "cash" ? "💵" : method.value === "qris" ? "📱" : method.value === "transfer" ? "🏦" : "💳"}
                            <br />{method.label}
                          </button>
                        ))}
                      </div>

                      {/* Amount Input */}
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">Rp</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={payment.amount}
                          onChange={(event) => updatePaymentRow(payment.id, "amount", event.target.value)}
                          placeholder="0"
                          className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 pl-8 pr-3 text-sm font-bold text-right text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                        />
                      </div>

                      {/* Reference Number */}
                      <input
                        value={payment.referenceNumber}
                        onChange={(event) => updatePaymentRow(payment.id, "referenceNumber", event.target.value)}
                        placeholder={payment.method === "cash" ? "No. referensi (opsional)" : "No. referensi (wajib) *"}
                        className="h-10 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 text-xs text-gray-900 dark:text-white outline-none focus:border-brand-400"
                      />
                      {payment.method !== "cash" && !payment.referenceNumber.trim() && (
                        <p className="text-[11px] text-error-600 -mt-2">No. referensi wajib untuk non-tunai.</p>
                      )}

                      {payments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePaymentRow(payment.id)}
                          className="text-xs font-semibold text-error-500 hover:text-error-700 transition-colors"
                        >
                          Hapus metode ini
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Total payment & change */}
                  <div className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm ${
                    paymentBalanced
                      ? "bg-success-50 dark:bg-success-950/20 border border-success-200 dark:border-success-800/30"
                      : "bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800"
                  }`}>
                    <span className={`font-medium ${ paymentBalanced ? "text-success-700 dark:text-success-300" : "text-gray-500 dark:text-gray-400" }`}>Total Dibayar</span>
                    <span className={`font-bold ${ paymentBalanced ? "text-success-700 dark:text-success-300" : "text-error-600 dark:text-error-400" }`}>{formatCurrency(totalPayment)}</span>
                  </div>

                  {changeAmount > 0 && (
                    <div className="flex items-center justify-between rounded-2xl bg-success-50 dark:bg-success-950/20 border border-success-200 dark:border-success-800/30 px-4 py-3">
                      <span className="text-sm font-semibold text-success-700 dark:text-success-400">💰 Kembalian</span>
                      <span className="text-lg font-extrabold text-success-700 dark:text-success-300">{formatCurrency(changeAmount)}</span>
                    </div>
                  )}
                </div>

                {/* Checkout Button */}
                <button
                  type="button"
                  onClick={() => void handleCheckout()}
                  disabled={isSubmitting || isPricingLoading || !canCheckout || cart.length === 0}
                  className="w-full rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-[0.98] py-4 text-base font-extrabold text-white shadow-lg shadow-brand-500/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memproses...
                    </span>
                  ) : (
                    "✓ Checkout Sekarang"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Variant Selection Modal */}
      {showVariantModal && selectedVariantProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-950 border border-gray-100 dark:border-gray-900 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pilih Varian & Tambahan</h3>
              <button
                onClick={() => { setShowVariantModal(false); setSelectedVariantProduct(null); setSelectedVariantId(null); setSelectedModifiers([]); }}
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

              {/* Variant Options */}
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

              {/* Modifiers */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Topping Tambahan</span>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-2xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedModifiers.includes("top-keju")} onChange={(e) => { if (e.target.checked) setSelectedModifiers([...selectedModifiers, "top-keju"]); else setSelectedModifiers(selectedModifiers.filter(m => m !== "top-keju")); }} className="h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Ekstra Keju</span>
                    </div>
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-400">+ Rp2.000</span>
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-2xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedModifiers.includes("top-meses")} onChange={(e) => { if (e.target.checked) setSelectedModifiers([...selectedModifiers, "top-meses"]); else setSelectedModifiers(selectedModifiers.filter(m => m !== "top-meses")); }} className="h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
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

      {/* Profile Update Modal */}
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
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Nomor NIK KTP</label>
                <input
                  type="text"
                  maxLength={16}
                  value={ktpInput}
                  onChange={(e) => setKtpInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Masukkan 16 digit NIK"
                  className="h-11 w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Alamat Lengkap</label>
                <textarea
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="Masukkan alamat tinggal lengkap"
                  rows={3}
                  className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowProfileUpdateModal(false); setKtpInput(""); setAddressInput(""); }}
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
    </div>
  );
}


