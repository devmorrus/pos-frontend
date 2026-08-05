import { Link, useLocation } from "react-router";
import { getVisibleNavigation } from "../../app/router";
import { useAuth } from "../../features/auth/hooks/useAuth";
import MorrusLogo from "./MorrusLogo";

export default function DashboardSidebar({
  isOpen,
  onNavigate,
}: {
  isOpen: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const { session } = useAuth();
  const navigation = getVisibleNavigation(session);

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-9999 w-72 flex flex-col border-r border-gray-200 bg-white px-5 py-6 shadow-theme-lg transition-transform duration-300 dark:border-gray-800 dark:bg-gray-900 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <MorrusLogo />
        <div className="mt-8 flex-1 overflow-y-auto pr-1 space-y-2">
          {navigation.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/dashboard" && location.pathname.startsWith(item.path)) ||
              (item.path === "/inventory" && location.pathname.startsWith("/stock-opnames")) ||
              (item.path === "/stock-transfers/outgoing" &&
                location.pathname.startsWith("/stock-transfers"));

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={`menu-item ${
                  isActive ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive ? "menu-item-icon-active" : "menu-item-icon-inactive"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="menu-item-text">{item.label}</span>
                {item.status === "placeholder" ? (
                  <span className="ml-auto rounded-full bg-warning-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-warning-700 dark:bg-warning-500/10 dark:text-warning-300">
                    Soon
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </aside>

      {isOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onNavigate}
          className="fixed inset-0 z-999 bg-black/40 lg:hidden"
        />
      ) : null}
    </>
  );
}
