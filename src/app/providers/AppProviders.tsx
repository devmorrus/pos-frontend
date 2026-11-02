import type { ReactNode } from "react";
import { RootProviders } from "./AuthProvider";
import CashierSessionProvider from "./CashierSessionProvider";
import OutletProvider from "./OutletProvider";
import RealtimeProvider from "./RealtimeProvider";
import CapabilityProvider from "./CapabilityProvider";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <RootProviders>
      <OutletProvider>
        <CapabilityProvider>
          <CashierSessionProvider>
            <RealtimeProvider>{children}</RealtimeProvider>
          </CashierSessionProvider>
        </CapabilityProvider>
      </OutletProvider>
    </RootProviders>
  );
}
