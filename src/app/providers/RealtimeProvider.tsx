import { useEffect, useMemo, useState } from "react";
import { RealtimeContext } from "../../lib/realtime/RealtimeContext";
import { createRealtimeClient, type StockUpdateEvent } from "../../lib/realtime/client";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useOutlet } from "../../features/outlets/hooks/useOutlet";

const realtimeClient = createRealtimeClient();

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, isAuthenticated } = useAuth();
  const { selectedOutletId } = useOutlet();
  const [isConnected, setIsConnected] = useState(false);
  const [lastStockUpdate, setLastStockUpdate] = useState<StockUpdateEvent | null>(null);

  useEffect(() => {
    const unsubscribe = realtimeClient.onStockUpdate((event) => {
      setLastStockUpdate(event);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function syncConnection() {
      if (!isAuthenticated || !selectedOutletId) {
        realtimeClient.clearStockLocationGroup();
        await realtimeClient.disconnect();
        if (!isCancelled) {
          setIsConnected(false);
        }
        return;
      }

      try {
        await realtimeClient.connect(selectedOutletId, accessToken ?? undefined);
        if (!isCancelled) {
          setIsConnected(true);
        }
      } catch {
        if (!isCancelled) {
          setIsConnected(false);
        }
      }
    }

    void syncConnection();

    return () => {
      isCancelled = true;
    };
  }, [accessToken, isAuthenticated, selectedOutletId]);

  const value = useMemo(
    () => ({
      isConnected,
      lastStockUpdate,
      connect: realtimeClient.connect,
      disconnect: realtimeClient.disconnect,
      joinOutletGroup: realtimeClient.joinOutletGroup,
      joinStockLocationGroup: realtimeClient.joinStockLocationGroup,
      onStockUpdate: realtimeClient.onStockUpdate,
    }),
    [isConnected, lastStockUpdate]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
