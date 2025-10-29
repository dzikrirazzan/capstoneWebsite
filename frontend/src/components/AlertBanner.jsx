import { AlertTriangle } from "lucide-react";

export default function AlertBanner({ message, rpm }) {
  return (
    <div className="bg-[#ef4444] py-3 px-4 text-white shadow-lg shadow-[#ef4444]/40">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center gap-3 text-sm font-medium">
        <AlertTriangle className="h-5 w-5" />
        <span>{message}</span>
        <span className="opacity-90">RPM: {rpm.toFixed(0)}</span>
      </div>
    </div>
  );
}
