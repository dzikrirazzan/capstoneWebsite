import { Activity, Sun, Moon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../lib/utils.js";

const navigation = [
  { label: "Dashboard", href: "/" },
  { label: "Analisis", href: "/analytics" },
  { label: "Riwayat Sensor", href: "/history" },
];

export default function Header({ theme, onToggleTheme }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-root)]/85 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        {/* Mobile & Desktop: Logo + Theme Toggle */}
        <div className="flex items-center justify-between gap-3 mb-4 md:mb-0">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C] p-2 shadow-lg">
              <img src="/favicon.svg" alt="EMSys Logo" className="h-6 w-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-[var(--text-primary)] md:text-xl">EMSys - Engine Monitoring System</h1>
              <p className="text-xs text-[var(--text-muted)] md:text-sm">Dasbor pemantauan mesin secara real-time</p>
            </div>
            <div className="block sm:hidden">
              <h1 className="text-base font-semibold text-[var(--text-primary)]">EMSys</h1>
              <p className="text-xs text-[var(--text-muted)]">Engine Monitor</p>
            </div>
          </div>

          <button onClick={onToggleTheme} aria-label="Toggle theme" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] transition hover:border-[var(--accent)]">
            {theme === "dark" ? <Sun className="h-4 w-4 text-[var(--text-secondary)]" /> : <Moon className="h-4 w-4 text-[var(--text-secondary)]" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-2 py-2 text-xs font-medium text-[var(--text-muted)] md:justify-center md:border-none md:bg-transparent md:px-0 md:text-base">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn("whitespace-nowrap rounded-lg px-3 py-2 transition", isActive ? "bg-[var(--accent)] text-white md:bg-[var(--accent-soft)] md:text-[var(--accent)]" : "hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
