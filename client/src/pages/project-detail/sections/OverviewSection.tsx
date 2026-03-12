import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { UserAvatar } from "@/components/UserAvatar";
// import { useProductionStages } from "@/hooks/useProductionStages";
import { useToast } from "@/hooks/use-toast";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import { EditableText, EditableDate, EditableTextarea } from "@/components/InlineEditable";
import {
  Building2,
  Calendar,
  Check,
  FileText,
  Hash,
  Mail,
  Package,
  Pencil,
  Store,
  StickyNote,
  TrendingUp,
  UserX,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { getDateStatus } from "@/lib/dateUtils";
import type { useProjectData } from "../hooks/useProjectData";

import ActivitiesSection from "@/components/sections/ActivitiesSection";
import EmailSection from "@/components/sections/EmailSection";
import VendorSection from "@/components/sections/VendorSection";

interface OverviewSectionProps {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
  isLocked?: boolean;
}

export default function OverviewSection({ orderId, data, isLocked = false }: OverviewSectionProps) {
  const {
    order,
    orderItems,
    companyName,
    primaryContact,
    assignedUser,
    csrUser,
    teamMembers,
  } = data;

  // const { stages: productionStages } = useProductionStages();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openPopover, setOpenPopover] = useState<"salesRep" | "csr" | null>(null);

  const { updateField, isPending } = useInlineEdit({ orderId, isLocked });

  const reassignMutation = useMutation({
    mutationFn: async ({ field, userId }: { field: "assignedUserId" | "csrUserId"; userId: string | null }) => {
      const { apiRequest } = await import("@/lib/queryClient");
      const res = await apiRequest("PATCH", `/api/orders/${orderId}`, { [field]: userId });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      const label = variables.field === "assignedUserId" ? "Sales Rep" : "CSR";
      toast({ title: `${label} updated` });
      setOpenPopover(null);
    },
    onError: () => {
      toast({ title: "Failed to update assignment", variant: "destructive" });
    },
  });

  if (!order) return null;

  const completedStages = (order as any)?.stagesCompleted || [];
  const currentStage = (order as any)?.currentStage;

  const renderDateBadge = (dateValue: string) => {
    const ds = getDateStatus(dateValue);
    return ds ? <Badge className={`text-[10px] px-1.5 py-0 leading-4 ${ds.color}`}>{ds.label}</Badge> : null;
  };

  const TeamMemberPicker = ({
    role,
    field,
    currentUser,
  }: {
    role: string;
    field: "assignedUserId" | "csrUserId";
    currentUser: typeof assignedUser;
  }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{role}</span>
      <Popover
        open={openPopover === (field === "assignedUserId" ? "salesRep" : "csr")}
        onOpenChange={(open) =>
          setOpenPopover(open ? (field === "assignedUserId" ? "salesRep" : "csr") : null)
        }
      >
        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              <UserAvatar size="xs" user={currentUser} />
              <span className="text-sm font-medium">
                {currentUser.firstName} {currentUser.lastName}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground italic">Unassigned</span>
          )}
          {!isLocked && (
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                <Pencil className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
          )}
        </div>
        <PopoverContent className="p-0 w-60" align="end">
          <Command>
            <CommandInput placeholder="Search team..." />
            <CommandList>
              <CommandEmpty>No team members found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => reassignMutation.mutate({ field, userId: null })}
                  className="flex items-center gap-2"
                >
                  <UserX className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Unassign</span>
                </CommandItem>
                {teamMembers.map((member) => {
                  const isSelected = currentUser?.id === member.id;
                  return (
                    <CommandItem
                      key={member.id}
                      value={`${member.firstName} ${member.lastName} ${member.email}`}
                      onSelect={() => reassignMutation.mutate({ field, userId: member.id })}
                      className="flex items-center gap-2"
                    >
                      <UserAvatar size="xs" user={member} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Internal Notes & Activities */}
        <ActivitiesSection orderId={orderId} data={data} />

        {/* Tabs */}
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="flex-wrap">
            <TabsTrigger value="summary">
              <FileText className="w-4 h-4 mr-1" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="client-email">
              <Mail className="w-4 h-4 mr-1" />
              Client Communication
            </TabsTrigger>
            <TabsTrigger value="vendor-email">
              <Store className="w-4 h-4 mr-1" />
              Vendor Communication
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Details */}
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
                        {data.businessStage && (
                          <>
                            <Badge className={`${data.businessStage.stage.color} ${data.businessStage.stage.textColor}`}>
                              {data.businessStage.stage.label}
                            </Badge>
                            <Badge className={data.businessStage.currentSubStatus.color}>
                              {data.businessStage.currentSubStatus.label}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5" />
                        Order #
                      </span>
                      <span className="text-sm font-mono font-medium">{order.orderNumber}</span>
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
                        value={(order as any)?.customerPo || ""}
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
                    <div className="flex items-start gap-3">
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
                            renderExtra={renderDateBadge}
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
                            renderExtra={renderDateBadge}
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
                    <TeamMemberPicker role="Sales Rep" field="assignedUserId" currentUser={assignedUser} />
                    <TeamMemberPicker role="CSR" field="csrUserId" currentUser={csrUser} />
                  </div>
                </CardContent>
              </Card>

              {/* Items Count */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Items</p>
                      <p className="text-lg font-bold">{orderItems.length}</p>
                      <p className="text-xs text-gray-500">
                        Qty: {orderItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>${Number(order.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {Number(order.tax || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tax</span>
                      <span>${Number(order.tax || 0).toLocaleString()}</span>
                    </div>
                  )}
                  {Number((order as any)?.shipping || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Shipping</span>
                      <span>${Number((order as any).shipping || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold border-t pt-2">
                    <span>Total</span>
                    <span>${Number(order.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Margin</span>
                    <span className="text-green-600 font-medium">
                      {Number((order as any)?.margin || 0).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Notes — always visible, editable */}
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
                      value={(order as any)?.notes || ""}
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
                      value={(order as any)?.customerNotes || ""}
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
                      value={(order as any)?.internalNotes || ""}
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
            </div>

            {/* Production Stages */}
            {/* {productionStages && productionStages.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Factory className="w-4 h-4" />
                    Production Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 py-2 overflow-x-auto">
                    {productionStages.map((stage: any, index: number) => {
                      const isCompleted = completedStages.includes(stage.id);
                      const isCurrent = currentStage === stage.id;
                      return (
                        <div key={stage.id} className="flex items-center">
                          <div
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${isCompleted
                              ? "bg-green-100 text-green-700"
                              : isCurrent
                                ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300"
                                : "bg-gray-100 text-gray-500"
                              }`}
                          >
                            {stage.name}
                          </div>
                          {index < productionStages.length - 1 && (
                            <div className={`w-4 h-0.5 ${isCompleted ? "bg-green-300" : "bg-gray-200"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )} */}

          </TabsContent>

          {/* Client Communication Tab */}
          <TabsContent value="client-email" className="mt-4">
            <EmailSection orderId={orderId} data={data} />
          </TabsContent>

          {/* Vendor Communication Tab */}
          <TabsContent value="vendor-email" className="mt-4">
            <VendorSection orderId={orderId} data={data} />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
