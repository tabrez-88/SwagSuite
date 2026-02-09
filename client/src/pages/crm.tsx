import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Building, Users, TrendingUp, UserCheck, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Import component contents directly for now
import Companies from "./crm/companies";
import Vendors from "./crm/vendors";
import Leads from "./crm/leads";
import Contacts from "./crm/contacts";

export default function CRM() {
  const [activeTab, setActiveTab] = useState("companies");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const syncYtdMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sync/ytd-spending");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `YTD spending synced! Updated ${data.companiesUpdated} companies, ${data.suppliersUpdated} suppliers, and ${data.productCountsUpdated} product counts.`,
      });
      // Refresh all CRM data
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
    onError: (error: Error) => {
      console.error('Sync error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sync YTD spending",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-swag-navy">CRM</h1>
            <p className="text-muted-foreground">
              Manage your customer relationships, vendors, sales leads, and contacts
            </p>
          </div>
          <Button
            onClick={() => syncYtdMutation.mutate()}
            disabled={syncYtdMutation.isPending}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncYtdMutation.isPending ? 'animate-spin' : ''}`} />
            {syncYtdMutation.isPending ? 'Syncing...' : 'Sync YTD Spending'}
          </Button>
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
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <UserCheck size={16} />
              Contacts
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

          <TabsContent value="contacts">
            <Contacts />
          </TabsContent>
        </Tabs>
    </div>
  );
}