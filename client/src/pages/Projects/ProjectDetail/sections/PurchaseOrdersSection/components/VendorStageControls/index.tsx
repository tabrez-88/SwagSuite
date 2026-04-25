import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { GeneratedDocument } from "@shared/schema";

interface ActionType {
  id: string;
  name: string;
}

export interface VendorStageControlsProps {
  vendorDoc: GeneratedDocument;
  PO_STAGES: Record<string, { label: string; color: string }>;
  PO_STATUSES: Record<string, { label: string; color: string }>;
  actionTypes: ActionType[];
  isLocked: boolean;
  onUpdateDocMeta: (params: { docId: string; updates: Record<string, unknown> }) => void;
  isUpdating: boolean;
  order: Record<string, unknown> | null;
  initialStageId?: string;
}

export default function VendorStageControls({
  vendorDoc, PO_STAGES, PO_STATUSES, actionTypes,
  isLocked, onUpdateDocMeta, order, initialStageId = "created",
}: VendorStageControlsProps) {
  const meta = vendorDoc.metadata as Record<string, unknown> | null;
  const docStage = (meta?.poStage as string) || initialStageId;
  const docStatus = (meta?.poStatus as string) || "ok";

  return (
    <div className="border-b p-4 flex items-center gap-4 flex-wrap">
      <div>
        <label className="text-[10px] font-medium text-gray-500 block mb-1">PO Stage</label>
        <Select
          value={docStage}
          onValueChange={(val) => onUpdateDocMeta({
            docId: vendorDoc.id,
            updates: { metadata: { ...(meta || {}), poStage: val } },
          })}
          disabled={isLocked}
        >
          <SelectTrigger className="h-8 text-xs w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PO_STAGES).map(([key, val]) => (
              <SelectItem key={key} value={key}>
                <span className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${val.color.split(" ")[0]}`} />
                  {val.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-[10px] font-medium text-gray-500 block mb-1">PO Status</label>
        <Select
          value={docStatus}
          onValueChange={(val) => onUpdateDocMeta({
            docId: vendorDoc.id,
            updates: { metadata: { ...(meta || {}), poStatus: val } },
          })}
          disabled={isLocked}
        >
          <SelectTrigger className="h-8 text-xs w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PO_STATUSES).map(([key, val]) => (
              <SelectItem key={key} value={key}>
                <span className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${val.color.split(" ")[0]}`} />
                  {val.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-[10px] font-medium text-gray-500 block mb-1">Next Action</label>
        <Select
          value={(meta?.nextActionType as string) || ''}
          onValueChange={(val) => onUpdateDocMeta({
            docId: vendorDoc.id,
            updates: { metadata: { ...(meta || {}), nextActionType: val } },
          })}
          disabled={isLocked}
        >
          <SelectTrigger className="h-8 text-xs w-[160px]">
            <SelectValue placeholder="Select action" />
          </SelectTrigger>
          <SelectContent>
            {actionTypes.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-[10px] font-medium text-gray-500 block mb-1">Next Action Date</label>
        <Input
          type="date"
          value={(meta?.nextActionDate as string) || ''}
          onChange={(e) => onUpdateDocMeta({
            docId: vendorDoc.id,
            updates: { metadata: { ...(meta || {}), nextActionDate: e.target.value } },
          })}
          className="h-8 text-xs w-[160px]"
          disabled={isLocked}
        />
      </div>
      {(order?.inHandsDate as string) ? (
        <div className="text-[10px] text-gray-500 ml-auto">
          Customer IHD: <strong>{new Date(order!.inHandsDate as string).toLocaleDateString()}</strong>
        </div>
      ) : null}
    </div>
  );
}
