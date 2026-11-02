import { createContext } from "react";
import type { CapabilitySnapshot } from "../types/capability";

export type CapabilityContextValue = {
  snapshot: CapabilitySnapshot | null;
  isLoading: boolean;
  error: string | null;
  hasCapability: (code: string) => boolean;
  reloadCapabilities: () => Promise<void>;
};

export const CapabilityContext = createContext<CapabilityContextValue | undefined>(undefined);
