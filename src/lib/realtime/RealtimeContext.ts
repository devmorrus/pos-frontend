import { createContext } from "react";
import type { StockUpdateEvent } from "./client";

export type RealtimeContextValue = {
  isConnected: boolean;
  lastStockUpdate: StockUpdateEvent | null;
  connect: (outletId: string, accessToken?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  joinOutletGroup: (outletId: string) => Promise<void>;
  joinStockLocationGroup: (stockLocationId: string) => Promise<void>;
  onStockUpdate: (handler: (event: StockUpdateEvent) => void) => () => void;
};

export const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);
