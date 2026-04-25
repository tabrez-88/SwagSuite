import { EditableTextarea } from "@/components/shared/InlineEditable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StickyNote } from "lucide-react";
import type { Order } from "@shared/schema";

interface NotesCardProps {
  order: Order;
  isLocked: boolean;
  updateField: (fields: Record<string, unknown>) => void;
  isPending: boolean;
}

export default function NotesCard({
  order,
  isLocked,
  updateField,
  isPending,
}: NotesCardProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <StickyNote className="w-4 h-4" />
          Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">General Notes</p>
          <EditableTextarea
            value={order?.notes || ""}
            field="notes"
            onSave={updateField}
            placeholder="Add general notes..."
            emptyText="No notes"
            isLocked={isLocked}
            isPending={isPending}
          />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Customer Notes</p>
          <EditableTextarea
            value={order?.customerNotes || ""}
            field="customerNotes"
            onSave={updateField}
            placeholder="Add customer-visible notes..."
            emptyText="No customer notes"
            isLocked={isLocked}
            isPending={isPending}
          />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Internal Notes</p>
          <EditableTextarea
            value={order?.internalNotes || ""}
            field="internalNotes"
            onSave={updateField}
            placeholder="Add internal notes..."
            emptyText="No internal notes"
            isLocked={isLocked}
            isPending={isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}
