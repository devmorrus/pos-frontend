import { useEffect, useState } from "react";
import { getAccountingPostingStatus } from "../api/accountingIntegrationsApi";
import type { AccountingPostingStatusDto, AccountingReferenceType } from "../types/accountingIntegration";

type AccountingPostingBadgeProps = {
  referenceType: AccountingReferenceType;
  referenceId: string;
};

function badgeClassName(isPosted: boolean) {
  return isPosted
    ? "bg-success-50 text-success-700 ring-success-200 dark:bg-success-500/10 dark:text-success-300 dark:ring-success-500/20"
    : "bg-warning-50 text-warning-700 ring-warning-200 dark:bg-warning-500/10 dark:text-warning-300 dark:ring-warning-500/20";
}

export default function AccountingPostingBadge({
  referenceType,
  referenceId,
}: AccountingPostingBadgeProps) {
  const [status, setStatus] = useState<AccountingPostingStatusDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStatus() {
      setIsLoading(true);
      try {
        const result = await getAccountingPostingStatus(referenceType, referenceId);
        if (isMounted) {
          setStatus(result);
        }
      } catch {
        if (isMounted) {
          setStatus(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStatus();

    return () => {
      isMounted = false;
    };
  }, [referenceId, referenceType]);

  if (isLoading) {
    return (
      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700">
        Memeriksa jurnal...
      </span>
    );
  }

  const isPosted = status?.isPosted ?? false;
  const label = isPosted
    ? `Sudah terjurnal${status?.entryCount ? ` (${status.entryCount} line)` : ""}`
    : "Belum terjurnal";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${badgeClassName(isPosted)}`}
      title={status?.trxNumber ?? undefined}
    >
      {label}
    </span>
  );
}
