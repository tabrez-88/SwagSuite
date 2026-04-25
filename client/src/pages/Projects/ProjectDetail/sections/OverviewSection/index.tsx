import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Mail, Package, Store } from "lucide-react";

import EmailSection from "@/components/sections/EmailSection";
import VendorSection from "@/components/sections/VendorSection";
import ActivitiesSection from "@/pages/Projects/ProjectDetail/sections/OverviewSection/ActivitiesSection";

import { useMarginSettings } from "@/hooks/useMarginSettings";
import { useOverviewSection } from "./hooks";
import type { OverviewSectionProps } from "./types";

import ProjectDetailsCard from "./components/ProjectDetailsCard";
import FinancialSummaryCard from "./components/FinancialSummaryCard";
import NotesCard from "./components/NotesCard";

export default function OverviewSection(props: OverviewSectionProps) {
  const hook = useOverviewSection(props);
  const marginSettings = useMarginSettings();

  const {
    order,
    orderItems,
    data,
    projectId,
    isLocked,
    updateField,
    isPending,
    reassignMutation,
    openPopover,
    setOpenPopover,
    renderDateBadge,
    totalQuantity,
    companyName,
    primaryContact,
    assignedUser,
    csrUser,
    teamMembers,
  } = hook;

  if (!order) return null;

  const renderDateBadgeJsx = (dateValue: string) => {
    const ds = renderDateBadge(dateValue);
    return ds ? <Badge className={`text-[10px] px-1.5 py-0 leading-4 ${ds.color}`}>{ds.label}</Badge> : null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Internal Notes & Activities */}
        <ActivitiesSection projectId={projectId} data={data} />

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
              <ProjectDetailsCard
                order={order}
                companyName={companyName}
                primaryContact={primaryContact}
                assignedUser={assignedUser}
                csrUser={csrUser}
                teamMembers={teamMembers}
                businessStage={data.businessStage}
                isLocked={isLocked}
                updateField={updateField}
                isPending={isPending}
                openPopover={openPopover}
                setOpenPopover={setOpenPopover}
                onReassign={(vars) => reassignMutation.mutate(vars as Parameters<typeof reassignMutation.mutate>[0])}
                renderDateBadgeJsx={renderDateBadgeJsx}
              />

              {/* Items Count */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Items</p>
                      <p className="text-lg font-bold">{orderItems.length}</p>
                      <p className="text-xs text-gray-500">
                        Qty: {totalQuantity}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <FinancialSummaryCard
                order={order}
                marginSettings={marginSettings}
              />

              <NotesCard
                order={order}
                isLocked={isLocked}
                updateField={updateField}
                isPending={isPending}
              />
            </div>
          </TabsContent>

          {/* Client Communication Tab */}
          <TabsContent value="client-email" className="mt-4">
            <EmailSection projectId={projectId} data={data} />
          </TabsContent>

          {/* Vendor Communication Tab */}
          <TabsContent value="vendor-email" className="mt-4">
            <VendorSection projectId={projectId} data={data} />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
