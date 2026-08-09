import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import AppLoader from "../../components/ui/AppLoader";
import { useAuth } from "../../features/auth/hooks/useAuth";

export default function SubscriptionGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { session, isBootstrapping, isAuthenticated } = useAuth();

  if (isBootstrapping) {
    return <AppLoader fullScreen label="Memeriksa status langganan..." />;
  }

  if (isAuthenticated && session) {
    const subStatus = session.subscriptionStatus;
    const trialEndDate = session.trialEndDate;

    // Determine if trial is expired
    const isTrialExpired = subStatus === "Trial" && 
      trialEndDate && 
      new Date(trialEndDate) < new Date();

    // Account is locked if trial has expired or if status is explicitly set to Locked/Expired
    const isLocked = subStatus === "Locked" || subStatus === "Expired" || isTrialExpired;

    if (isLocked && location.pathname !== "/subscription-expired") {
      return <Navigate to="/subscription-expired" replace />;
    }
  }

  return <>{children}</>;
}
