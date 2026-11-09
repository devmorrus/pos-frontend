import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { isOwner } from "../../auth/utils/access";
import { useOutlet } from "../../outlets/hooks/useOutlet";
import { getStockLocations } from "../../stock-locations/api";
import type { StockLocationDto } from "../../stock-locations/types";
import { useRealtime } from "../../../lib/realtime/hooks";

const storageKey = "morrus:selected-stock-location";

export function useStockOutletScope(outletOnly = false) {
  const { session } = useAuth();
  const { joinStockLocationGroup } = useRealtime();
  const { selectedOutletId: salesOutletId, setSelectedOutletId: setSalesOutletId } = useOutlet();
  const [stockLocationId, setStockLocationId] = useState<string | null>(
    () => localStorage.getItem(storageKey),
  );
  const [outlets, setOutlets] = useState<StockLocationDto[]>([]);
  const [isLoadingOutlets, setIsLoadingOutlets] = useState(false);

  const ownerMode = isOwner(session?.role) || session?.role === "Admin" || session?.role === "Gudang";
  const selectedOutletId = outletOnly ? salesOutletId : stockLocationId;
  const effectiveOutletId = selectedOutletId ?? session?.outletId ?? null;

  useEffect(() => {
    if (effectiveOutletId) void joinStockLocationGroup(effectiveOutletId);
  }, [effectiveOutletId, joinStockLocationGroup]);

  const setSelectedOutletId = useCallback((id: string | null) => {
    if (outletOnly) {
      setSalesOutletId(id);
      return;
    }
    setStockLocationId(id);
    if (id) localStorage.setItem(storageKey, id);
    else localStorage.removeItem(storageKey);
  }, [outletOnly, setSalesOutletId]);

  useEffect(() => {
    async function loadOutlets() {
      setIsLoadingOutlets(true);

      try {
        const loaded = await getStockLocations();
        const locations = outletOnly ? loaded.filter((location) => location.type === "outlet") : loaded;
        setOutlets(locations);
        const current = selectedOutletId;
        const fallback = locations.find((location) => location.id === session?.outletId)
          ?? locations.find((location) => location.isActive);
        if (!current || !locations.some((location) => location.id === current && location.isActive)) {
          const next = fallback?.id ?? null;
          setSelectedOutletId(next);
        }
      } finally {
        setIsLoadingOutlets(false);
      }
    }

    void loadOutlets();
  }, [session?.role, session?.outletId, outletOnly, selectedOutletId, setSelectedOutletId]);

  const activeOutlets = useMemo(
    () => outlets.filter((outlet) => outlet.isActive),
    [outlets],
  );

  return {
    ownerMode,
    activeOutlets,
    isLoadingOutlets,
    selectedOutletId,
    setSelectedOutletId,
    effectiveOutletId,
    sessionOutletId: session?.outletId ?? null,
  };
}
