import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { useAuth } from "../../auth/hooks/useAuth";
import { isOwner } from "../../auth/utils/access";
import { useOutlet } from "../../outlets/hooks/useOutlet";
import { useRealtime } from "../../../lib/realtime/hooks";
import { getErrorMessage } from "../../../utils/errors";
import { getProductTrackingOptions, getProducts } from "../../products/api/productsApi";
import type {
  ProductDto,
  ProductTrackingMode,
  ProductTrackingOptionsDto,
} from "../../products/types/product";
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
import { useCapabilities } from "../../capabilities/hooks/useCapabilities";

type CartItem = {
  lineId: string;
  productId: string;
  productVariantId?: string | null;
  productName: string;
  sku: string;
  unit: string;
  qty: number | "";
  unitPrice: number;
  discountAmount: number | "";
  availableStock: number;
  trackingMode: ProductTrackingMode;
  batchAllocations: {
    productBatchId: string;
    batchNumber: string;
    expiryDate: string | null;
    availableQty: number;
    qty: number;
  }[];
  serials: { productSerialId: string; serialNumber: string }[];
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

function quantitiesMatch(left: number, right: number) {
  return Math.abs(left - right) < 0.000001;
}

function isKnownTrackingMode(mode: string): mode is ProductTrackingMode {
  return ["none", "quantity", "batch", "serial"].includes(mode);
}



export default function PosPage() {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const checkoutAttemptRef = useRef<{ fingerprint: string; id: string } | null>(null);
  const checkoutInFlightRef = useRef(false);
  const { session } = useAuth();
  const { selectedOutletId } = useOutlet();
  const { hasCapability } = useCapabilities();
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
  const [pendingCheckout, setPendingCheckout] = useState<CheckoutRequest | null>(null);

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

  // States for batch/serial allocation
  const [trackingLineId, setTrackingLineId] = useState<string | null>(null);
  const [trackingOptions, setTrackingOptions] = useState<ProductTrackingOptionsDto | null>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [batchDraft, setBatchDraft] = useState<Record<string, string>>({});
  const [serialDraft, setSerialDraft] = useState<CartItem["serials"]>([]);
  const [serialSearch, setSerialSearch] = useState("");

  const ownerMode = isOwner(session?.role);
  const effectiveOutletId = ownerMode ? selectedOutletId : session?.outletId ?? null;
  const canUseVoucher = hasCapability("pricing.vouchers");
  const pendingCheckoutStorageKey = `morruspos.pending-checkout:${session?.businessId ?? "unknown"}:${effectiveOutletId ?? "none"}:${currentSession?.id ?? "none"}`;
  const trackingItem = trackingLineId
    ? cart.find((item) => item.lineId === trackingLineId) ?? null
    : null;

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
          const matchedVariant = matched?.variants?.find((variant) => variant.id === item.productVariantId);
          return matched
            ? {
                ...item,
                unitPrice: item.productVariantId ? item.unitPrice : matched.basePrice,
                availableStock: matched.trackingMode === "none"
                  ? item.availableStock
                  : matchedVariant?.qtyOnHand ?? matched.qtyOnHand,
                trackingMode: matched.trackingMode ?? "quantity",
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
    if (!effectiveOutletId || !currentSession) return;
    try {
      const raw = window.sessionStorage.getItem(pendingCheckoutStorageKey);
      if (!raw) return;
      const payload = JSON.parse(raw) as CheckoutRequest;
      if (payload.outletId === effectiveOutletId && payload.cashierSessionId === currentSession.id)
        setPendingCheckout(payload);
    } catch {
      window.sessionStorage.removeItem(pendingCheckoutStorageKey);
    }
  }, [effectiveOutletId, currentSession, pendingCheckoutStorageKey]);

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
      if (product.trackingMode !== "none" && product.qtyOnHand <= 0) {
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

  const trackingComplete = useMemo(
    () => cart.every((item) => {
      const qty = Number(item.qty) || 0;
      if (!isKnownTrackingMode(item.trackingMode)) return false;
      if (item.trackingMode === "batch") {
        return quantitiesMatch(item.batchAllocations.reduce((sum, batch) => sum + batch.qty, 0), qty);
      }
      if (item.trackingMode === "serial") {
        return Number.isInteger(qty) && item.serials.length === qty;
      }
      return true;
    }),
    [cart],
  );

  const canCheckout = useMemo(() => {
    if (isSubmitting || isPricingLoading || cart.length === 0 || !trackingComplete) return false;
    if (isTempo) {
      return selectedCustomer !== null &&
             totalPayment < grandTotal &&
             !creditLimitExceeded &&
             !customerProfileIncomplete;
    }
    return paymentBalanced;
  }, [isSubmitting, isPricingLoading, cart.length, trackingComplete, isTempo, selectedCustomer, totalPayment, grandTotal, creditLimitExceeded, customerProfileIncomplete, paymentBalanced]);

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
          voucherCode: canUseVoucher ? voucherCode.trim() || null : null,
          items: cart.map((item) => ({
            productId: item.productId,
            productVariantId: item.productVariantId,
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
  }, [cart, effectiveOutletId, voucherCode, canUseVoucher]);

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

  async function loadTrackingOptions(item: CartItem, search = "") {
    if (!effectiveOutletId) return;
    setIsLoadingTracking(true);
    setTrackingError(null);
    try {
      const options = await getProductTrackingOptions(
        item.productId,
        effectiveOutletId,
        item.productVariantId,
        search,
      );
      if (options.trackingMode !== item.trackingMode) {
        throw new Error("Mode tracking produk telah berubah. Muat ulang katalog sebelum melanjutkan.");
      }
      setTrackingOptions(options);

      if (item.trackingMode === "batch" && item.batchAllocations.length === 0 && !search) {
        let remaining = Number(item.qty) || 0;
        const allocation: Record<string, string> = {};
        for (const batch of options.batches) {
          const qty = Math.min(remaining, batch.qtyRemaining);
          if (qty > 0) allocation[batch.id] = String(qty);
          remaining -= qty;
          if (remaining <= 0) break;
        }
        setBatchDraft(allocation);
      }
    } catch (requestError) {
      setTrackingOptions(null);
      setTrackingError(getErrorMessage(requestError, "Gagal memuat batch/serial tersedia."));
    } finally {
      setIsLoadingTracking(false);
    }
  }

  function openTracking(item: CartItem) {
    setTrackingLineId(item.lineId);
    setTrackingOptions(null);
    setTrackingError(null);
    setSerialSearch("");
    setBatchDraft(Object.fromEntries(item.batchAllocations.map((batch) => [batch.productBatchId, String(batch.qty)])));
    setSerialDraft(item.serials);
    void loadTrackingOptions(item);
  }

  function saveTracking() {
    if (!trackingItem || !trackingOptions) return;
    const requiredQty = Number(trackingItem.qty) || 0;

    if (trackingItem.trackingMode === "batch") {
      const allocations = trackingOptions.batches.flatMap((batch) => {
        const qty = Number(batchDraft[batch.id]) || 0;
        return qty > 0
          ? [{
              productBatchId: batch.id,
              batchNumber: batch.batchNumber,
              expiryDate: batch.expiryDate,
              availableQty: batch.qtyRemaining,
              qty,
            }]
          : [];
      });
      if (allocations.some((batch) => batch.qty > batch.availableQty)) {
        setTrackingError("Qty alokasi batch melebihi stok batch tersedia.");
        return;
      }
      if (!quantitiesMatch(allocations.reduce((sum, batch) => sum + batch.qty, 0), requiredQty)) {
        setTrackingError(`Total alokasi batch harus tepat ${requiredQty}.`);
        return;
      }
      setCart((current) => current.map((item) =>
        item.lineId === trackingItem.lineId ? { ...item, batchAllocations: allocations } : item));
    } else if (trackingItem.trackingMode === "serial") {
      if (!Number.isInteger(requiredQty) || serialDraft.length !== requiredQty) {
        setTrackingError(`Pilih tepat ${requiredQty} serial/IMEI.`);
        return;
      }
      setCart((current) => current.map((item) =>
        item.lineId === trackingItem.lineId ? { ...item, serials: serialDraft } : item));
    }

    setTrackingLineId(null);
  }

  function addToCart(product: ProductDto) {
    if (!isKnownTrackingMode(product.trackingMode)) {
      setWarning(`Mode tracking ${product.name} tidak dikenali. Produk tidak dapat dijual.`);
      return;
    }
    if (product.hasVariants) {
      setSelectedVariantProduct(product);
      setSelectedVariantId(null);
      setSelectedModifiers([]);
      setShowVariantModal(true);
      return;
    }

    if (product.trackingMode !== "none" && product.qtyOnHand <= 0) {
      return;
    }

    setWarning(null);
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id && !item.productVariantId);
      if (existing) {
        const nextQty = (Number(existing.qty) || 0) + 1;
        if (product.trackingMode !== "none" && nextQty > product.qtyOnHand) {
          setWarning(`Stok ${product.name} tidak cukup untuk menambah qty lagi.`);
          return current;
        }

        return current.map((item) =>
          item.productId === product.id && !item.productVariantId
            ? { ...item, qty: nextQty, availableStock: product.qtyOnHand, batchAllocations: [], serials: [] }
            : item,
        );
      }

      return [
        ...current,
        {
          lineId: crypto.randomUUID(),
          productId: product.id,
          productVariantId: null,
          productName: product.name,
          sku: product.sku,
          unit: product.unit,
          qty: 1,
          unitPrice: product.basePrice,
          discountAmount: 0,
          availableStock: product.qtyOnHand,
          trackingMode: product.trackingMode ?? "quantity",
          batchAllocations: [],
          serials: [],
        },
      ];
    });
  }

  function updateCartItem(lineId: string, key: "qty" | "discountAmount", value: string) {
    setWarning(null);
    setCart((current) =>
      current.map((item) => {
        if (item.lineId !== lineId) {
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
          if (item.trackingMode === "serial" && !Number.isInteger(numericValue)) {
            setWarning(`Qty ${item.productName} harus bilangan bulat untuk produk serial.`);
            return item;
          }
          if (item.trackingMode !== "none" && numericValue > item.availableStock) {
            setWarning(`Qty ${item.productName} melebihi stok tersedia.`);
            return item;
          }

          return {
            ...item,
            qty: numericValue,
            batchAllocations: item.trackingMode === "batch" ? [] : item.batchAllocations,
            serials: item.trackingMode === "serial" ? item.serials.slice(0, numericValue) : item.serials,
          };
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

  function removeCartItem(lineId: string) {
    setCart((current) => current.filter((item) => item.lineId !== lineId));
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

    if (!trackingComplete) {
      setError("Lengkapi alokasi batch atau serial untuk semua produk terlacak.");
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

    if (pendingCheckout && checkoutAttemptRef.current?.id !== pendingCheckout.id) {
      setError("Selesaikan checkout tertunda melalui tombol Retry checkout sebelum membuat transaksi baru.");
      return;
    }

    const fingerprint = JSON.stringify({
      outletId: effectiveOutletId,
      cashierSessionId: currentSession.id,
      cart,
      payments,
      voucherCode,
      selectedCustomerId: selectedCustomer?.id ?? null,
      isTempo,
      tempoDays,
    });
    if (!checkoutAttemptRef.current || checkoutAttemptRef.current.fingerprint !== fingerprint)
      checkoutAttemptRef.current = { fingerprint, id: crypto.randomUUID() };

    const payload: CheckoutRequest = {
      id: checkoutAttemptRef.current.id,
      outletId: effectiveOutletId,
      cashierSessionId: currentSession.id,
      channel: "pos",
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      items: cart.map((item) => ({
        productId: item.productId,
        productVariantId: item.productVariantId,
        qty: Number(item.qty) || 0,
        unitPrice: item.unitPrice,
        discountAmount: Number(item.discountAmount) || 0,
        batchAllocations: item.trackingMode === "batch"
          ? item.batchAllocations.map((batch) => ({
              productBatchId: batch.productBatchId,
              qty: batch.qty,
            }))
          : null,
        serialIds: item.trackingMode === "serial"
          ? item.serials.map((serial) => serial.productSerialId)
          : null,
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
              id: payment.id,
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
                id: payment.id,
                method: payment.method,
                amount: Number(payment.amount) || 0,
                referenceNumber: payment.referenceNumber || null,
              };
            } else {
              const amount = cashApplied ? 0 : requiredCash;
              cashApplied = true;
              return {
                id: payment.id,
                method: payment.method,
                amount: amount,
                referenceNumber: payment.referenceNumber || null,
              };
            }
          })
          .filter((p) => p.amount > 0);
      })(),
      voucherCode: canUseVoucher ? voucherCode.trim() || null : null,
      appliedPromoCode: pricing?.appliedPromo?.code ?? null,
      customerId: selectedCustomer?.id ?? null,
      customerPhone: selectedCustomer?.phone ?? null,
      paymentDueDate: isTempo 
        ? new Date(Date.now() + tempoDays * 24 * 60 * 60 * 1000).toISOString() 
        : null
    };

    if (checkoutInFlightRef.current) return;
    checkoutInFlightRef.current = true;
    setIsSubmitting(true);
    setError(null);
    window.sessionStorage.setItem(pendingCheckoutStorageKey, JSON.stringify(payload));
    setPendingCheckout(payload);

    try {
      const result = await checkoutTransaction(payload);
      window.sessionStorage.removeItem(pendingCheckoutStorageKey);
      setPendingCheckout(null);
      checkoutAttemptRef.current = null;
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
      checkoutInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }

  async function retryPendingCheckout() {
    if (!pendingCheckout || checkoutInFlightRef.current) return;
    checkoutInFlightRef.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await checkoutTransaction(pendingCheckout);
      window.sessionStorage.removeItem(pendingCheckoutStorageKey);
      setPendingCheckout(null);
      checkoutAttemptRef.current = null;
      navigate(`/transactions/${result.id}`);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Retry checkout tertunda gagal."));
    } finally {
      checkoutInFlightRef.current = false;
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
      {pendingCheckout && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3 dark:border-warning-800 dark:bg-warning-950/20">
          <p className="text-sm text-warning-800 dark:text-warning-200">
            Ada checkout tertunda. Retry akan memakai request ID yang sama agar transaksi tidak dobel.
          </p>
          <button type="button" onClick={() => void retryPendingCheckout()} disabled={isSubmitting} className="rounded-xl bg-warning-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
            Retry checkout
          </button>
        </div>
      )}

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
                    const invalidTracking = !isKnownTrackingMode(product.trackingMode);
                    const outOfStock = invalidTracking || (product.trackingMode !== "none" && product.qtyOnHand <= 0);
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
                              {invalidTracking ? "Mode invalid" : product.trackingMode === "none" ? "Non-stok" : `Stok ${product.qtyOnHand}`}
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
                {!trackingComplete && (
                  <InlineAlert tone="info" message="Pilih batch atau serial/IMEI pada item terlacak sebelum checkout." />
                )}
                {cart.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400 text-center">
                    Belum ada item di keranjang.
                  </p>
                ) : (
                  cart.map((item) => (
                    <div key={item.lineId} className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-gray-900">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/50 flex items-center justify-center text-lg font-bold text-brand-500 flex-shrink-0">
                        {item.productName.substring(0, 1).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.productName}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {item.sku} · {item.trackingMode === "none" ? "non-stok" : `stok ${item.availableStock}`}
                        </p>
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
                              removeCartItem(item.lineId);
                            } else {
                              updateCartItem(item.lineId, "qty", String(current - 1));
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
                          onChange={(event) => updateCartItem(item.lineId, "qty", event.target.value)}
                          onBlur={() => {
                            if (!item.qty || Number(item.qty) < 1) {
                              updateCartItem(item.lineId, "qty", "1");
                            }
                          }}
                          className="w-12 h-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-center text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-brand-400"
                        />
                        <button
                          type="button"
                          onClick={() => updateCartItem(item.lineId, "qty", String((Number(item.qty) || 0) + 1))}
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
                        onClick={() => removeCartItem(item.lineId)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-950/20 transition-all flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>

                      {(item.trackingMode === "batch" || item.trackingMode === "serial") && (
                        <div className="basis-full pl-[60px]">
                          <button
                            type="button"
                            onClick={() => openTracking(item)}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                              (item.trackingMode === "batch"
                                ? quantitiesMatch(item.batchAllocations.reduce((sum, batch) => sum + batch.qty, 0), Number(item.qty))
                                : item.serials.length === Number(item.qty))
                                ? "border-success-200 bg-success-50 text-success-700 dark:border-success-800 dark:bg-success-950/20 dark:text-success-300"
                                : "border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-800 dark:bg-warning-950/20 dark:text-warning-300"
                            }`}
                          >
                            {item.trackingMode === "batch"
                              ? item.batchAllocations.length > 0
                                ? `Batch: ${item.batchAllocations.map((batch) => `${batch.batchNumber} (${batch.qty})`).join(", ")}`
                                : "Pilih batch"
                              : item.serials.length > 0
                                ? `Serial: ${item.serials.map((serial) => serial.serialNumber).join(", ")}`
                                : "Pilih serial / IMEI"}
                          </button>
                        </div>
                      )}
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
                        <div key={item.lineId} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                          <p className="flex-1 text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{item.productName}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">Diskon Rp</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.discountAmount}
                              onChange={(event) => updateCartItem(item.lineId, "discountAmount", event.target.value)}
                              onBlur={() => {
                                if (item.discountAmount === "" || Number(item.discountAmount) < 0) {
                                  updateCartItem(item.lineId, "discountAmount", "0");
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
                {canUseVoucher ? (
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
                ) : null}

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

      {/* Batch / serial allocation modal */}
      {trackingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-900 dark:bg-gray-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {trackingItem.trackingMode === "batch" ? "Alokasi Batch" : "Pilih Serial / IMEI"}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {trackingItem.productName} · dibutuhkan {Number(trackingItem.qty) || 0}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTrackingLineId(null)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <InlineAlert tone="error" message={trackingError} />
              {isLoadingTracking ? (
                <AppLoader label="Memuat stok terlacak..." />
              ) : trackingOptions && trackingItem.trackingMode === "batch" ? (
                trackingOptions.batches.length === 0 ? (
                  <InlineAlert tone="info" message="Tidak ada batch aktif yang belum kedaluwarsa." />
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Urutan default mengikuti FEFO (kedaluwarsa terdekat lebih dulu).
                    </p>
                    {trackingOptions.batches.map((batch) => (
                      <label key={batch.id} className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border border-gray-200 p-3 dark:border-gray-800">
                        <span>
                          <span className="block text-sm font-semibold text-gray-900 dark:text-white">{batch.batchNumber}</span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {batch.expiryDate ? `Kedaluwarsa ${new Date(batch.expiryDate).toLocaleDateString("id-ID")}` : "Tanpa tanggal kedaluwarsa"}
                            {` · tersedia ${batch.qtyRemaining}`}
                          </span>
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={batch.qtyRemaining}
                          step="0.01"
                          value={batchDraft[batch.id] ?? ""}
                          onChange={(event) => setBatchDraft((current) => ({ ...current, [batch.id]: event.target.value }))}
                          aria-label={`Qty batch ${batch.batchNumber}`}
                          className="h-10 w-28 rounded-xl border border-gray-200 bg-white px-3 text-right text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                        />
                      </label>
                    ))}
                    <p className="text-right text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Dialokasikan {Object.values(batchDraft).reduce((sum, value) => sum + (Number(value) || 0), 0)} / {Number(trackingItem.qty) || 0}
                    </p>
                  </div>
                )
              ) : trackingOptions && trackingItem.trackingMode === "serial" ? (
                <div className="space-y-3">
                  <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void loadTrackingOptions(trackingItem, serialSearch);
                    }}
                  >
                    <input
                      value={serialSearch}
                      onChange={(event) => setSerialSearch(event.target.value)}
                      placeholder="Ketik atau scan serial / IMEI"
                      className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    />
                    <button type="submit" className="rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white">
                      Cari
                    </button>
                  </form>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Dipilih {serialDraft.length} / {Number(trackingItem.qty) || 0}
                  </p>
                  {serialDraft.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {serialDraft.map((serial) => (
                        <button
                          key={serial.productSerialId}
                          type="button"
                          onClick={() => setSerialDraft((current) => current.filter((item) => item.productSerialId !== serial.productSerialId))}
                          className="rounded-lg bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950/30 dark:text-brand-300"
                        >
                          {serial.serialNumber} ×
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {trackingOptions.serials.length === 0 ? (
                      <InlineAlert tone="info" message="Serial/IMEI tersedia tidak ditemukan." />
                    ) : trackingOptions.serials.map((serial) => {
                      const checked = serialDraft.some((item) => item.productSerialId === serial.id);
                      const full = !checked && serialDraft.length >= (Number(trackingItem.qty) || 0);
                      return (
                        <label key={serial.id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={full}
                            onChange={(event) => setSerialDraft((current) => event.target.checked
                              ? [...current, { productSerialId: serial.id, serialNumber: serial.serialNumber }]
                              : current.filter((item) => item.productSerialId !== serial.id))}
                            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                          />
                          <span className="font-mono text-sm text-gray-900 dark:text-white">{serial.serialNumber}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setTrackingLineId(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveTracking}
                disabled={!trackingOptions || isLoadingTracking}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Simpan alokasi
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {selectedVariantProduct.variants?.filter((variant) => variant.isActive).map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id)}
                      disabled={selectedVariantProduct.trackingMode !== "none" && (variant.qtyOnHand ?? 0) <= 0}
                      className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${selectedVariantId === variant.id ? "border-brand-500 bg-brand-50/20 dark:bg-brand-950/10" : "border-gray-200 dark:border-gray-800"}`}
                    >
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {variant.attributeValues.map((value) => value.value).join(" / ") || variant.sku}
                      </span>
                      <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-1">
                        {formatCurrency(variant.basePrice)}
                      </span>
                      <span className="mt-1 text-[10px] text-gray-400">
                        {selectedVariantProduct.trackingMode === "none" ? "Non-stok" : `Stok ${variant.qtyOnHand ?? 0}`}
                      </span>
                    </button>
                  ))}
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
                const variant = selectedVariantProduct.variants?.find((entry) => entry.id === selectedVariantId);
                if (!variant) return;
                let extraPrice = 0;
                if (selectedModifiers.includes("top-keju")) extraPrice += 2000;
                if (selectedModifiers.includes("top-meses")) extraPrice += 1000;

                setCart((current) => [
                  ...current,
                  {
                    lineId: crypto.randomUUID(),
                    productId: selectedVariantProduct.id,
                    productVariantId: variant.id,
                    productName: `${selectedVariantProduct.name} (${variant.attributeValues.map((value) => value.value).join(" / ") || variant.sku})`,
                    sku: variant.sku,
                    unit: selectedVariantProduct.unit,
                    qty: 1,
                    unitPrice: variant.basePrice + extraPrice,
                    discountAmount: 0,
                    availableStock: selectedVariantProduct.trackingMode === "none" ? Number.POSITIVE_INFINITY : variant.qtyOnHand ?? 0,
                    trackingMode: selectedVariantProduct.trackingMode ?? "quantity",
                    batchAllocations: [],
                    serials: [],
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
