import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface MarginWarningDialogProps {
  open: boolean;
  marginWarningValue: number;
  minimumMargin: number;
  onDismiss: () => void;
  onConfirm: () => void;
}

export function MarginWarningDialog({
  open,
  marginWarningValue,
  minimumMargin,
  onDismiss,
  onConfirm,
}: MarginWarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onDismiss(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Below Minimum Margin
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <p>
                The margin for this product is{" "}
                <strong className="text-red-600">{marginWarningValue.toFixed(1)}%</strong>, which is below
                the company minimum of <strong>{minimumMargin}%</strong>.
              </p>
              <p className="mt-2 text-orange-600 font-medium">
                Are you sure you want to save with this margin?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDismiss}>Go Back & Adjust</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-orange-600 hover:bg-orange-700">
            Save Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
