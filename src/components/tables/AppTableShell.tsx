import type { ReactNode } from "react";

export default function AppTableShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {description ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}
