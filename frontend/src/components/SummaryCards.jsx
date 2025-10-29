import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function SummaryCards({ summaryCounts }) {
  const cards = [
    {
      label: "Total Data",
      value: summaryCounts.total ?? 0,
      description: "Seluruh entri sensor yang tersimpan",
    },
    {
      label: "24 Jam Terakhir",
      value: summaryCounts.day ?? 0,
      description: "Data baru dalam 24 jam terakhir",
    },
    {
      label: "7 Hari Terakhir",
      value: summaryCounts.week ?? 0,
      description: "Data baru selama 7 hari terakhir",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const value = Number(card.value ?? 0);
        const formattedValue = Number.isNaN(value) ? "0" : value.toLocaleString("id-ID");
        return (
        <div key={card.label} className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{formattedValue}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{card.description}</p>
          </div>
          <Link to="/history" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] transition hover:text-[var(--accent-strong)]">
            Lihat Riwayat
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        );
      })}
    </div>
  );
}
