import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { getVisibleNavigation, appNavigation } from "../../app/router";
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

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let activeGroupLabel = "";
    appNavigation.forEach((item) => {
      if (item.subItems) {
        const hasActiveSub = item.subItems.some((sub) => {
          return (
            location.pathname === sub.path ||
            (sub.path !== "/dashboard" && location.pathname.startsWith(sub.path)) ||
            (sub.path === "/inventory" && location.pathname.startsWith("/stock-opnames")) ||
            (sub.path === "/stock-transfers/outgoing" &&
              location.pathname.startsWith("/stock-transfers"))
          );
        });
        if (hasActiveSub) {
          activeGroupLabel = item.label;
        }
      }
    });

    if (activeGroupLabel) {
      setExpandedGroups({ [activeGroupLabel]: true });
    } else {
      setExpandedGroups({});
    }
  }, [location.pathname]);

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({
      [label]: !prev[label],
    }));
  };

  const isGroupActive = (item: any) => {
    if (!item.subItems) return false;
    return item.subItems.some((sub: any) => {
      return (
        location.pathname === sub.path ||
        (sub.path !== "/dashboard" && location.pathname.startsWith(sub.path)) ||
        (sub.path === "/inventory" && location.pathname.startsWith("/stock-opnames")) ||
        (sub.path === "/stock-transfers/outgoing" &&
          location.pathname.startsWith("/stock-transfers"))
      );
    });
  };

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
            if (item.subItems) {
              const isExpanded = !!expandedGroups[item.label];
              const groupActive = isGroupActive(item);

              return (
                <div key={item.label} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.label)}
                    className={`menu-item w-full flex items-center justify-between ${
                      groupActive ? "menu-item-active" : "menu-item-inactive"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`menu-item-icon-size ${
                          groupActive ? "menu-item-icon-active" : "menu-item-icon-inactive"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="menu-item-text">{item.label}</span>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="pl-9 space-y-1">
                      {item.subItems.map((sub) => {
                        const isSubActive =
                          location.pathname === sub.path ||
                          (sub.path !== "/dashboard" && location.pathname.startsWith(sub.path)) ||
                          (sub.path === "/inventory" && location.pathname.startsWith("/stock-opnames")) ||
                          (sub.path === "/stock-transfers/outgoing" &&
                            location.pathname.startsWith("/stock-transfers"));

                        return (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            onClick={onNavigate}
                            className={`menu-dropdown-item ${
                              isSubActive
                                ? "menu-dropdown-item-active"
                                : "menu-dropdown-item-inactive"
                            }`}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive =
              location.pathname === item.path ||
              (item.path !== "/dashboard" && location.pathname.startsWith(item.path!));

            return (
              <Link
                key={item.path}
                to={item.path!}
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
