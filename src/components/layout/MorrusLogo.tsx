import { Link } from "react-router";

export default function MorrusLogo() {
  return (
    <Link to="/dashboard" className="group inline-flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 text-sm font-bold text-white shadow-theme-lg transition-transform duration-300 group-hover:scale-[1.03]">
        MP
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-semibold tracking-[0.02em] text-gray-900 dark:text-white">
          MorrusPOS
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Platform operasional ritel terpadu
        </span>
      </span>
    </Link>
  );
}
