import { useEffect, useMemo, useState } from "react";
import { LockKeyhole, LogIn, ShieldCheck, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../Header";
import { getRoleFromUser, RESEARCHER_DUMMY_ACCOUNT, ROLES } from "../../lib/auth.js";

export default function LoginPage({ theme, onToggleTheme, currentUser, onLogout, onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState(RESEARCHER_DUMMY_ACCOUNT.username);
  const [password, setPassword] = useState(RESEARCHER_DUMMY_ACCOUNT.password);
  const [error, setError] = useState("");

  const redirectPath = useMemo(() => {
    const fromPath = location.state?.from?.pathname;
    return fromPath && fromPath !== "/login" ? fromPath : "/analytics";
  }, [location.state]);

  const isResearcher = getRoleFromUser(currentUser) === ROLES.RESEARCHER;

  useEffect(() => {
    if (isResearcher) {
      navigate(redirectPath, { replace: true });
    }
  }, [isResearcher, navigate, redirectPath]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const result = onLogin?.({ username, password });
    if (!result?.ok) {
      setError(result?.error ?? "Login gagal.");
      return;
    }

    navigate(redirectPath, { replace: true });
  };

  return (
    <div className="min-h-screen">
      <Header theme={theme} onToggleTheme={onToggleTheme} currentUser={currentUser} onLogout={onLogout} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <section className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
          <div className="card-container p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-[var(--accent-soft)] p-2">
                <ShieldCheck className="h-6 w-6 text-[var(--accent)]" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Login Peneliti</h1>
                <p className="text-sm text-[var(--text-muted)]">Masuk untuk membuka Analytics, History, filter data historis, dan pengelolaan data.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-[var(--text-muted)]" />
                  <p className="font-semibold text-[var(--text-primary)]">Pengguna Umum</p>
                </div>
                <p className="text-sm text-[var(--text-muted)]">Tanpa login, pengguna tetap dapat membuka dashboard, melihat data terbaru, grafik monitoring, mengubah tema, dan mengekspor data.</p>
              </div>

              <div className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-soft)] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <LockKeyhole className="h-5 w-5 text-[var(--accent)]" />
                  <p className="font-semibold text-[var(--text-primary)]">Peneliti</p>
                </div>
                <p className="text-sm text-[var(--text-muted)]">Setelah login, peneliti dapat mengakses halaman analisis, riwayat data, filter historis, dan aksi manajemen data.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="card-container p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Akun Demo Peneliti</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Gunakan kredensial dummy berikut untuk kebutuhan demo dan sidang.</p>
            </div>

            <div className="mb-4 rounded-lg bg-[var(--bg-muted)] p-4 text-sm text-[var(--text-secondary)]">
              <p>
                Username: <span className="font-semibold text-[var(--text-primary)]">{RESEARCHER_DUMMY_ACCOUNT.username}</span>
              </p>
              <p>
                Password: <span className="font-semibold text-[var(--text-primary)]">{RESEARCHER_DUMMY_ACCOUNT.password}</span>
              </p>
            </div>

            <label className="mb-4 flex flex-col gap-2 text-sm font-medium text-[var(--text-muted)]">
              <span>Username</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
                autoComplete="username"
              />
            </label>

            <label className="mb-4 flex flex-col gap-2 text-sm font-medium text-[var(--text-muted)]">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
                autoComplete="current-password"
              />
            </label>

            {error && <div className="mb-4 rounded-lg border border-red-500/40 bg-[rgba(239,68,68,0.12)] px-4 py-3 text-sm text-[#fca5a5]">{error}</div>}

            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]">
              <LogIn className="h-4 w-4" />
              Masuk sebagai Peneliti
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
