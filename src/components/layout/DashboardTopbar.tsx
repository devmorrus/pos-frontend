import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ThemeToggleButton } from "../common/ThemeToggleButton";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useOutlet } from "../../features/outlets/hooks/useOutlet";
import { getOutlets } from "../../features/outlets/api/outletsApi";
import { isPrivilegedUser } from "../../features/auth";
import type { OutletLookupDto } from "../../features/outlets/types/outlet";

function formatOutletLabel(outletId: string | null) {
  if (!outletId) {
    return "Semua outlet";
  }

  return `Outlet ${outletId.slice(0, 8)}`;
}

export default function DashboardTopbar({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const { session, logout } = useAuth();
  const { selectedOutletId } = useOutlet();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [outlets, setOutlets] = useState<OutletLookupDto[]>([]);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadOutlets() {
      if (!isPrivilegedUser(session?.role)) {
        return;
      }

      try {
        setOutlets(await getOutlets());
      } catch {
        // best-effort label resolution only
      }
    }

    void loadOutlets();
  }, [session?.role]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const outletLabel = useMemo(() => {
    if (!selectedOutletId) {
      return "Semua outlet";
    }

    const matchedOutlet = outlets.find((outlet) => outlet.id === selectedOutletId);
    return matchedOutlet?.name ?? formatOutletLabel(selectedOutletId);
  }, [outlets, selectedOutletId]);

  return (
    <header className="sticky top-0 z-999 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-700 dark:border-gray-800 dark:text-gray-200 lg:hidden"
            aria-label="Toggle navigation"
          >
            <span className="space-y-1.5">
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
              MorrusPOS
            </p>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dashboard Operasional
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggleButton />
          <div className="hidden rounded-2xl border border-gray-200 px-4 py-2 text-right dark:border-gray-800 sm:block">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {session?.name ?? "Unknown User"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {session?.role ?? "Guest"} · {outletLabel}
            </p>
          </div>
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
            >
              Akun
            </button>
            {isProfileOpen ? (
              <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
                <div className="border-b border-gray-200 px-2 pb-3 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {session?.name ?? "Unknown User"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {session?.role ?? "Guest"} · {outletLabel}
                  </p>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    to="/profile/change-password"
                    onClick={() => setIsProfileOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Ganti password
                  </Link>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-error-700 hover:bg-error-50 dark:text-error-300 dark:hover:bg-error-500/10"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
