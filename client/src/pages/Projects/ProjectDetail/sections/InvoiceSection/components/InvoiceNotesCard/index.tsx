import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface InvoiceNotesCardProps {
  notes: string;
  isPaid: boolean;
  onNotesChange: (value: string) => void;
  onNotesBlur: () => void;
}

export default function InvoiceNotesCard({
  notes,
  isPaid,
  onNotesChange,
  onNotesBlur,
}: InvoiceNotesCardProps) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm">Invoice Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          onBlur={onNotesBlur}
          placeholder="Add notes to this invoice (visible on PDF)..."
          className="min-h-[80px] resize-none text-sm"
          disabled={isPaid}
        />
      </CardContent>
    </Card>
  );
}
