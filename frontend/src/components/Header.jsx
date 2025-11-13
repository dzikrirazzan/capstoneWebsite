import { useState } from "react";
import { Sun, Moon, Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../lib/utils.js";

const navigation = [
  { label: "Dashboard", href: "/" },
  { label: "Analisis", href: "/analytics" },
  { label: "Riwayat Data", href: "/history" },
];

export default function Header({ theme, onToggleTheme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-root)]/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C] p-2 shadow-lg">
            <img src="/favicon.svg" alt="EMSys Logo" className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)] md:text-xl">EMSys - Engine Monitoring System</h1>
            <p className="hidden text-sm text-[var(--text-muted)] sm:block">Dasbor pemantauan mesin secara real-time</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navigation.map((item) => (
            <NavLink key={item.href} to={item.href} className={({ isActive }) => cn("text-base font-medium transition", isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--accent)]")}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Side: Theme Toggle + Mobile Menu */}
        <div className="flex items-center gap-2">
          <button onClick={onToggleTheme} aria-label="Toggle theme" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] transition hover:border-[var(--accent)]">
            {theme === "dark" ? <Sun className="h-4 w-4 text-[var(--text-secondary)]" /> : <Moon className="h-4 w-4 text-[var(--text-secondary)]" />}
          </button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] transition hover:border-[var(--accent)] md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-[var(--text-secondary)]" /> : <Menu className="h-5 w-5 text-[var(--text-secondary)]" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-root)] md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-3">
            {navigation.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => cn("rounded-lg px-4 py-3 text-base font-medium transition", isActive ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
