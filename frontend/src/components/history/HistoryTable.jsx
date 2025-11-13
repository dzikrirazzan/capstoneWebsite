import { formatDate, formatNumber } from "../../lib/utils.js";

export default function HistoryTable({ data }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
      <table className="min-w-full divide-y divide-[var(--border-color)]">
        <thead>
          <tr className="bg-[var(--bg-muted)] text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <th className="px-4 py-3">Waktu</th>
            <th className="px-4 py-3">Putaran Mesin</th>
            <th className="px-4 py-3">Torsi</th>
            <th className="px-4 py-3">Aliran Udara</th>
            <th className="px-4 py-3">Suhu</th>
            <th className="px-4 py-3">Konsumsi BBM</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-color)] text-sm text-[var(--text-secondary)]">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-[var(--bg-muted)]/70">
              <td className="whitespace-nowrap px-4 py-3 text-[var(--text-muted)]">{formatDate(row.timestamp)}</td>
              <td className="px-4 py-3 font-semibold">{formatNumber(row.rpm, 0)}</td>
              <td className="px-4 py-3">{formatNumber(row.torque, 1)} Nm</td>
              <td className="px-4 py-3">{formatNumber(row.maf, 1)} g/s</td>
              <td className="px-4 py-3">{formatNumber(row.temperature, 1)} °C</td>
              <td className="px-4 py-3">{formatNumber(row.fuelConsumption, 2)} L/h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
