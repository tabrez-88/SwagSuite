import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Users, TrendingUp, UserCheck } from "lucide-react";

// Import component contents directly for now
import Vendors from "./crm/vendors";
import Leads from "./crm/leads";
import Clients from "./crm/clients";

// Companies component (simplified version)
function Companies() {
  return (
    <div className="text-center py-12">
      <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-muted-foreground mb-2">Companies coming soon</h3>
      <p className="text-sm text-muted-foreground">
        Company management functionality will be available shortly.
      </p>
    </div>
  );
}

export default function CRM() {
  const [activeTab, setActiveTab] = useState("companies");

  return (
    <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-swag-navy">CRM</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships, vendors, sales leads, and clients
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building size={16} />
              Companies
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex items-center gap-2">
              <Users size={16} />
              Vendors
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <TrendingUp size={16} />
              Leads
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <UserCheck size={16} />
              Clients
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies">
            <Companies />
          </TabsContent>

          <TabsContent value="vendors">
            <Vendors />
          </TabsContent>

          <TabsContent value="leads">
            <Leads />
          </TabsContent>

          <TabsContent value="clients">
            <Clients />
          </TabsContent>
        </Tabs>
    </div>
  );
}