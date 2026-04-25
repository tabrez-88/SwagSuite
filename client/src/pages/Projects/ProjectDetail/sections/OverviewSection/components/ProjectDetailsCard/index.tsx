import { EditableDate, EditableText } from "@/components/shared/InlineEditable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Building2, Calendar, Package, Users } from "lucide-react";
import TeamMemberPicker from "../TeamMemberPicker";
import type { useProjectData } from "../../../../hooks";

interface ProjectDetailsCardProps {
  order: NonNullable<ReturnType<typeof useProjectData>["order"]>;
  companyName: string;
  primaryContact: ReturnType<typeof useProjectData>["primaryContact"];
  assignedUser: ReturnType<typeof useProjectData>["assignedUser"];
  csrUser: ReturnType<typeof useProjectData>["csrUser"];
  teamMembers: ReturnType<typeof useProjectData>["teamMembers"];
  businessStage: ReturnType<typeof useProjectData>["businessStage"];
  isLocked: boolean;
  updateField: (fields: Record<string, unknown>) => void;
  isPending: boolean;
  openPopover: "salesRep" | "csr" | null;
  setOpenPopover: (val: "salesRep" | "csr" | null) => void;
  onReassign: (vars: { field: "assignedUserId" | "csrUserId"; userId: string | null }) => void;
  renderDateBadgeJsx: (dateValue: string) => React.ReactNode;
}

export default function ProjectDetailsCard({
  order,
  companyName,
  primaryContact,
  assignedUser,
  csrUser,
  teamMembers,
  businessStage,
  isLocked,
  updateField,
  isPending,
  openPopover,
  setOpenPopover,
  onReassign,
  renderDateBadgeJsx,
}: ProjectDetailsCardProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Package className="w-4 h-4" />
          Project Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {/* Company & Contact */}
        <div className="flex items-start gap-3 pb-3">
          <Building2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium truncate">{companyName}</p>
            {primaryContact && (
              <p className="text-sm text-muted-foreground truncate">
                {primaryContact.firstName} {primaryContact.lastName}
                {primaryContact.email && (
                  <span className="text-xs"> &middot; {primaryContact.email}</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Stage & Project Info */}
        <div className="border-t pt-3 pb-3 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Stage</span>
            <div className="flex items-center gap-1.5">
              {businessStage && (
                <>
                  <Badge className={`${businessStage.stage.color} ${businessStage.stage.textColor}`}>
                    {businessStage.stage.label}
                  </Badge>
                  <Badge className={businessStage.currentSubStatus.color}>
                    {businessStage.currentSubStatus.label}
                  </Badge>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              Order #
            </span>
            <span className="text-sm font-medium">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Project Name</span>
            <EditableText
              value={order.projectName || ""}
              field="projectName"
              onSave={updateField}
              placeholder="Add project name"
              isLocked={isLocked}
              isPending={isPending}
              className="font-medium"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Budget</span>
            <EditableText
              value={order.budget || ""}
              field="budget"
              onSave={updateField}
              type="number"
              prefix="$"
              placeholder="0.00"
              emptyText="Not set"
              isLocked={isLocked}
              isPending={isPending}
              className="font-medium text-emerald-700"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Customer PO</span>
            <EditableText
              value={order?.customerPo || ""}
              field="customerPo"
              onSave={updateField}
              placeholder="Add PO #"
              isLocked={isLocked}
              isPending={isPending}
              className="font-medium"
            />
          </div>
          {order.orderType === "rush_order" && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Order Type</span>
              <Badge variant="destructive" className="text-xs">Rush Order</Badge>
            </div>
          )}
          {order.createdAt && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm">{format(new Date(order.createdAt), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="border-t pt-3 pb-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">In-Hands Date</span>
                <EditableDate
                  value={order.inHandsDate}
                  field="inHandsDate"
                  onSave={updateField}
                  isLocked={isLocked}
                  isPending={isPending}
                  renderExtra={renderDateBadgeJsx}
                  className="font-medium"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Event Date</span>
                <EditableDate
                  value={order.eventDate}
                  field="eventDate"
                  onSave={updateField}
                  isLocked={isLocked}
                  isPending={isPending}
                  renderExtra={renderDateBadgeJsx}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="border-t pt-3 space-y-2.5">
          <div className="flex items-center gap-1.5 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Team</span>
          </div>
          <TeamMemberPicker
            role="Sales Rep"
            field="assignedUserId"
            currentUser={assignedUser}
            teamMembers={teamMembers}
            isLocked={isLocked}
            openPopover={openPopover}
            setOpenPopover={setOpenPopover}
            onReassign={onReassign}
          />
          <TeamMemberPicker
            role="CSR"
            field="csrUserId"
            currentUser={csrUser}
            teamMembers={teamMembers}
            isLocked={isLocked}
            openPopover={openPopover}
            setOpenPopover={setOpenPopover}
            onReassign={onReassign}
          />
        </div>
      </CardContent>
    </Card>
  );
}
