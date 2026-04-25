import { AlertCircle, ArrowLeft, Edit } from "lucide-react";
import NewProjectWizard from "@/components/modals/NewProjectWizard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompanyDetail } from "./hooks";
import { ENGAGEMENT_COLORS } from "./types";

import OverviewTab from "./sections/OverviewTab";
import ProjectsTab from "./sections/ProjectsTab";
import ContactsTab from "./sections/ContactsTab";
import AddressesTab from "./sections/AddressesTab";
import SocialMediaTab from "./sections/SocialMediaTab";
import ActivityTab from "./sections/ActivityTab";
import CompanyFormDialog from "../components/CompanyFormDialog";
import { useEditCompanyModal } from "./components/useEditCompanyModal";

export default function CompanyDetail() {
  const {
    company,
    companyId,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    isProjectModalOpen,
    setIsProjectModalOpen,
    handleCreateQuote,
    getInitials,
    setLocation,
  } = useCompanyDetail();

  const editModal = useEditCompanyModal(companyId, company);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-60" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Company not found</h2>
        <p className="text-muted-foreground">
          The company you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => setLocation("/crm")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to CRM
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/crm")}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-sm font-semibold bg-gray-200">
                {getInitials(company.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-swag-navy">{company.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {company.industry && <span>{company.industry}</span>}
                {company.accountNumber && (
                  <>
                    <span>·</span>
                    <span>#{company.accountNumber}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          {company.engagementLevel && (
            <Badge
              className={
                ENGAGEMENT_COLORS[company.engagementLevel as keyof typeof ENGAGEMENT_COLORS] ||
                ENGAGEMENT_COLORS.undefined
              }
            >
              {company.engagementLevel.charAt(0).toUpperCase() +
                company.engagementLevel.slice(1)}{" "}
              Engagement
            </Badge>
          )}
          <Button
            size="sm"
            className="bg-swag-primary hover:bg-swag-primary/90"
            onClick={editModal.openModal}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Company
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex gap-4 flex-wrap mb-4">
          <TabsTrigger className="flex-1" value="overview">Overview</TabsTrigger>
          <TabsTrigger className="flex-1" value="contacts">Contacts</TabsTrigger>
          <TabsTrigger className="flex-1" value="addresses">Addresses</TabsTrigger>
          <TabsTrigger className="flex-1" value="projects">Projects</TabsTrigger>
          <TabsTrigger className="flex-1" value="social">Social Media</TabsTrigger>
          <TabsTrigger className="flex-1" value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab
            company={company}
            companyId={companyId}
            onTabChange={setActiveTab}
            onCreateProject={handleCreateQuote}
          />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <ContactsTab companyId={String(company.id)} companyName={company.name} />
        </TabsContent>

        <TabsContent value="addresses" className="space-y-6">
          <AddressesTab companyId={companyId!} companyName={company.name} />
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <ProjectsTab
            companyId={companyId}
            onCreateProject={handleCreateQuote}
            onNavigate={setLocation}
          />
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <SocialMediaTab company={company} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <ActivityTab companyId={companyId} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <NewProjectWizard
        open={isProjectModalOpen}
        onOpenChange={setIsProjectModalOpen}
        initialCompanyId={company.id}
      />

      <CompanyFormDialog
        open={editModal.isOpen}
        onOpenChange={editModal.setIsOpen}
        company={company}
        onSubmit={editModal.handleSubmit}
        isPending={editModal.isPending}
        customFields={editModal.editCustomFields}
        onCustomFieldsChange={editModal.setEditCustomFields}
      />
    </div>
  );
}
