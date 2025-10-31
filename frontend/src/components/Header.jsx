import { Activity, Sun, Moon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../lib/utils.js";

const navigation = [
  { label: "Dashboard", href: "/" },
  { label: "Riwayat Sensor", href: "/history" },
];

export default function Header({ theme, onToggleTheme }) {

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-root)]/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-3 md:justify-start">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--accent-soft)] p-2">
              <Activity className="h-6 w-6 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)] md:text-xl">FuelSense Monitor</h1>
              <p className="text-sm text-[var(--text-muted)]">Dasbor pemantauan mesin secara real-time</p>
            </div>
          </div>

          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="ml-4 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] transition hover:border-[var(--accent)] md:hidden"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-[var(--text-secondary)]" />
            ) : (
              <Moon className="h-4 w-4 text-[var(--text-secondary)]" />
            )}
          </button>
        </div>

        <nav className="flex w-full gap-2 overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] md:w-auto md:border-none md:bg-transparent md:px-0 md:py-0 md:text-base md:gap-6">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "whitespace-nowrap rounded-lg px-3 py-1 transition",
                  isActive
                    ? "bg-[var(--accent-soft)] text-[var(--accent)] md:bg-transparent md:text-[var(--text-primary)]"
                    : "hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] md:hover:bg-transparent"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center justify-end">
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="h-10 w-10 flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] transition hover:border-[var(--accent)]"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-[var(--text-secondary)]" />
            ) : (
              <Moon className="h-4 w-4 text-[var(--text-secondary)]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
