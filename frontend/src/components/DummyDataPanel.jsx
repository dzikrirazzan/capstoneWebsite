import { useState } from "react";
import { Database, Trash2, Plus, X, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

export default function DummyDataPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  const clearMessage = () => setMessage(null);

  const deployDummyData = async () => {
    try {
      setIsDeploying(true);
      clearMessage();
      const response = await fetch("/api/dummy-data", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to deploy dummy data");
      }

      setMessage({ type: "success", text: `✅ ${data.count} data dummy berhasil ditambahkan!` });

      // Reload page after 1.5s to refresh all data
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Deploy dummy data failed:", error);
      setMessage({ type: "error", text: `❌ Gagal: ${error.message}` });
    } finally {
      setIsDeploying(false);
    }
  };

  const removeDummyData = async () => {
    const confirmed = window.confirm("Hapus semua data dummy? Data yang ditandai dengan marker customSensor=-999 akan dihapus.");
    if (!confirmed) return;

    try {
      setIsRemoving(true);
      clearMessage();
      const response = await fetch("/api/dummy-data", { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove dummy data");
      }

      setMessage({ type: "success", text: `🗑️ ${data.count} data dummy berhasil dihapus!` });

      // Reload page after 1.5s to refresh all data
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Remove dummy data failed:", error);
      setMessage({ type: "error", text: `❌ Gagal: ${error.message}` });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          clearMessage();
        }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#F97316] to-[#EA580C] text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-110 hover:shadow-xl hover:shadow-orange-500/40 active:scale-95"
        title="Deploy Dummy Data"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Database className="h-6 w-6" />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-2xl">
          {/* Header */}
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-[#F97316] to-[#EA580C] p-2">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Dummy Data</h3>
              <p className="text-xs text-[var(--text-muted)]">Kelola data testing untuk demo</p>
            </div>
          </div>

          {/* Info */}
          <div className="mb-4 rounded-lg bg-[var(--accent-soft)] p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
              <p className="text-xs text-[var(--text-muted)]">
                Data dummy menggunakan marker <code className="rounded bg-[var(--bg-muted)] px-1 text-[var(--accent)]">customSensor=-999</code> sehingga bisa dihapus tanpa mempengaruhi data asli.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={deployDummyData}
              disabled={isDeploying || isRemoving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Deploy 50 Data Dummy
                </>
              )}
            </button>

            <button
              onClick={removeDummyData}
              disabled={isDeploying || isRemoving}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Hapus Data Dummy
                </>
              )}
            </button>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                message.type === "success" ? "border border-green-500/30 bg-green-500/10 text-green-500" : "border border-red-500/30 bg-red-500/10 text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      )}
    </>
  );
}
