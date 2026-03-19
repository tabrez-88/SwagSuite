import { Check } from "lucide-react";
import type { DeterminedStage } from "@/constants/businessStages";

interface StageBadgeProps {
  stage: DeterminedStage;
  size?: "sm" | "md";
  showLabel?: boolean;
  showSubStatus?: boolean;
}

export function StageBadge({
  stage: determined,
  size = "md",
  showLabel = true,
  showSubStatus = true,
}: StageBadgeProps) {
  const { stage, currentSubStatus, progressPercent } = determined;
  const dim = size === "sm" ? 28 : 36;
  const strokeWidth = size === "sm" ? 2.5 : 3;
  const radius = dim / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const isComplete = stage.id === "invoice" && currentSubStatus.value === "paid";
  const abbrevSize = size === "sm" ? "text-[9px]" : "text-[11px]";
  const innerInset = size === "sm" ? "inset-[3px]" : "inset-[4px]";

  return (
    <div className="flex items-center gap-2.5">
      {/* Circular badge with SVG progress ring */}
      <div className="relative flex-shrink-0" style={{ width: dim, height: dim }}>
        <svg
          width={dim}
          height={dim}
          className="absolute z-10 top-0 left-0 -rotate-90"
        >
          {/* Background track */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="#004855"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="#1ad7f8"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        {/* Center content */}
        <div
          className={`absolute ${innerInset} rounded-full flex items-center justify-center ${abbrevSize} font-bold ${stage.color} ${stage.textColor}`}
        >
          {isComplete ? <Check className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} /> : stage.abbreviation}
        </div>
      </div>

      {/* Text labels */}
      {(showLabel || showSubStatus) && (
        <div className="min-w-0">
          {showLabel && (
            <p className="text-sm font-medium text-gray-900 truncate leading-tight">
              {stage.label}
            </p>
          )}
          {showSubStatus && (
            <span
              className={`text-[11px] ${currentSubStatus.color} inline-block px-1.5 py-0.5 rounded-full mt-0.5 leading-tight font-medium`}
            >
              {currentSubStatus.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
