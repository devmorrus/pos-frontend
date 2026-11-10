import type { ReactNode } from "react";
import { Link } from "react-router";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxCubeIcon,
  CheckCircleIcon,
  PaperPlaneIcon,
  TimeIcon,
} from "../../../icons";

export type TransferStatusFilter = "all" | "pending" | "approved" | "rejected";

const statusOptions: { value: TransferStatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

const barTones = ["bg-warning-500", "bg-success-500", "bg-error-500"];

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9.167 15.833a6.667 6.667 0 1 0 0-13.333 6.667 6.667 0 0 0 0 13.333ZM17.5 17.5l-3.625-3.625"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StockTransfersTabs({ active }: { active: "outgoing" | "incoming" }) {
  const tabs = [
    {
      value: "outgoing",
      to: "/stock-transfers/outgoing",
      label: "Transfer keluar",
      icon: ArrowUpIcon,
    },
    {
      value: "incoming",
      to: "/stock-transfers/incoming",
      label: "Transfer masuk",
      icon: ArrowDownIcon,
    },
  ] as const;

  return (
    <nav
      aria-label="Jenis transfer stok"
      className="inline-flex rounded-2xl border border-gray-200 bg-white p-1 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.value === active;

        return (
          <Link
            key={tab.value}
            to={tab.to}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${
              isActive
                ? "bg-brand-500 text-white shadow-theme-xs"
                : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

function TransferRing({
  pending,
  approved,
  rejected,
}: {
  pending: number;
  approved: number;
  rejected: number;
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const total = pending + approved + rejected;
  const segments = [
    { key: "pending", value: pending, tone: "stroke-warning-500" },
    { key: "approved", value: approved, tone: "stroke-success-500" },
    { key: "rejected", value: rejected, tone: "stroke-error-500" },
  ].filter((segment) => segment.value > 0);
  const gap = segments.length > 1 ? 4 : 0;
  let offset = 0;

  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full -rotate-90"
        role="img"
        aria-label="Perbandingan status transfer stok"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          className="stroke-gray-100 dark:stroke-gray-800"
        />
        {segments.map((segment) => {
          const fraction = segment.value / total;
          const length = Math.max(fraction * circumference - gap, 0);
          const element = (
            <circle
              key={segment.key}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${length} ${circumference}`}
              strokeDashoffset={-offset}
              className={`${segment.tone} transition-all duration-500`}
            />
          );
          offset += fraction * circumference;
          return element;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-gray-900 dark:text-white">{total}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">transfer</span>
      </div>
    </div>
  );
}

export function StockTransfersSummary({
  pending,
  approved,
  rejected,
}: {
  pending: number;
  approved: number;
  rejected: number;
}) {
  const total = pending + approved + rejected;
  const distribution = [
    { label: "Menunggu", value: pending },
    { label: "Disetujui", value: approved },
    { label: "Ditolak", value: rejected },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-brand-50/80 via-white to-white p-6 shadow-theme-xs dark:border-gray-800 dark:from-brand-500/10 dark:via-gray-900 dark:to-gray-900 sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-success-500/10 blur-3xl"
      />

      <div className="relative grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
        <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col">
          <TransferRing pending={pending} approved={approved} rejected={rejected} />
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-gray-600 dark:text-gray-300">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-warning-500" />
              Menunggu
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-success-500" />
              Disetujui
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-error-500" />
              Ditolak
            </span>
          </div>
        </div>

        <div className="grid gap-3">
          {[
            {
              label: "Total transfer",
              value: total,
              icon: <PaperPlaneIcon className="h-5 w-5" />,
              iconClass:
                "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300",
            },
            {
              label: "Menunggu",
              value: pending,
              icon: <TimeIcon className="h-5 w-5" />,
              iconClass:
                "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-300",
            },
            {
              label: "Disetujui",
              value: approved,
              icon: <CheckCircleIcon className="h-5 w-5" />,
              iconClass:
                "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-300",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl border border-gray-200/80 bg-white/80 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}
              >
                {stat.icon}
              </div>
              <p className="flex-1 text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white/80 p-5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Sebaran status transfer
          </h3>
          <ul className="mt-4 space-y-3.5">
            {distribution.map((entry, index) => {
              const percentage = total ? Math.round((entry.value / total) * 100) : 0;

              return (
                <li key={entry.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {entry.label}
                    </span>
                    <span className="shrink-0 text-gray-500 dark:text-gray-400">
                      {entry.value} transfer · {percentage}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barTones[index]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          {total === 0 ? (
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Belum ada transfer pada outlet aktif.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function StockTransfersToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  counts,
  visibleCount,
  totalCount,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  status: TransferStatusFilter;
  onStatusChange: (value: TransferStatusFilter) => void;
  counts: Record<TransferStatusFilter, number>;
  visibleCount: number;
  totalCount: number;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari nomor transfer, outlet, atau peminta..."
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-9 text-sm text-gray-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Bersihkan pencarian"
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : null}
        </div>
        <p className="whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400">
          {visibleCount} dari {totalCount} transfer
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onStatusChange(option.value)}
            aria-pressed={status === option.value}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${
              status === option.value
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            {option.label}
            <span
              className={`rounded-full px-1.5 text-[10px] font-semibold ${
                status === option.value
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {counts[option.value]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function TransferEmptyState({
  title,
  description,
  action,
  tone = "brand",
}: {
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "brand" | "success" | "muted";
}) {
  const iconClass =
    tone === "success"
      ? "from-success-500 to-success-700 shadow-success-500/25"
      : tone === "muted"
        ? "from-gray-400 to-gray-600 shadow-gray-500/20"
        : "from-brand-500 to-brand-700 shadow-brand-500/25";

  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="relative">
        <div className="absolute inset-0 scale-125 rounded-full bg-brand-500/10 blur-xl" />
        <div
          className={`relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br text-white shadow-lg ${iconClass}`}
        >
          <BoxCubeIcon className="h-7 w-7" />
        </div>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
