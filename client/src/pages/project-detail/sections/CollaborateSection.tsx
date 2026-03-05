import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { MessageSquare, User } from "lucide-react";
import type { useProjectData } from "../hooks/useProjectData";

import ActivitiesSection from "@/components/sections/ActivitiesSection";

interface CollaborateSectionProps {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
}

export default function CollaborateSection({ orderId, data }: CollaborateSectionProps) {
  const { assignedUser, csrUser } = data;

  return (
    <div className="space-y-6">
      {/* Team Assignments */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="w-4 h-4" />
            Team Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Sales Rep:</span>
              {assignedUser ? (
                <div className="flex items-center gap-2">
                  <UserAvatar user={assignedUser} />
                  <span className="text-sm font-medium">
                    {assignedUser.firstName} {assignedUser.lastName}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Unassigned</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">CSR:</span>
              {csrUser ? (
                <div className="flex items-center gap-2">
                  <UserAvatar user={csrUser} />
                  <span className="text-sm font-medium">
                    {csrUser.firstName} {csrUser.lastName}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Unassigned</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities & Internal Notes */}
      <ActivitiesSection orderId={orderId} data={data} />
    </div>
  );
}
