import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useUnlockSection } from "@/services/projects/mutations";
import type { SectionLockStatus } from "@/hooks/useLockStatus";

type SectionKey = "quote" | "salesOrder" | "invoice";

interface LockBannerProps {
  lockStatus: SectionLockStatus;
  sectionName: string;
  sectionKey: SectionKey;
  projectId: string;
}

export default function LockBanner({
  lockStatus,
  sectionName,
  sectionKey,
  projectId,
}: LockBannerProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const unlockMutation = useUnlockSection(projectId);

  if (!lockStatus.isLocked) return null;

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-amber-800">
          <Lock className="h-4 w-4 flex-shrink-0" />
          <span>{lockStatus.reason}</span>
        </div>
        {lockStatus.canUnlock && (
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
            onClick={() => setShowConfirm(true)}
            disabled={unlockMutation.isPending}
          >
            <Unlock className="mr-1.5 h-3.5 w-3.5" />
            Unlock
          </Button>
        )}
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlock {sectionName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will allow editing of {sectionName.toLowerCase()} data that
              was previously locked. All changes will be logged in the activity
              timeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unlockMutation.mutate(sectionKey)}
              disabled={unlockMutation.isPending}
            >
              {unlockMutation.isPending ? "Unlocking..." : "Unlock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
