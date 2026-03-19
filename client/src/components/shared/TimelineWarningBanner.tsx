import { AlertTriangle } from "lucide-react";
import type { TimelineConflict } from "@/lib/dateUtils";

interface TimelineWarningBannerProps {
  conflicts: TimelineConflict[];
}

export default function TimelineWarningBanner({ conflicts }: TimelineWarningBannerProps) {
  if (conflicts.length === 0) return null;

  const hasError = conflicts.some((c) => c.severity === "error");
  const borderColor = hasError ? "border-red-200" : "border-orange-200";
  const bgColor = hasError ? "bg-red-50" : "bg-orange-50";
  const textColor = hasError ? "text-red-800" : "text-orange-800";
  const iconColor = hasError ? "text-red-500" : "text-orange-500";

  return (
    <div className={`mb-4 rounded-lg border ${borderColor} ${bgColor} px-4 py-3`}>
      <div className={`flex items-start gap-2 text-sm ${textColor}`}>
        <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
        <div className="space-y-1">
          {conflicts.length === 1 ? (
            <span>{conflicts[0].message}</span>
          ) : (
            <ul className="list-disc list-inside space-y-0.5">
              {conflicts.map((c, i) => (
                <li key={i}>{c.message}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
