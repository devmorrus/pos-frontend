import * as signalR from "@microsoft/signalr";
import { SIGNALR_URL } from "../../api/client";

export type StockUpdateEvent = {
  eventId?: string;
  sequence?: number;
  occurredAtUtc?: string;
  stockLocationId?: string;
  outletId: string | null;
  locationType?: "outlet" | "warehouse";
  isAbsolute?: boolean;
  updates: {
    productId: string;
    productVariantId?: string | null;
    qty: number;
  }[];
};

type StockUpdateHandler = (event: StockUpdateEvent) => void;

export function createRealtimeClient() {
  let connection: signalR.HubConnection | null = null;
  let currentOutletId: string | null = null;
  let currentStockLocationId: string | null = null;
  const handlers = new Set<StockUpdateHandler>();
  const lastSequenceByLocation = new Map<string, number>();

  function emitStockUpdate(event: StockUpdateEvent) {
    const locationId = event.stockLocationId ?? event.outletId;
    if (locationId && event.sequence !== undefined) {
      const lastSequence = lastSequenceByLocation.get(locationId) ?? 0;
      if (event.sequence <= lastSequence) return;
      lastSequenceByLocation.set(locationId, event.sequence);
    }
    handlers.forEach((handler) => handler(event));
  }

  async function ensureConnection(accessToken?: string) {
    if (!connection) {
      connection = new signalR.HubConnectionBuilder()
        .withUrl(SIGNALR_URL, {
          accessTokenFactory: () => accessToken ?? "",
        })
        .withAutomaticReconnect()
        .build();

      connection.on("ReceiveStockUpdate", (event: StockUpdateEvent) => {
        emitStockUpdate(event);
      });
      connection.on("ReceiveStockUpdateV2", (event: StockUpdateEvent) => {
        emitStockUpdate(event);
      });
      connection.onreconnected(async () => {
        if (currentOutletId) await joinOutletGroup(currentOutletId);
        if (currentStockLocationId) {
          await connection?.invoke("JoinStockLocationGroup", currentStockLocationId);
        }
      });
    }

    if (connection.state === signalR.HubConnectionState.Disconnected) {
      await connection.start();
    }
  }

  async function joinOutletGroup(outletId: string) {
    if (!connection) {
      return;
    }

    await connection.invoke("JoinOutletGroup", outletId);
    currentOutletId = outletId;
  }

  async function connect(outletId: string, accessToken?: string) {
    await ensureConnection(accessToken);

    if (currentOutletId && currentOutletId !== outletId) {
      await connection?.invoke("LeaveOutletGroup", currentOutletId);
    }

    await joinOutletGroup(outletId);
    if (currentStockLocationId) {
      await connection?.invoke("JoinStockLocationGroup", currentStockLocationId);
    }
  }

  async function joinStockLocationGroup(stockLocationId: string) {
    if (connection && currentStockLocationId && currentStockLocationId !== stockLocationId) {
      await connection.invoke("LeaveStockLocationGroup", currentStockLocationId);
    }
    currentStockLocationId = stockLocationId;
    if (connection?.state === signalR.HubConnectionState.Connected) {
      await connection.invoke("JoinStockLocationGroup", stockLocationId);
    }
  }

  function clearStockLocationGroup() {
    currentStockLocationId = null;
  }

  async function disconnect() {
    if (!connection) {
      currentOutletId = null;
      return;
    }

    if (currentOutletId) {
      try {
        await connection.invoke("LeaveOutletGroup", currentOutletId);
      } catch {
        // ignore leave errors on disconnect
      }
    }

    currentOutletId = null;
    await connection.stop();
  }

  function onStockUpdate(handler: StockUpdateHandler) {
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
    };
  }

  return {
    connect,
    disconnect,
    joinOutletGroup,
    joinStockLocationGroup,
    clearStockLocationGroup,
    onStockUpdate,
  };
}
