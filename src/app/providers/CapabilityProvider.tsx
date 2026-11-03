import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useOutlet } from "../../features/outlets/hooks/useOutlet";
import { getEffectiveCapabilities } from "../../features/capabilities/api/capabilityApi";
import { CapabilityContext } from "../../features/capabilities/context/CapabilityContext";
import type { CapabilitySnapshot } from "../../features/capabilities/types/capability";

export default function CapabilityProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, session } = useAuth();
  const { selectedOutletId } = useOutlet();
  const [snapshot, setSnapshot] = useState<CapabilitySnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const reloadCapabilities = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    if (!isAuthenticated) {
      setSnapshot(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const nextSnapshot = await getEffectiveCapabilities(selectedOutletId);
      if (requestId.current === currentRequestId) setSnapshot(nextSnapshot);
    } catch (err) {
      if (requestId.current === currentRequestId) {
        setSnapshot(null);
        setError((err as { message?: string })?.message ?? "Gagal memuat capability.");
      }
    } finally {
      if (requestId.current === currentRequestId) setIsLoading(false);
    }
  }, [isAuthenticated, selectedOutletId]);

  useEffect(() => {
    setSnapshot(null);
    void reloadCapabilities();
  }, [reloadCapabilities, session?.userId]);

  useEffect(() => {
    const onFocus = () => void reloadCapabilities();
    const onStale = () => {
      setSnapshot(null);
      void reloadCapabilities();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("morrus:capability-stale", onStale);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("morrus:capability-stale", onStale);
    };
  }, [reloadCapabilities]);

  const value = useMemo(
    () => ({
      snapshot,
      isLoading,
      error,
      hasCapability: (code: string) => snapshot?.capabilities.some((x) => x.code === code && x.enabled) ?? false,
      reloadCapabilities,
    }),
    [snapshot, isLoading, error, reloadCapabilities],
  );

  return <CapabilityContext.Provider value={value}>{children}</CapabilityContext.Provider>;
}
