import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export interface StorefrontOutlet {
  id: string;
  businessSlug: string;
  code: string; // outlet slug/code in URL
  name: string;
  address?: string | null;
  isOpen?: boolean;
  phone?: string | null;
}

export interface StorefrontProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  unit: string;
  qtyOnHand: number;
  imageUrl?: string;
  description?: string;
  categoryName?: string;
}

export interface CartItem {
  product: StorefrontProduct;
  qty: number;
  notes?: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  fulfillmentMethod: "dine-in" | "pickup" | "delivery";
  notes?: string;
}

interface StorefrontContextType {
  selectedOutlet: StorefrontOutlet | null;
  setSelectedOutlet: (outlet: StorefrontOutlet | null) => void;
  cart: CartItem[];
  addToCart: (product: StorefrontProduct, qty: number, notes?: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  syncCartWithCatalog: (freshProducts: { id: string; qtyOnHand: number; basePrice?: number }[]) => void;
  customerInfo: CustomerInfo | null;
  setCustomerInfo: (info: CustomerInfo | null) => void;
  cartSubtotal: number;
  cartTotalItems: number;
}

const StorefrontContext = createContext<StorefrontContextType | undefined>(undefined);

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const [selectedOutlet, setSelectedOutletState] = useState<StorefrontOutlet | null>(() => {
    const stored = localStorage.getItem("morrus_storefront_outlet");
    if (!stored) return null;
    const outlet = JSON.parse(stored) as StorefrontOutlet;
    return outlet.businessSlug ? outlet : null;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem("morrus_storefront_cart");
    return stored ? JSON.parse(stored) : [];
  });

  const [customerInfo, setCustomerInfoState] = useState<CustomerInfo | null>(() => {
    const stored = localStorage.getItem("morrus_storefront_custinfo");
    return stored ? JSON.parse(stored) : null;
  });

  // Persist selected outlet
  const setSelectedOutlet = (outlet: StorefrontOutlet | null) => {
    setSelectedOutletState(outlet);
    if (outlet) {
      localStorage.setItem("morrus_storefront_outlet", JSON.stringify(outlet));
    } else {
      localStorage.removeItem("morrus_storefront_outlet");
    }
    // Clear cart if outlet changes (different inventory contexts)
    setCart([]);
    localStorage.removeItem("morrus_storefront_cart");
  };

  // Persist cart
  useEffect(() => {
    localStorage.setItem("morrus_storefront_cart", JSON.stringify(cart));
  }, [cart]);

  // Persist customer info
  const setCustomerInfo = (info: CustomerInfo | null) => {
    setCustomerInfoState(info);
    if (info) {
      localStorage.setItem("morrus_storefront_custinfo", JSON.stringify(info));
    } else {
      localStorage.removeItem("morrus_storefront_custinfo");
    }
  };

  const addToCart = (product: StorefrontProduct, qty: number, notes?: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const nextCart = [...prev];
        const currentItem = nextCart[existingIndex];
        const newQty = currentItem.qty + qty;
        
        // Cap qty at stock
        const cappedQty = Math.min(newQty, product.qtyOnHand);
        
        nextCart[existingIndex] = {
          ...currentItem,
          qty: cappedQty,
          notes: notes !== undefined ? notes : currentItem.notes,
        };
        return nextCart;
      } else {
        return [...prev, { product, qty: Math.min(qty, product.qtyOnHand), notes }];
      }
    });
  };

  const updateCartQty = (productId: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const cappedQty = Math.min(qty, item.product.qtyOnHand);
            return { ...item, qty: cappedQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const syncCartWithCatalog = useCallback((freshProducts: { id: string; qtyOnHand: number; basePrice?: number }[]) => {
    setCart((prev) =>
      prev
        .map((item) => {
          const fresh = freshProducts.find((p) => p.id === item.product.id);
          if (!fresh) return null; // Produk tidak ada lagi di catalog
          const cappedQty = Math.min(item.qty, fresh.qtyOnHand);
          if (cappedQty <= 0) return null; // Stok habis, hapus dari cart
          return {
            ...item,
            qty: cappedQty,
            product: {
              ...item.product,
              qtyOnHand: fresh.qtyOnHand,
              price: fresh.basePrice ?? item.product.price,
            },
          };
        })
        .filter((item): item is CartItem => item !== null)
    );
  }, []);

  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.qty, 0);
  const cartTotalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <StorefrontContext.Provider
      value={{
        selectedOutlet,
        setSelectedOutlet,
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        syncCartWithCatalog,
        customerInfo,
        setCustomerInfo,
        cartSubtotal,
        cartTotalItems,
      }}
    >
      {children}
    </StorefrontContext.Provider>
  );
}

export function useStorefront() {
  const context = useContext(StorefrontContext);
  if (context === undefined) {
    throw new Error("useStorefront must be used within a StorefrontProvider");
  }
  return context;
}
