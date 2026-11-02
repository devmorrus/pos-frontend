import type { ReactNode } from "react";
import AppErrorState from "../../components/ui/AppErrorState";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { canAccessByPolicy } from "../../features/auth/utils/access";
import { useCapabilities } from "../../features/capabilities/hooks/useCapabilities";
import { useLocation } from "react-router";
import { getNavigationItem } from "../router/navigation";
import AppLoader from "../../components/ui/AppLoader";

type PermissionGuardProps = {
  children: ReactNode;
  requiredPermissions?: string[];
  fallbackRoles?: string[];
  allowPlaceholder?: boolean;
  requiredCapabilities?: string[];
};

export default function PermissionGuard({
  children,
  requiredPermissions = [],
  fallbackRoles = [],
  requiredCapabilities,
}: PermissionGuardProps) {
  const { session } = useAuth();
  const location = useLocation();
  const { hasCapability, isLoading, error } = useCapabilities();
  const routePolicy = getNavigationItem(location.pathname);
  const capabilityRequirements = requiredCapabilities ?? routePolicy?.requiredCapabilities ?? [];

  if (capabilityRequirements.length && isLoading) {
    return <AppLoader label="Memeriksa capability..." />;
  }

  if (capabilityRequirements.length &&
      (error || !capabilityRequirements.every(hasCapability))) {
    return (
      <AppErrorState
        title="Fitur belum aktif"
        description={error ?? "Fitur ini belum diaktifkan untuk Business atau Outlet yang dipilih."}
        actionLabel="Kembali ke dashboard"
        actionHref="/dashboard"
        fullScreen={false}
      />
    );
  }

  if (!requiredPermissions.length && !fallbackRoles.length) {
    return <>{children}</>;
  }

  if (
    canAccessByPolicy(session, {
      requiredPermissions,
      fallbackRoles,
    })
  ) {
    return <>{children}</>;
  }

  return (
    <AppErrorState
      title="Akses dibatasi"
      description="Role atau permission akun Anda belum memenuhi policy akses untuk halaman ini."
      actionLabel="Kembali ke dashboard"
      actionHref="/dashboard"
      fullScreen={false}
    />
  );
}
