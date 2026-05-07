import { Check } from "lucide-react";
import { STAGE_ORDER, BUSINESS_STAGES, type DeterminedStage } from "@/constants/businessStages";

interface StageTimelineProps {
  determined: DeterminedStage;
}

export function StageTimeline({ determined }: StageTimelineProps) {
  const currentIdx = STAGE_ORDER.indexOf(determined.stage.id);

  return (
    <div className="flex items-center w-full gap-0.5">
      {STAGE_ORDER.map((stageId, idx) => {
        const stage = BUSINESS_STAGES[stageId];
        const isPast = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isFuture = idx > currentIdx;

        return (
          <div key={stageId} className="flex items-center flex-1 min-w-0">
            {/* Stage node */}
            <div className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {/* Left connector */}
                {idx > 0 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors ${
                      isPast || isCurrent ? stage.color.replace("bg-", "bg-") : "bg-gray-200"
                    }`}
                  />
                )}
                {/* Circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all ${
                    isPast
                      ? "bg-green-500 text-white"
                      : isCurrent
                        ? `${stage.color} ${stage.textColor} ring-2 ring-offset-1 ring-${stage.color.replace("bg-", "")}`
                        : "bg-gray-200 text-gray-400"
                  }`}
                  style={isCurrent ? { boxShadow: `0 0 0 2px ${stage.strokeColor}33` } : undefined}
                >
                  {isPast ? <Check className="w-3.5 h-3.5" /> : stage.abbreviation}
                </div>
                {/* Right connector */}
                {idx < STAGE_ORDER.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors ${
                      isPast ? "bg-green-400" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
              {/* Label */}
              <span
                className={`text-[10px] mt-1 truncate text-center w-full ${
                  isCurrent ? "font-semibold text-gray-900" : isFuture ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {stage.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
