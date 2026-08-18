import { useEffect, useMemo, useState } from "react";
import { OutletContext } from "../../features/outlets/context/OutletContext";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { getOutlets } from "../../features/outlets/api/outletsApi";
import { isPrivilegedUser } from "../../features/auth";

export default function OutletProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [manualSelectedOutletId, setManualSelectedOutletId] = useState<string | null | undefined>(undefined);
  const [defaultOutletId, setDefaultOutletId] = useState<string | null>(null);

  useEffect(() => {
    setManualSelectedOutletId(undefined);
    setDefaultOutletId(null);

    if (!session) {
      return;
    }

    if (session.outletId) {
      setDefaultOutletId(session.outletId);
      return;
    }

    async function fetchDefaultOutlet() {
      if (!isPrivilegedUser(session?.role)) {
        return;
      }
      try {
        const outlets = await getOutlets();
        const activeOutlets = outlets.filter((o) => o.isActive);
        if (activeOutlets.length > 0) {
          activeOutlets.sort((a, b) => a.code.localeCompare(b.code, "id-ID"));
          setDefaultOutletId(activeOutlets[0].id);
        }
      } catch {
        // best-effort fallback
      }
    }

    void fetchDefaultOutlet();
  }, [session?.userId, session?.role, session?.outletId]);

  const selectedOutletId =
    (manualSelectedOutletId !== undefined ? manualSelectedOutletId : (defaultOutletId ?? session?.outletId)) ?? null;

  const value = useMemo(
    () => ({
      selectedOutletId,
      setSelectedOutletId: setManualSelectedOutletId,
      resetSelectedOutletId: () => setManualSelectedOutletId(undefined),
    }),
    [selectedOutletId]
  );

  return <OutletContext.Provider value={value}>{children}</OutletContext.Provider>;
}
